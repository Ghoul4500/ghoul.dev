<script lang="ts">
  import { onMount } from 'svelte';

  type Stats = {
    followers: number;
    public_repos: number;
    total_public_prs: number;
    contribution_orgs: { totals: { commits: number } }[];
    languages: { name: string; pct: number }[];
    updated_at: string;
  } | null;

  let data = $state<Stats>(null);
  let err = $state<string | null>(null);

  onMount(async () => {
    try {
      const res = await fetch('/api/github/stats');
      if (!res.ok) throw new Error(String(res.status));
      data = await res.json();
    } catch (e: any) {
      err = e?.message ?? 'offline';
    }
  });

  // Muted, evenly spaced palette — first six are the site accents,
  // the rest stretch the range so all languages get a legible colour
  // even when there are 15+ of them.
  const PALETTE = [
    '#c9ff00', '#ff5f1f', '#9d7cff', '#6ee7f0', '#f472b6', '#9a968c',
    '#8abe63', '#d69360', '#7a9cc9', '#c4a050', '#76b3a5', '#d67070',
    '#a289c4', '#a5c463', '#7fbcd9', '#c98a63', '#8ca173', '#be8ac4',
    '#b09f6e', '#5f6c78',
  ];
  const color = (i: number) => PALETTE[i % PALETTE.length];

  const osCommits = $derived(
    data?.contribution_orgs?.reduce((s, o) => s + (o.totals?.commits ?? 0), 0) ?? null
  );
</script>

<div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
  <div class="stat">
    <div class="label">OS commits</div>
    <div class="value">
      {#if osCommits !== null}{osCommits}{:else}<span class="skel"></span>{/if}
    </div>
  </div>
  <div class="stat">
    <div class="label">public PRs</div>
    <div class="value">
      {#if data}{data.total_public_prs}{:else}<span class="skel"></span>{/if}
    </div>
  </div>
  <div class="stat">
    <div class="label">repos</div>
    <div class="value">
      {#if data}{data.public_repos}{:else}<span class="skel"></span>{/if}
    </div>
  </div>
  <div class="stat">
    <div class="label">followers</div>
    <div class="value">
      {#if data}{data.followers}{:else}<span class="skel"></span>{/if}
    </div>
  </div>
</div>

{#if data && data.languages?.length}
  <div class="mt-10">
    <div class="flex items-baseline justify-between gap-4 mb-3">
      <div class="font-mono text-[11px] uppercase tracking-widest text-[var(--color-ink-faint)]">
        languages I actually write
      </div>
      <div class="font-mono text-[10.5px] tracking-widest text-[var(--color-ink-faint)]">
        {data.languages.length} langs
      </div>
    </div>
    <div class="flex h-2 w-full overflow-hidden rounded-full bg-white/5 ring-line">
      {#each data.languages as lang, i}
        <div
          class="h-full transition-all duration-700"
          style="width: {lang.pct}%; background: {color(i)};"
          title="{lang.name} {lang.pct.toFixed(1)}%"
        ></div>
      {/each}
    </div>
    <div class="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-[12px] font-mono">
      {#each data.languages as lang, i}
        <span class="inline-flex items-center gap-1.5 text-[var(--color-ink-dim)]">
          <span class="h-2 w-2 rounded-full flex-none" style="background: {color(i)};"></span>
          {lang.name}
          <span class="text-[var(--color-ink-faint)]">
            {lang.pct < 1 ? '<1' : lang.pct.toFixed(0)}%
          </span>
        </span>
      {/each}
    </div>
  </div>
{/if}

{#if err}
  <div class="mt-6 font-mono text-xs text-[var(--color-ink-faint)]">
    live feed offline · fallback values shown on cards
  </div>
{/if}

<style>
  .stat {
    padding: 1.25rem;
    border: 1px solid color-mix(in srgb, white 8%, transparent);
    border-radius: 14px;
    background: color-mix(in srgb, white 2%, transparent);
  }
  .label {
    font-family: var(--font-mono);
    font-size: 10.5px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-ink-faint);
  }
  .value {
    font-family: var(--font-display);
    font-size: 2.75rem;
    font-weight: 500;
    margin-top: 0.65rem;
    letter-spacing: -0.03em;
    line-height: 1;
  }
  .skel {
    display: inline-block;
    width: 2.5rem; height: 2.25rem;
    background: color-mix(in srgb, white 6%, transparent);
    border-radius: 6px;
    animation: p 1.4s ease-in-out infinite;
  }
  @keyframes p { 0%,100%{opacity:.55} 50%{opacity:1} }
</style>
