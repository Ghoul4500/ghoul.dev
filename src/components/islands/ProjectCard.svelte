<script lang="ts">
  import type { Project } from '../../lib/projects.ts';

  interface Props {
    project: Project;
    index: number;
  }
  let { project, index }: Props = $props();

  let card = $state<HTMLAnchorElement | null>(null);
  let rx = $state(0), ry = $state(0), mx = $state(50), my = $state(50);

  const onMove = (e: MouseEvent) => {
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    ry = (x - 0.5) * 10;
    rx = (0.5 - y) * 10;
    mx = x * 100;
    my = y * 100;
  };
  const onLeave = () => { rx = 0; ry = 0; };

  const accentVar = $derived(
    project.accent === 'ember' ? 'var(--color-ember)' :
    project.accent === 'violet' ? 'var(--color-violet)' :
    project.accent === 'cyan' ? 'var(--color-cyan)' :
    'var(--color-acid)'
  );

  const num = $derived.by(() => String(index + 1).padStart(2, '0'));
</script>

<a
  bind:this={card}
  href={project.url}
  target="_blank"
  rel="noopener noreferrer"
  onmousemove={onMove}
  onmouseleave={onLeave}
  data-cursor="view"
  class="group relative block w-full [perspective:1200px]"
  style="--accent: {accentVar}; --mx: {mx}%; --my: {my}%;"
>
  <div
    class="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.015] p-7 md:p-9 ring-line shadow-soft transition-[border-color] duration-500 group-hover:border-white/15 [transform-style:preserve-3d]"
    style="transform: rotateX({rx}deg) rotateY({ry}deg);"
  >
    <!-- glow follow -->
    <div
      role="presentation"
      class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      style="background: radial-gradient(400px circle at var(--mx) var(--my), color-mix(in srgb, var(--accent) 18%, transparent), transparent 55%);"
    ></div>

    <div class="relative flex items-start justify-between gap-6">
      <div class="flex items-center gap-3">
        <span class="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--color-ink-faint)]">
          {num} / {project.kind}
        </span>
      </div>
      <span
        class="font-mono text-[11px] tracking-[0.2em] uppercase"
        style="color: var(--accent)"
      >
        {project.year}
      </span>
    </div>

    <h3 class="relative mt-6 font-display text-2xl md:text-4xl font-semibold leading-[1.05] tracking-[-0.015em]">
      <span class="text-[var(--color-acid)]">&gt;</span> {project.name}
    </h3>

    <p class="relative mt-3 max-w-xl font-body text-base md:text-lg text-[var(--color-ink-dim)] font-light">
      {project.tagline}
    </p>

    <p class="relative mt-5 max-w-2xl font-body text-[14.5px] leading-[1.65] text-[var(--color-ink-dim)] font-light">
      {project.description}
    </p>

    <div class="relative mt-7 flex flex-wrap items-center gap-2">
      {#each project.stack as tech}
        <span class="font-mono text-[10.5px] uppercase tracking-[0.18em] px-2.5 py-1 rounded-md border border-white/10 text-[var(--color-ink)]/85">
          {tech}
        </span>
      {/each}
    </div>

    <div class="relative mt-8 flex items-center justify-between">
      <span class="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-faint)]">
        {new URL(project.url).hostname.replace('www.','')}
      </span>
      <span
        class="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] transition-all duration-300"
        style="color: var(--accent)"
      >
        view source
        <svg class="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M2 10 L10 2 M4 2 H10 V8"/>
        </svg>
      </span>
    </div>
  </div>
</a>
