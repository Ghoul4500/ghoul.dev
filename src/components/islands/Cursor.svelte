<script lang="ts">
  import { onMount } from 'svelte';

  let dot = $state<HTMLDivElement | null>(null);
  let ring = $state<HTMLDivElement | null>(null);
  let label = $state<HTMLDivElement | null>(null);
  let labelText = $state('');
  let active = $state(false);
  let visible = $state(false);

  onMount(() => {
    if (matchMedia('(hover: none)').matches) return;
    visible = true;

    let tx = 0, ty = 0, rx = 0, ry = 0;
    let mx = 0, my = 0;
    const dotOffset = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!visible) visible = true;
    };

    const onOver = (e: MouseEvent) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('[data-cursor]');
      if (t) {
        active = true;
        labelText = t.dataset.cursor || '';
      } else {
        active = false;
        labelText = '';
      }
    };

    const onLeave = () => { visible = false; };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseover', onOver, { passive: true });
    document.addEventListener('mouseleave', onLeave);

    let raf = 0;
    const tick = () => {
      tx += (mx - tx) * 0.9;
      ty += (my - ty) * 0.9;
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      if (dot) dot.style.transform = `translate3d(${tx - dotOffset}px, ${ty - dotOffset}px, 0)`;
      if (ring) ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${active ? 2.2 : 1})`;
      if (label) label.style.transform = `translate3d(${rx + 22}px, ${ry + 10}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseleave', onLeave);
    };
  });
</script>

{#if visible}
  <div
    bind:this={dot}
    class="pointer-events-none fixed left-0 top-0 z-[200] h-1 w-1 rounded-full bg-[var(--color-acid)] mix-blend-difference"
  ></div>
  <div
    bind:this={ring}
    class="pointer-events-none fixed left-0 top-0 z-[199] h-8 w-8 rounded-full border border-[var(--color-ink)] mix-blend-difference transition-[border-color,background-color,width,height] duration-200"
    class:active
    style="transition-property: transform, background-color, border-color;"
  ></div>
  {#if labelText}
    <div
      bind:this={label}
      class="pointer-events-none fixed left-0 top-0 z-[201] select-none font-mono text-[11px] uppercase tracking-widest text-[var(--color-bg)] bg-[var(--color-acid)] px-2 py-1 rounded-sm"
    >
      {labelText}
    </div>
  {/if}
{/if}

<style>
  .active { background-color: color-mix(in srgb, var(--color-acid) 14%, transparent); }
</style>
