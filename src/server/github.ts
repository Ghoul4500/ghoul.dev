import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

type CacheEntry<T> = { value: T; expires: number };
const cache = new Map<string, CacheEntry<any>>();
const TTL = 10 * 60 * 1000;

/**
 * Resolve the GitHub token from the server environment.
 * Never exposed to the client — server-side only.
 */
function getToken(): string | undefined {
  const fromImport = (import.meta as any).env?.GITHUB_TOKEN;
  if (typeof fromImport === 'string' && fromImport.length > 0) return fromImport;
  const fromProcess = typeof process !== 'undefined' ? process.env?.GITHUB_TOKEN : undefined;
  if (typeof fromProcess === 'string' && fromProcess.length > 0) return fromProcess;
  return undefined;
}

/**
 * Fetch wrapper with per-URL caching.
 *
 * Security:
 *   - GITHUB_TOKEN is only attached when the host is api.github.com.
 *   - Response bodies are NEVER leaked to the client directly; callers shape
 *     the response they return from the HTTP handler.
 *
 * Throws on non-2xx (including 202). Callers that need 202 retry behaviour
 * should catch and back off.
 */
async function fetchJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  const key = url;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;

  const isGitHub = /^https:\/\/api\.github\.com\//i.test(url);
  const authHeaders =
    isGitHub && getToken() ? { Authorization: `Bearer ${getToken()}` } : {};

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'ghoul.dev',
      Accept: isGitHub ? 'application/vnd.github+json' : 'application/json',
      ...authHeaders,
      ...headers,
    },
  });
  if (res.status === 202) throw new Error('202 Accepted (computing)');
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} from ${url}`);
  const json = (await res.json()) as T;
  cache.set(key, { value: json, expires: Date.now() + TTL });
  return json;
}

/**
 * Thin GraphQL POST to api.github.com/graphql. Throws on transport failure or
 * on a non-empty `errors[]`. Requires GITHUB_TOKEN — GraphQL is auth-only.
 */
async function graphqlFetch<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const token = getToken();
  if (!token) throw new Error('graphql requires GITHUB_TOKEN');
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'ghoul.dev',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`graphql ${res.status} ${res.statusText}`);
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors && json.errors.length > 0) {
    throw new Error(`graphql errors: ${json.errors.map((e) => e.message).join('; ')}`);
  }
  if (!json.data) throw new Error('graphql: empty data');
  return json.data;
}

/**
 * Fetch GitHub /repos/{owner}/{repo}/contributors — returns each contributor
 * with a `contributions` field (commit count) and is served from cache, so it
 * responds immediately. We deliberately avoid the /stats/contributors variant
 * because GitHub returns 202 for extended periods while it lazily computes the
 * weekly additions/deletions table, which is unreliable for our use case.
 */
async function fetchGitHubContributors(fullName: string): Promise<any[] | null> {
  try {
    const data = await fetchJson<any>(
      `https://api.github.com/repos/${fullName}/contributors?per_page=100&anon=false`
    );
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

async function getAuthedRepos(): Promise<any[] | null> {
  if (!getToken()) return null;
  try {
    const pages: any[] = [];
    for (let page = 1; page <= 6; page++) {
      const batch = await fetchJson<any[]>(
        `https://api.github.com/user/repos?per_page=100&affiliation=owner,collaborator,organization_member&visibility=all&page=${page}`
      );
      if (!Array.isArray(batch) || batch.length === 0) break;
      pages.push(...batch);
      if (batch.length < 100) break;
    }
    return pages;
  } catch {
    return null;
  }
}

/**
 * Run N async tasks with at most `concurrency` in flight at once.
 */
