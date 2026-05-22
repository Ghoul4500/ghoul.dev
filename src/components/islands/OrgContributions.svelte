<script lang="ts">
  import { onMount } from 'svelte';
  import type { ManualPatch } from '../../lib/projects.ts';

  type RepoSummary = {
    repo: string;
    fullName: string;
    url: string;
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

  // Owners we render cards for: union of live-data owners and manual-patch
  // owners. Order: live-data owners first (in server-defined order), then any
  // manual-only owners.
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

  const liveByOwner = $derived(
    new Map((orgs ?? []).map((o) => [o.owner, o]))
  );
  const manualByOwner = $derived(() => {
    const m = new Map<string, ManualPatch[]>();
    for (const p of manualPatches) {
      if (!m.has(p.owner)) m.set(p.owner, []);
      m.get(p.owner)!.push(p);
    }
    return m;
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

  function statusLabel(s: ManualPatch['status']): string {
    switch (s) {
      case 'submitted':           return 'submitted';
      case 'in-maintainer-tree':  return 'maintainer tree';
      case 'in-linux-next':       return 'linux-next';
      case 'in-mainline':         return 'mainline';
    }
  }
</script>

{#if orgs === null && !loadError}
  <div class="mb-6 break-inside-avoid rounded-2xl border border-white/[0.06] bg-white/[0.015] p-7 md:p-9 ring-line">
    <div class="h-6 w-2/3 rounded bg-white/5 animate-pulse"></div>
    <div class="mt-3 h-3 w-1/3 rounded bg-white/5 animate-pulse"></div>
    <div class="mt-8 space-y-2">
      {#each Array(4) as _}
        <div class="h-3 rounded bg-white/[0.04] animate-pulse"></div>
      {/each}
    </div>
  </div>
{:else}
  {#each ownerSet() as owner (owner)}
    {@const live = liveByOwner.get(owner)}
    {@const patches = manualByOwner().get(owner) ?? []}
    <a
      href={ORG_URL[owner] ?? `https://github.com/${owner}`}
      target="_blank"
      rel="noopener noreferrer"
      data-cursor="view"
      class="mb-6 break-inside-avoid group relative overflow-hidden rounded-2xl border border-white/[0.06] hover:border-white/20 transition-colors bg-white/[0.015] p-7 md:p-9 ring-line block"
    >
      <div class="flex items-start justify-between gap-4">
        <div>
          <h3 class="font-display text-xl md:text-2xl font-semibold tracking-[-0.01em]">
            {ORG_LABEL[owner] ?? owner}
          </h3>
          <div class="mt-1 label normal-case tracking-wider text-[var(--color-ink-dim)]">
            Contributor
          </div>
        </div>
        {#if live}
          <div class="text-right">
            <div class="font-display text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-[var(--color-acid)]">
              {live.totals.commits}
            </div>
            <div class="label mt-0.5">commits</div>
            <div class="mt-1 font-mono text-[10.5px] text-[var(--color-ink-dim)]">
              +{compact(live.totals.additions)} / −{compact(live.totals.deletions)}
            </div>
          </div>
        {/if}
      </div>

      {#if live && live.repos.length > 0}
        <ul class="mt-6 divide-y divide-white/[0.05]">
          {#each live.repos as r}
            <li class="py-2.5 font-mono text-[12px] flex items-baseline justify-between gap-3">
              <span class="text-[var(--color-ink)] truncate">{r.repo}</span>
              <span class="flex items-baseline gap-3 text-[var(--color-ink-dim)] whitespace-nowrap">
                <span>{r.commits} cmt</span>
                <span class="text-[var(--color-ink-faint)]">
                  +{compact(r.additions)} / −{compact(r.deletions)}
                </span>
                {#if r.approvedOpenPrs > 0}
                  <span class="text-[var(--color-ember)]">
                    {r.approvedOpenPrs} approved
                  </span>
                {/if}
              </span>
            </li>
          {/each}
        </ul>
      {/if}

      {#if patches.length > 0}
        <div class="mt-6 pt-5 border-t border-white/[0.06]">
          <div class="label mb-3 text-[var(--color-ink-faint)]">— upstream in flight</div>
          <ul class="space-y-2.5">
            {#each patches as p}
              <li class="font-mono text-[11.5px] leading-relaxed">
                <div class="flex items-baseline gap-2 flex-wrap">
                  <span class="text-[var(--color-cyan)]">{p.project}</span>
                  <span class="text-[var(--color-ink-faint)]">{p.sha.slice(0, 10)}</span>
                  <span class="text-[var(--color-ink-faint)]">·</span>
                  <span class="text-[var(--color-ember)]">{statusLabel(p.status)}</span>
                </div>
                <div class="mt-0.5 text-[var(--color-ink-dim)] font-body text-[13px]">
                  {p.subject}
                </div>
              </li>
            {/each}
          </ul>
        </div>
      {/if}

      {#if !live && patches.length === 0}
        <div class="mt-6 font-mono text-[12px] text-[var(--color-ink-faint)]">
          no live data
        </div>
      {/if}
    </a>
  {/each}

  {#if loadError && ownerSet().length === 0}
    <div class="mb-6 break-inside-avoid rounded-2xl border border-white/[0.06] bg-white/[0.015] p-7 font-mono text-[12px] text-[var(--color-ink-faint)] ring-line">
      contribution data unavailable
    </div>
  {/if}
{/if}
