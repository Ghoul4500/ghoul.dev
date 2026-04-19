<script lang="ts">
  interface Props {
    items: string[];
    separator?: string;
  }
  let { items, separator = '✦' }: Props = $props();
  const doubled = $derived.by(() => [...items, ...items]);
</script>

<div class="relative overflow-hidden py-6 border-y hairline">
  <div class="marquee-track flex whitespace-nowrap gap-10 will-change-transform">
    {#each doubled as item, i (i)}
      <span class="font-display text-2xl md:text-3xl font-light tracking-tight inline-flex items-center gap-10">
        {item}
        <span class="text-[var(--color-acid)] opacity-70 text-sm">{separator}</span>
      </span>
    {/each}
  </div>
</div>