async function pool<T, R>(items: T[], concurrency: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = new Array(Math.min(concurrency, items.length)).fill(0).map(async () => {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

// ─── Contribution-org breakdown (live, per-repo commits + ±diff) ───
/**
 * Owners we surface on the open-source section. Order is preserved in the
 * rendered output. Add new orgs/users here as work expands.
 */
const TRACKED_OWNERS = ['OpenGamingCollective', 'caelestia-dots'];
/** How far back to scan. GraphQL's contributionsCollection caps at 1 year per
 * window, so we step backwards in 1-year chunks. */
const CONTRIBUTION_WINDOW_YEARS = 5;

export type OrgRepoSummary = {
  repo: string;             // bare repo name, e.g. 'linux'
  fullName: string;         // 'OpenGamingCollective/linux'
  url: string;
  commits: number;
  additions: number;
  deletions: number;
  /** PRs the user opened that are approved but not yet merged. */
  approvedOpenPrs: number;
};

export type OrgBreakdown = {
  owner: string;
  totals: { commits: number; additions: number; deletions: number };
  repos: OrgRepoSummary[];
};

/** User node IDs are stable; cache forever once we have one. */
const userIdCache = new Map<string, string>();
async function getUserNodeId(login: string): Promise<string> {
  const hit = userIdCache.get(login);
  if (hit) return hit;
  const data = await graphqlFetch<{ user: { id: string } }>(
    `query($login: String!) { user(login: $login) { id } }`,
    { login }
  );
  userIdCache.set(login, data.user.id);
  return data.user.id;
}

type ContribWindowResp = {
  user: {
    contributionsCollection: {
      commitContributionsByRepository: {
        repository: {
          nameWithOwner: string;
          name: string;
          url: string;
          owner: { login: string };
          defaultBranchRef: {
            target: {
              history?: { nodes: { additions: number; deletions: number }[] };
            };
          } | null;
        };
        contributions: { totalCount: number };
      }[];
    };
  };
};

// $from / $to feed contributionsCollection (DateTime!).
// $gitFrom / $gitUntil feed Commit.history (GitTimestamp). Same ISO values,
// different GraphQL scalars — GitHub's schema doesn't accept DateTime where
// GitTimestamp is expected.
const CONTRIB_WINDOW_QUERY = `
  query(
    $user: String!
    $authorId: ID!
    $from: DateTime!
    $to: DateTime!
    $gitFrom: GitTimestamp!
    $gitUntil: GitTimestamp!
  ) {
    user(login: $user) {
      contributionsCollection(from: $from, to: $to) {
        commitContributionsByRepository(maxRepositories: 100) {
          repository {
            nameWithOwner
            name
            url
            owner { login }
            defaultBranchRef {
              target {
                ... on Commit {
                  history(author: { id: $authorId }, since: $gitFrom, until: $gitUntil, first: 100) {
                    nodes { additions deletions }
                  }
                }
              }
            }
          }
          contributions(first: 1) { totalCount }
        }
      }
    }
  }
`;

async function getContributionOrgs(user: string): Promise<OrgBreakdown[]> {
  const authorId = await getUserNodeId(user);
  const tracked = new Set(TRACKED_OWNERS.map((o) => o.toLowerCase()));

  type Accum = { fullName: string; name: string; url: string; commits: number; additions: number; deletions: number };
  const perRepo = new Map<string, Accum>();

  const now = new Date();
  for (let i = 0; i < CONTRIBUTION_WINDOW_YEARS; i++) {
    const to = new Date(now);
    to.setUTCFullYear(to.getUTCFullYear() - i);
    const from = new Date(to);
    from.setUTCFullYear(from.getUTCFullYear() - 1);

    const fromIso = from.toISOString();
    const toIso = to.toISOString();
    const data = await graphqlFetch<ContribWindowResp>(CONTRIB_WINDOW_QUERY, {
      user,
      authorId,
      from: fromIso,
      to: toIso,
      gitFrom: fromIso,
      gitUntil: toIso,
    }).catch((err) => {
      console.error('[contribution_orgs] window failed:', err?.message ?? err);
      return null;
    });
    if (!data) continue;

    for (const entry of data.user.contributionsCollection.commitContributionsByRepository) {
      const ownerLogin = entry.repository.owner.login;
      if (!tracked.has(ownerLogin.toLowerCase())) continue;
      const key = entry.repository.nameWithOwner;
      let bucket = perRepo.get(key);
      if (!bucket) {
        bucket = {
          fullName: key,
          name: entry.repository.name,
          url: entry.repository.url,
          commits: 0,
          additions: 0,
          deletions: 0,
        };
        perRepo.set(key, bucket);
      }
      bucket.commits += entry.contributions.totalCount;
      const nodes = entry.repository.defaultBranchRef?.target?.history?.nodes ?? [];
      for (const c of nodes) {
        bucket.additions += c.additions;
        bucket.deletions += c.deletions;
      }
    }
  }

  // Approved-open PRs per tracked repo: one cheap REST search each. Most repos
  // will return 0 — the meaningful case is OGC/linux, where PRs are approved
  // but waiting on a release branch.
  const approvedEntries = await Promise.all(
    [...perRepo.keys()].map(async (key) => {
      try {
        const r = await fetchJson<{ total_count: number }>(
          `https://api.github.com/search/issues?q=author:${user}+is:pr+is:open+review:approved+repo:${key}&per_page=1`
        );
        return [key, r.total_count ?? 0] as const;
      } catch {
        return [key, 0] as const;
      }
    })
  );
  const approvedByRepo = new Map(approvedEntries);

  const byOwner = new Map<string, OrgBreakdown>();
  for (const [key, b] of perRepo) {
    const owner = key.split('/')[0];
    if (!byOwner.has(owner)) {
      byOwner.set(owner, {
        owner,
        totals: { commits: 0, additions: 0, deletions: 0 },
        repos: [],
      });
    }
    const grp = byOwner.get(owner)!;
    grp.repos.push({
      repo: b.name,
      fullName: b.fullName,
      url: b.url,
      commits: b.commits,
      additions: b.additions,
      deletions: b.deletions,
      approvedOpenPrs: approvedByRepo.get(key) ?? 0,
    });
    grp.totals.commits += b.commits;
    grp.totals.additions += b.additions;
    grp.totals.deletions += b.deletions;
  }

  // Owner order follows TRACKED_OWNERS; repos within an owner sort by commits.
  const out: OrgBreakdown[] = [];
  for (const owner of TRACKED_OWNERS) {
    const grp = byOwner.get(owner);
    if (!grp) continue;
    grp.repos.sort((a, b) => b.commits - a.commits);
    out.push(grp);
  }
  return out;
}

// ─── GITHUB AUTHORSHIP ───
async function getGitHubAuthorshipLangs(user: string): Promise<Map<string, number>> {
  const totals = new Map<string, number>();
  const repos = await getAuthedRepos();
  if (!repos) return totals;

  const picks = repos
    .filter((r) => !r.fork && !r.archived && r.size > 0)
    .sort((a, b) => Date.parse(b.pushed_at) - Date.parse(a.pushed_at))
    .slice(0, 120);

  await pool(picks, 8, async (repo) => {
    try {
      const [contrib, langs] = await Promise.all([
        fetchGitHubContributors(repo.full_name),
        fetchJson<Record<string, number>>(repo.languages_url).catch(() => null as any),
      ]);
      if (!contrib || !langs) return;

      const userEntry = contrib.find(
        (c: any) => c.login?.toLowerCase() === user.toLowerCase()
      );
      if (!userEntry) return;

      // Commit counts — /contributors returns `contributions` per contributor.
      // Using commits as the authorship signal: honest proxy for "how much of
      // this repo I wrote", immediate response, no lazy-compute 202s.
      const userCommits = userEntry.contributions ?? 0;
      if (userCommits <= 0) return;

      // Unit = the user's commit count, distributed across this repo's
      // languages by their share. Matches the GitLab path below so both
      // platforms aggregate into the same unit. Using the user's commit
      // *count* (not a bytes-weighted share) keeps a 50 MB Laravel repo
      // from dominating just because PHP bytes are inflated by templates.
      const repoBytes = Object.values(langs).reduce((a, b) => a + b, 0) || 1;
      for (const [lang, bytes] of Object.entries(langs)) {
        const langShare = bytes / repoBytes;
        totals.set(lang, (totals.get(lang) ?? 0) + userCommits * langShare);
      }
    } catch {
      /* swallow, skip this repo */
    }
  });

  return totals;
}

export type GitHubStats = {
  login: string;
  name: string | null;
  followers: number;
  following: number;
  public_repos: number;
  location: string | null;
  languages: { name: string; bytes: number; pct: number }[];
  top_repos: { name: string; stars: number; url: string; language: string | null; description: string | null }[];
  /** Per-owner, per-repo contributions for the OpenSource section. */
  contribution_orgs: OrgBreakdown[];
  total_public_prs: number;
  authenticated: boolean;
  updated_at: string;
};

/**
 * Persistent, stale-while-revalidate cache for the stats payload.
 *
 * Contract:
 *   - If ANY cache is available (memory or disk), that cache is returned
 *     immediately — no matter how old it is. Users never block on upstream.
 *   - If the cache is older than STATS_TTL, a refresh is kicked off in the
 *     background (fire-and-forget). The current caller still gets the stale
 *     value right now; the NEXT caller after the refresh completes gets fresh.
 *   - If NO cache exists at all (first boot, no disk file), the caller is
 *     awaited on the fetch — one-time cost, then the cache is seeded forever.
 *   - Concurrent refreshes are de-duped: if a fetch is already in flight,
 *     we reuse its promise instead of fanning out N parallel GitHub storms.
 *
 * To force a refresh: remove STATS_CACHE_DIR/github-stats.json and restart.
 */
const CACHE_DIR = process.env.STATS_CACHE_DIR || join(process.cwd(), '.cache');
const CACHE_FILE = join(CACHE_DIR, 'github-stats.json');
const STATS_TTL = 30 * 60 * 1000; // 30 min — after this, background-refresh next request

type CachedEntry = {
  value: GitHubStats;
  fetchedAt: number; // unix ms
};

let cached: CachedEntry | null = null;
let fetchInFlight: Promise<GitHubStats> | null = null;

async function loadDiskCache(): Promise<CachedEntry | null> {
  try {
    const txt = await readFile(CACHE_FILE, 'utf-8');
    const parsed = JSON.parse(txt);
    // Basic shape check — protect against a stale schema from a previous version.
    if (parsed && typeof parsed.fetchedAt === 'number' && parsed.value) {
      return parsed as CachedEntry;
    }
    return null;
  } catch {
    return null;
  }
}

async function saveDiskCache(entry: CachedEntry): Promise<void> {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(CACHE_FILE, JSON.stringify(entry));
  } catch (e) {
    console.error('[stats cache] failed to save:', e);
  }
}

// Eager warm-up on module init.
loadDiskCache().then((d) => {
  if (d && !cached) cached = d;
});

function refreshInBackground(user: string): Promise<GitHubStats> {
  if (fetchInFlight) return fetchInFlight;
  fetchInFlight = (async () => {
    try {
      const fresh = await getGitHubStats(user);
      cached = { value: fresh, fetchedAt: Date.now() };
      await saveDiskCache(cached);
      return fresh;
    } finally {
      fetchInFlight = null;
    }
  })();
  return fetchInFlight;
}

export async function getCachedStats(user = 'Ghoul4500'): Promise<GitHubStats> {
  // Cold start with no disk file — have to wait for one fetch so we can serve
  // anything at all. From then on, this branch is never taken again.
  if (!cached) return refreshInBackground(user);

  // Stale but usable — serve immediately, refresh in the background. We
  // .catch() the promise so an unhandled rejection can't crash the server;
  // on failure the cache simply stays stale until the next attempt.
  if (Date.now() - cached.fetchedAt > STATS_TTL) {
    refreshInBackground(user).catch((err) => {
      console.error('[stats cache] background refresh failed:', err?.message ?? err);
    });
  }

  return cached.value;
}

export async function getGitHubStats(user = 'Ghoul4500'): Promise<GitHubStats> {
  const profile = await fetchJson<any>(`https://api.github.com/users/${user}`);
  const publicRepos = await fetchJson<any[]>(
    `https://api.github.com/users/${user}/repos?per_page=100&sort=pushed`
  );
  const authenticated = !!getToken();

  // ---------- AUTHORSHIP-WEIGHTED LANGUAGES ----------
  // "Lines I actually authored" per language, computed from per-repo
  // contributor stats. Auth-only — public language data alone is too noisy.
  const ghLangs = authenticated
    ? await getGitHubAuthorshipLangs(user)
    : new Map<string, number>();
  const combined = new Map<string, number>(ghLangs);

  const hasAuthorshipData = combined.size > 0;

  // Fallback heuristic if authorship couldn't be computed (no token, no stats).
  // Keeps the endpoint working rather than shipping an empty list.
  if (!hasAuthorshipData) {
    for (const r of publicRepos.filter((r) => !r.fork && !r.archived).slice(0, 30)) {
      try {
        const langs = await fetchJson<Record<string, number>>(r.languages_url);
        const repoTotal = Object.values(langs).reduce((a, b) => a + b, 0) || 1;
        for (const [lang, bytes] of Object.entries(langs)) {
          const share = Math.min(bytes / repoTotal, 0.5);
          combined.set(lang, (combined.get(lang) ?? 0) + share);
        }
      } catch {}
    }
  }

  const totalUnits = [...combined.values()].reduce((a, b) => a + b, 0) || 1;
  const languages = [...combined.entries()]
    .map(([name, units]) => ({
      name,
      bytes: Math.round(units), // authorship-weighted "lines-equivalent"
      pct: (units / totalUnits) * 100,
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 30);

  // ---------- TOP REPOS (public only, hard-filtered) ----------
  const top_repos = publicRepos
    .filter((r) => !r.fork && r.private !== true)
    .sort(
      (a, b) =>
        b.stargazers_count - a.stargazers_count ||
        Date.parse(b.pushed_at) - Date.parse(a.pushed_at)
    )
    .slice(0, 6)
    .map((r) => ({
      name: r.name,
      stars: r.stargazers_count,
      url: r.html_url,
      language: r.language,
      description: r.description,
    }));

  // ---------- PR / MR COUNTS ----------
  const prSearch = await fetchJson<any>(
    `https://api.github.com/search/issues?q=author:${user}+is:pr+is:public&per_page=1`
  ).catch(() => ({ total_count: 0 }));

  // GraphQL-driven per-repo breakdown for the OpenSource section. Requires
  // GITHUB_TOKEN; without it we return [] and the UI gracefully shows nothing.
  const contribution_orgs = authenticated
    ? await getContributionOrgs(user).catch((err) => {
        console.error('[stats] contribution_orgs failed:', err?.message ?? err);
        return [] as OrgBreakdown[];
      })
    : [];

  const payload: GitHubStats = {
    login: profile.login,
    name: profile.name,
    followers: profile.followers,
    following: profile.following,
    public_repos: profile.public_repos,
    location: profile.location,
    languages,
    top_repos,
    contribution_orgs,
    total_public_prs: prSearch.total_count ?? 0,
    authenticated,
    updated_at: new Date().toISOString(),
  };

  // Defence-in-depth: drop any private repo names that might have snuck into
  // top_repos (belt + braces; top_repos is already built from publicRepos).
  const authed = await getAuthedRepos();
  if (authed) {
    const privateNames = new Set(
      authed.filter((r) => r.private === true).map((r) => r.name)
    );
    payload.top_repos = payload.top_repos.filter((r) => !privateNames.has(r.name));
  }

  return payload;
}
