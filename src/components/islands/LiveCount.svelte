<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    /** which stat key on /api/github/stats to surface */
    field: 'asus_linux_mrs' | 'ogc_prs' | 'total_public_prs' | 'public_repos' | 'followers';
    /** static fallback shown until live data arrives (or if the fetch fails) */
    fallback: number;
  }
  let { field, fallback }: Props = $props();

  let value = $state<number | null>(null);

  onMount(async () => {
    try {
      const res = await fetch('/api/github/stats');
      if (!res.ok) return;
      const data = await res.json();
      const v = data?.[field];
      if (typeof v === 'number') value = v;
    } catch {
      /* keep fallback */
    }
  });
</script>

<span class="inline-flex items-baseline gap-2">
  <span>{value ?? fallback}</span>
  {#if value === null}
    <span
      class="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-acid)]/60"
      title="loading live count"
    ></span>
  {/if}
</span>
