// Build-time GitHub stats shared by the homepage and the résumé, so the numbers
// can't drift apart or silently rot. Every fetch falls back to a last-known
// value if the API is unreachable, rate-limited or slow.
// In CI, GITHUB_TOKEN lifts the 60 req/hr unauthenticated limit on shared IPs.

const ghHeaders = () => {
  const token = process.env.GITHUB_TOKEN;
  return {
    'User-Agent': 'ghoul.dev-build',
    Accept: 'application/vnd.github+json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

async function gh(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, { headers: ghHeaders(), signal: AbortSignal.timeout(5000) });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export interface Stats {
  /** Public, non-fork repositories. */
  repoCount: number;
  /** Patches authored by me in Linus' tree. */
  kernelPatches: number;
  /** Latest asusctl release tag, without the leading "v". */
  asusctlRelease: string;
}

async function load(): Promise<Stats> {
  const stats: Stats = { repoCount: 10, kernelPatches: 4, asusctlRelease: '6.5.0' };

  const [repos, commits, release] = await Promise.all([
    gh('https://api.github.com/users/Ghoul4500/repos?per_page=100&type=public'),
    gh('https://api.github.com/search/commits?q=repo:torvalds/linux+author-email:yaseen@ghoul.dev&per_page=1'),
    gh('https://api.github.com/repos/OpenGamingCollective/asusctl/releases/latest'),
  ]);

  if (Array.isArray(repos) && repos.length) {
    stats.repoCount = repos.filter((r: any) => !r.fork).length;
  }
  if (Number.isInteger(commits?.total_count) && commits.total_count > stats.kernelPatches) {
    stats.kernelPatches = commits.total_count;
  }
  if (typeof release?.tag_name === 'string' && release.tag_name) {
    stats.asusctlRelease = release.tag_name.replace(/^v/, '');
  }
  return stats;
}

// Memoised so both pages share one round of requests per build.
let cached: Promise<Stats> | undefined;
export const getStats = (): Promise<Stats> => (cached ??= load());
