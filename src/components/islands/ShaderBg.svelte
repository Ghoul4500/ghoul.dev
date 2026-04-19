<script lang="ts">
  import { onMount } from 'svelte';

  let canvas = $state<HTMLCanvasElement | null>(null);

  const VERT = `
    attribute vec2 a_pos;
    void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
  `;

  // Old-TV / VHS shader: horizontal signal tearing, rare glitch bands,
  // chromatic aberration, rolling phosphor, scanlines, rare signal-loss.
  // All scaled low so it's not a strain on the eyes.
  const FRAG = `
    precision highp float;
    uniform vec2 u_res;
    uniform float u_time;
    uniform vec2 u_mouse;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float hash1(float p) { return fract(sin(p * 12.9898) * 43758.5453); }

    float noise1(float p) {
      float i = floor(p);
      float f = fract(p);
      return mix(hash1(i), hash1(i + 1.0), smoothstep(0.0, 1.0, f));
    }

    // procedural "signal" per-pixel: dark graphite with subtle vignette
    vec3 signal(vec2 uv) {
      float r = length(uv);
      float vig = smoothstep(1.40, 0.10, r);
      vec3 base = vec3(0.048, 0.053, 0.062);
      base *= mix(0.42, 1.0, vig);

      // faint horizontal bands (static TV look)
      float bands = sin(uv.y * 180.0 + sin(uv.y * 40.0) * 0.8) * 0.006;
      base += bands;

      return base;
    }

    void main() {
      vec2 fc = gl_FragCoord.xy;
      vec2 uv = (fc - 0.5 * u_res) / min(u_res.x, u_res.y);
      vec2 m = (u_mouse - 0.5 * u_res) / min(u_res.x, u_res.y);
      float t = u_time;

      // ----- DISTORTION PIPELINE -----

      // 1) subtle barrel
      float r2 = dot(uv, uv);
      uv *= 1.0 + r2 * 0.03;

      // 2) per-row horizontal tear — VHS row slip
      float rowN = noise1(uv.y * 90.0 + t * 0.9);
      rowN = pow(rowN, 3.0);
      float tear = (rowN - 0.5) * 0.025;

      // 3) glitch band — rare, a band at random y that slams
      float slot = floor(t * 0.55);
      float bandY = hash1(slot) * 2.0 - 1.0;
      float bandActive = step(0.80, hash1(slot + 7.17));   // ~20% of slots
      float inBand = smoothstep(0.035, 0.0, abs(uv.y - bandY));
      float bandShift = inBand * bandActive * (hash1(t * 26.0) - 0.5) * 0.22;
      tear += bandShift;

      // 4) occasional vsync jump — the whole picture bumps vertically
      float vsSlot = floor(t * 0.25);
      float vsActive = step(0.92, hash1(vsSlot + 3.3));  // very rare
      float vsJump = vsActive * (hash1(t * 14.0) - 0.5) * 0.15;

      vec2 uvR = uv + vec2(tear + 0.003, vsJump);
      vec2 uvG = uv + vec2(tear,          vsJump);
      vec2 uvB = uv + vec2(tear - 0.003, vsJump);

      // 5) sample procedural signal w/ chromatic aberration
      vec3 col;
      col.r = signal(uvR).r;
      col.g = signal(uvG).g;
      col.b = signal(uvB).b;

      // 6) rolling phosphor band — slow, very soft
      float roll = fract(t * 0.04);
      float bandGlow = smoothstep(0.013, 0.0, abs((fc.y / u_res.y) - roll));
      col += bandGlow * vec3(0.08, 0.10, 0.07) * 0.30;

      // 7) scanlines — denser
      float sl = 0.5 + 0.5 * cos(fc.y * 3.14159);
      col *= 0.93 + 0.07 * sl;

      // 8) signal-loss moment — very rare, heavy static burst
      float lossSlot = floor(t * 0.22);
      float lossActive = step(0.94, hash1(lossSlot + 5.91));
      float lossT = fract(t * 0.22);
      float lossEnv = smoothstep(0.0, 0.08, lossT) * smoothstep(0.35, 0.10, lossT);
      float staticN = hash(fc + floor(t * 50.0));
      col += lossActive * lossEnv * (staticN - 0.5) * 0.25;

      // 9) hotline — a bright horizontal line flashes occasionally
      float htSlot = floor(t * 1.2);
      float htActive = step(0.88, hash1(htSlot + 11.7));
      float htY = hash1(htSlot + 31.0) * 2.0 - 1.0;
      float htLine = smoothstep(0.003, 0.0, abs(uv.y - htY));
      col += htLine * htActive * vec3(0.30, 0.40, 0.20) * 0.25;

      // 10) mouse phosphor — subtle matcha
      float dM = length(uv - m);
      float pulse = smoothstep(0.78, 0.0, dM);
      col += vec3(0.42, 0.54, 0.20) * pulse * 0.08;

      // 11) global flicker (jitter brightness)
      float flick = 1.0 + (hash1(floor(t * 16.0)) - 0.5) * 0.028;
      col *= flick;

      // 12) grain
      col += (hash(fc + t) - 0.5) * 0.014;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  onMount(() => {
    if (!canvas) return;
    const el = canvas;
    const gl = el.getContext('webgl', { antialias: false, preserveDrawingBuffer: false });
    if (!gl) {
      el.style.background =
        'radial-gradient(1200px 800px at 50% 50%, rgba(157,196,77,0.03), transparent), #0c0d10';
      return;
    }

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('shader error:', gl.getShaderInfoLog(s));
      }
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const a_pos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(a_pos);
    gl.vertexAttribPointer(a_pos, 2, gl.FLOAT, false, 0, 0);

    const u_res = gl.getUniformLocation(prog, 'u_res');
    const u_time = gl.getUniformLocation(prog, 'u_time');
    const u_mouse = gl.getUniformLocation(prog, 'u_mouse');

    let w = 0, h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    const resize = () => {
      w = Math.floor(window.innerWidth * dpr);
      h = Math.floor(window.innerHeight * dpr);
      el.width = w;
      el.height = h;
      el.style.width = window.innerWidth + 'px';
      el.style.height = window.innerHeight + 'px';
      gl.viewport(0, 0, w, h);
    };
    resize();
    window.addEventListener('resize', resize);

    let mouse = { x: w / 2, y: h / 2 };
    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX * dpr;
      mouse.y = (window.innerHeight - e.clientY) * dpr;
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    const start = performance.now();
    let running = true;
    let lastPaint = 0;

    const onVis = () => { running = !document.hidden; if (running) raf(); };
    document.addEventListener('visibilitychange', onVis);

    const raf = (t?: number) => {
      if (!running) return;
      const now = t ?? performance.now();
      if (now - lastPaint > 22) { // ~45 fps — glitches need a little speed to feel alive
        gl.uniform2f(u_res, w, h);
        gl.uniform1f(u_time, (now - start) / 1000);
        gl.uniform2f(u_mouse, mouse.x, mouse.y);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        lastPaint = now;
      }
      requestAnimationFrame(raf);
    };
    raf();

    return () => {
      running = false;
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('visibilitychange', onVis);
    };
  });
</script>

<canvas
  bind:this={canvas}
  class="fixed inset-0 -z-10 h-screen w-screen pointer-events-none"
  aria-hidden="true"
></canvas>
