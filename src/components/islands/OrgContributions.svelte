<script lang="ts">
  import { onMount } from 'svelte';
  import type { ManualPatch } from '../../lib/projects.ts';

  type RepoSummary = {
    repo: string;
    fullName: string;
    url: string;
    description: string | null;
    commits: number;
    additions: number;
    deletions: number;
    approvedOpenPrs: number;
  };
  type OrgBreakdown = {
    owner: string;
    totals: { commits: number; additions: number; deletions: number };
    repos: RepoSummary[];
  };

  interface Props {
    manualPatches: ManualPatch[];
  }
  let { manualPatches }: Props = $props();

  let orgs = $state<OrgBreakdown[] | null>(null);
  let loadError = $state(false);

  onMount(async () => {
    try {
      const res = await fetch('/api/github/stats');
      if (!res.ok) {
        loadError = true;
        return;
      }
      const data = await res.json();
      orgs = Array.isArray(data?.contribution_orgs) ? data.contribution_orgs : [];
    } catch {
      loadError = true;
    }
  });

  const ORG_URL: Record<string, string> = {
    OpenGamingCollective: 'https://github.com/OpenGamingCollective',
    'caelestia-dots': 'https://github.com/caelestia-dots',
  };
  const ORG_LABEL: Record<string, string> = {
    OpenGamingCollective: 'Open Gaming Collective',
    'caelestia-dots': 'caelestia-dots',
  };

  function compact(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  }

  /**
   * Returns the green/red split widths for a diff bar, in percent. Pure
   * composition signal (additions vs deletions ratio) — magnitude is conveyed
   * by the +X/−Y numbers shown alongside. Matches the GitHub PR diff aesthetic.
   * Empty/zero falls back to a thin neutral fill so the bar isn't invisible.
   */
  function diffSplit(a: number, d: number) {
    const total = a + d;
    if (total === 0) return { add: 0, del: 0, empty: true };
    return { add: (a / total) * 100, del: (d / total) * 100, empty: false };
  }

  function statusLabel(s: ManualPatch['status']): string {
    switch (s) {
      case 'submitted':           return 'submitted';
      case 'in-maintainer-tree':  return 'maintainer tree';
      case 'in-linux-next':       return 'linux-next';
      case 'in-mainline':         return 'mainline';
    }
  }

  const ownerSet = $derived(() => {
    const fromLive = orgs?.map((o) => o.owner) ?? [];
    const fromManual = [...new Set(manualPatches.map((p) => p.owner))];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const o of [...fromLive, ...fromManual]) {
      if (seen.has(o)) continue;
      seen.add(o);
      out.push(o);
    }
    return out;
  });

  const liveByOwner = $derived(new Map((orgs ?? []).map((o) => [o.owner, o])));
</script>

