<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    items: string[];
    separator?: string;
  }
  let { items, separator = '✦' }: Props = $props();
  const doubled = $derived.by(() => [...items, ...items]);

  let track = $state<HTMLDivElement | null>(null);

  /**
   * Target scroll speed in px/s, scaled by viewport width. Narrow screens get
   * faster motion (smaller items need more motion to feel alive); wide screens
   * get gentler motion (larger items + sparser layout already feels active at
   * lower speeds). Linear interp clamped between 110 (≥1800px) and 240 (≤420px).
   */
  function targetSpeedFor(vw: number): number {
    const minSpeed = 110, maxSpeed = 240;
    const wideVw = 1800, narrowVw = 420;
    if (vw >= wideVw) return minSpeed;
    if (vw <= narrowVw) return maxSpeed;
    const t = (wideVw - vw) / (wideVw - narrowVw);
    return minSpeed + (maxSpeed - minSpeed) * t;
  }

  onMount(() => {
    if (!track) return;
    // CSS animation translates the track from 0 to -50% of its own width (one
    // full set, since `doubled` is two passes). Visible px/s = halfWidth /
    // duration. Recompute duration so observed speed matches the
    // viewport-tuned target, regardless of how wide the track ends up.
    const apply = () => {
      if (!track) return;
      const speed = targetSpeedFor(window.innerWidth);
      const halfWidth = track.scrollWidth / 2;
      const duration = halfWidth / speed;
      track.style.animationDuration = `${duration}s`;
    };
    apply();

    const ro = new ResizeObserver(apply);
    ro.observe(track);
    window.addEventListener('resize', apply);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', apply);
    };
  });
</script>

<div class="relative overflow-hidden py-6 border-y hairline">
  <div
    bind:this={track}
    class="marquee-track flex whitespace-nowrap gap-10 will-change-transform"
  >
    {#each doubled as item, i (i)}
      <span class="font-display text-2xl md:text-3xl font-light tracking-tight inline-flex items-center gap-10">
        {item}
        <span class="text-[var(--color-acid)] opacity-70 text-sm">{separator}</span>
      </span>
    {/each}
  </div>
</div>
