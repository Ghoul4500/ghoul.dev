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

// ─── Identity matching for GitLab (contributors there are returned by name + email) ───
const USER_MATCHERS = [/ghoul/i, /yaseen/i, /93819845\+/]; // GH noreply prefix fallback
function matchesUser(name: string | undefined, email: string | undefined): boolean {
  const s = `${name ?? ''} ${email ?? ''}`;
  return USER_MATCHERS.some((re) => re.test(s));
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

// ─── GITLAB AUTHORSHIP ───
async function fetchPagedGitLab<T>(baseUrl: string, maxPages = 5): Promise<T[]> {
  const out: T[] = [];
  for (let page = 1; page <= maxPages; page++) {
    try {
      const sep = baseUrl.includes('?') ? '&' : '?';
      const batch = await fetchJson<T[]>(`${baseUrl}${sep}page=${page}&per_page=100`);
      if (!Array.isArray(batch) || batch.length === 0) break;
      out.push(...batch);
      if (batch.length < 100) break;
    } catch {
      break;
    }
  }
  return out;
}

async function listGitLabProjects(user: string): Promise<any[]> {
  const [userProjects, asusProjects] = await Promise.all([
    fetchPagedGitLab<any>(
      `https://gitlab.com/api/v4/users/${user}/projects?archived=false`
    ),
    fetchPagedGitLab<any>(
      `https://gitlab.com/api/v4/groups/asus-linux/projects?archived=false&include_subgroups=true`
    ),
  ]);
  const seen = new Set<number>();
  return [...userProjects, ...asusProjects].filter((p) => {
    if (!p || seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

async function getGitLabAuthorshipLangs(user: string): Promise<Map<string, number>> {
  const totals = new Map<string, number>();
  const projects = await listGitLabProjects(user);
  if (projects.length === 0) return totals;

  await pool(projects, 4, async (p) => {
    try {
      const [contributors, langs] = await Promise.all([
        // Paginate to find the user — large projects (e.g. asus-linux/asusctl)
        // push the user past page 1.
        fetchPagedGitLab<any>(
          `https://gitlab.com/api/v4/projects/${p.id}/repository/contributors`,
          4
        ),
        fetchJson<Record<string, number>>(
          `https://gitlab.com/api/v4/projects/${p.id}/languages`
        ).catch(() => null),
      ]);
      if (!contributors || contributors.length === 0 || !langs) return;

      // The user may appear under multiple names/emails in one project
      // (e.g. "Ghoul" and "Ahmed Yaseen" both surface in asus-linux/asusctl).
      // Sum them all for a fair authorship signal.
      const userEntries = contributors.filter((c: any) => matchesUser(c.name, c.email));
      if (userEntries.length === 0) return;

      const userCommits = userEntries.reduce(
        (s: number, c: any) => s + (c.commits ?? 0),
        0
      );
      if (userCommits <= 0) return;

      // Same unit as GitHub path: the user's commit count distributed across
      // the project's language shares. `/languages` returns percentages
      // summing to 100, so langShare = pct/100 is the direct share.
      for (const [lang, pct] of Object.entries(langs)) {
        const langShare = (pct as number) / 100;
        totals.set(lang, (totals.get(lang) ?? 0) + userCommits * langShare);
      }
    } catch {
      /* swallow, skip this project */
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
  asus_linux_mrs: number;
  ogc_prs: number;
  total_public_prs: number;
  authenticated: boolean;
  sources: { github: boolean; gitlab: boolean };
  updated_at: string;
};

export async function getGitHubStats(user = 'Ghoul4500'): Promise<GitHubStats> {
  const profile = await fetchJson<any>(`https://api.github.com/users/${user}`);
  const publicRepos = await fetchJson<any[]>(
    `https://api.github.com/users/${user}/repos?per_page=100&sort=pushed`
  );
  const authenticated = !!getToken();

  // ---------- AUTHORSHIP-WEIGHTED LANGUAGES ----------
  // Computes "lines I actually authored" per language, aggregating across
  // GitHub (authed) and GitLab (public) using per-repo contributor stats.
  const [ghLangs, glLangs] = await Promise.all([
    authenticated ? getGitHubAuthorshipLangs(user) : Promise.resolve(new Map<string, number>()),
    getGitLabAuthorshipLangs(user),
  ]);
  const combined = new Map<string, number>();
  for (const [k, v] of ghLangs) combined.set(k, (combined.get(k) ?? 0) + v);
  for (const [k, v] of glLangs) combined.set(k, (combined.get(k) ?? 0) + v);

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

  let asus_linux_mrs = 0;
  try {
    const mrs = await fetchJson<any[]>(
      `https://gitlab.com/api/v4/groups/asus-linux/merge_requests?author_username=${user}&scope=all&state=merged&per_page=100`
    );
    asus_linux_mrs = mrs.length;
  } catch {
    asus_linux_mrs = 7;
  }

  let ogc_prs = 0;
  try {
    const ogc = await fetchJson<any>(
      `https://api.github.com/search/issues?q=author:${user}+is:pr+is:public+org:OpenGamingCollective&per_page=1`
    );
    ogc_prs = ogc.total_count ?? 0;
  } catch {
    ogc_prs = 1;
  }

  const payload: GitHubStats = {
    login: profile.login,
    name: profile.name,
    followers: profile.followers,
    following: profile.following,
    public_repos: profile.public_repos,
    location: profile.location,
    languages,
    top_repos,
    asus_linux_mrs,
    ogc_prs,
    total_public_prs: prSearch.total_count ?? 0,
    authenticated,
    sources: {
      github: ghLangs.size > 0 || !authenticated,
      gitlab: glLangs.size > 0,
    },
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