{#if orgs === null && !loadError}
  <div class="space-y-10">
    {#each Array(2) as _}
      <div>
        <div class="h-3 w-1/3 rounded bg-white/[0.04] animate-pulse"></div>
        <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each Array(3) as _}
            <div class="rounded-xl border border-white/[0.06] bg-white/[0.015] p-5 h-36">
              <div class="h-4 w-2/3 rounded bg-white/5 animate-pulse"></div>
              <div class="mt-2 h-3 w-1/2 rounded bg-white/[0.04] animate-pulse"></div>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
{:else}
  <div class="space-y-12">
    {#each ownerSet() as owner (owner)}
      {@const live = liveByOwner.get(owner)}
      <div>
        <!-- Org header strip -->
        <div class="flex items-baseline gap-4 flex-wrap mb-5">
          <a
            href={ORG_URL[owner] ?? `https://github.com/${owner}`}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="view"
            class="font-display text-xl md:text-2xl font-semibold tracking-[-0.01em] text-[var(--color-ink)] hover:text-[var(--color-acid)] transition-colors"
          >
            {ORG_LABEL[owner] ?? owner}
          </a>
          <span class="flex-1 h-px bg-[var(--color-ink-faint)]/30 min-w-[2rem]"></span>
          {#if live}
            <span class="font-mono text-[11.5px] text-[var(--color-ink-dim)] whitespace-nowrap">
              <span class="text-[var(--color-acid)]">{live.totals.commits}</span> commits
              <span class="text-[var(--color-ink-faint)] mx-1">·</span>
              <span class="text-emerald-400/80">+{compact(live.totals.additions)}</span>
              <span class="text-[var(--color-ink-faint)]">/</span>
              <span class="text-rose-400/80">−{compact(live.totals.deletions)}</span>
              <span class="text-[var(--color-ink-faint)] mx-1">·</span>
              {live.repos.length} {live.repos.length === 1 ? 'repo' : 'repos'}
            </span>
          {/if}
        </div>

        <!-- Repo card grid -->
        {#if live && live.repos.length > 0}
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each live.repos as r}
              {@const split = diffSplit(r.additions, r.deletions)}
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="view"
                class="group flex flex-col rounded-xl border border-white/[0.06] hover:border-white/20 transition-colors bg-white/[0.015] p-5 ring-line"
              >
                <div class="flex items-baseline gap-2">
                  <span class="text-[var(--color-acid)] font-mono text-[14px] leading-none">⎇</span>
                  <h3 class="font-display text-[15px] font-semibold tracking-[-0.005em] text-[var(--color-ink)] truncate">
                    {r.repo}
                  </h3>
                </div>
                <p class="mt-1.5 font-body text-[12.5px] leading-snug text-[var(--color-ink-dim)] min-h-[2.25em] line-clamp-2">
                  {r.description ?? '—'}
                </p>

                <div class="mt-4 flex items-baseline justify-between gap-2 font-mono text-[11px]">
                  <span class="text-[var(--color-ink-dim)]">
                    {r.commits} {r.commits === 1 ? 'commit' : 'commits'}
                  </span>
                  <span class="text-[var(--color-ink-faint)]">
                    <span class="text-emerald-400/85">+{compact(r.additions)}</span>
                    <span class="mx-0.5">/</span>
                    <span class="text-rose-400/85">−{compact(r.deletions)}</span>
                  </span>
                </div>

                <div class="mt-1.5 flex h-1 rounded-full overflow-hidden bg-white/[0.06]">
                  {#if split.empty}
                    <div class="h-full w-full bg-white/[0.04]"></div>
                  {:else}
                    <div class="h-full bg-emerald-400/70" style="width: {split.add}%"></div>
                    <div class="h-full bg-rose-400/70" style="width: {split.del}%"></div>
                  {/if}
                </div>

                {#if r.approvedOpenPrs > 0}
                  <div class="mt-3 inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--color-ember)]">
                    <span class="h-1.5 w-1.5 rounded-full bg-[var(--color-ember)] animate-pulse"></span>
                    {r.approvedOpenPrs} approved · pending merge
                  </div>
                {/if}
              </a>
            {/each}
          </div>
        {/if}
      </div>
    {/each}

    <!-- Upstream in flight (manual patches across all owners) -->
    {#if manualPatches.length > 0}
      <div>
        <div class="flex items-baseline gap-4 flex-wrap mb-5">
          <span class="font-display text-base font-semibold tracking-[-0.005em] text-[var(--color-ink)]">
            upstream in flight
          </span>
          <span class="flex-1 h-px bg-[var(--color-ink-faint)]/30 min-w-[2rem]"></span>
          <span class="font-mono text-[11.5px] text-[var(--color-ink-dim)]">
            {manualPatches.length} {manualPatches.length === 1 ? 'patch' : 'patches'}
          </span>
        </div>
        <ul class="rounded-xl border border-white/[0.06] bg-white/[0.015] ring-line divide-y divide-white/[0.05]">
          {#each manualPatches as p}
            <li class="p-4 font-mono text-[12px]">
              <div class="flex items-baseline gap-2 flex-wrap">
                <span class="text-[var(--color-cyan)]">{p.project}</span>
                {#if p.treeUrl}
                  <a
                    href={p.treeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor="view"
                    class="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors"
                  >
                    {p.sha.slice(0, 10)}
                  </a>
                {:else}
                  <span class="text-[var(--color-ink-faint)]">{p.sha.slice(0, 10)}</span>
                {/if}
                <span class="text-[var(--color-ink-faint)]">·</span>
                <span class="text-[var(--color-ember)] uppercase tracking-[0.14em] text-[10.5px]">
                  {statusLabel(p.status)}
                </span>
              </div>
              <div class="mt-1 text-[var(--color-ink-dim)] font-body text-[13px]">
                {p.subject}
              </div>
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    {#if loadError && ownerSet().length === 0}
      <div class="rounded-xl border border-white/[0.06] bg-white/[0.015] p-5 font-mono text-[12px] text-[var(--color-ink-faint)] ring-line">
        contribution data unavailable
      </div>
    {/if}
  </div>
{/if}
