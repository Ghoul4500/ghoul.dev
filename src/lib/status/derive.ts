import type { ComponentId, Incident, Severity, Store } from './types.ts';
import { COMPONENTS, PRESETS } from './presets.ts';

const SEVERITY_RANK: Record<Severity, number> = {
  operational: 0,
  degraded: 1,
  partial_outage: 2,
  major_outage: 3,
  presumed_dead: 4,
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  operational:    'Operational',
  degraded:       'Degraded Performance',
  partial_outage: 'Partial Outage',
  major_outage:   'Major Outage',
  presumed_dead:  'Unreachable',
};

export type ComponentState = {
  id: ComponentId;
  label: string;
  description: string;
  severity: Severity;
};

export type BannerMode = 'none' | 'major' | 'presumed_dead';

export type PageState = {
  components: ComponentState[];
  activeIncidents: Incident[];
  pastIncidents: Incident[];
  bannerMode: BannerMode;
  bannerTitle: string | null;
  bannerSubtitle: string | null;
  overallSummary: string;
  lastUpdated: string | null;
};

function worse(a: Severity, b: Severity): Severity {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

export function derive(store: Store, now = Date.now()): PageState {
  const active = store.incidents.filter((i) => i.resolved_at === null);
  const past = store.incidents
    .filter((i) => i.resolved_at !== null)
    .sort((a, b) => Date.parse(b.resolved_at!) - Date.parse(a.resolved_at!));

  const anyDead = active.some((i) => i.presumed_dead);

  const componentSeverity = new Map<ComponentId, Severity>();
  for (const c of COMPONENTS) componentSeverity.set(c.id, 'operational');

  if (anyDead) {
    for (const c of COMPONENTS) componentSeverity.set(c.id, 'major_outage');
  } else {
    for (const inc of active) {
      for (const [cid, sev] of Object.entries(inc.impact)) {
        const id = cid as ComponentId;
        const current = componentSeverity.get(id) ?? 'operational';
        componentSeverity.set(id, worse(current, sev as Severity));
      }
    }
  }

  const components: ComponentState[] = COMPONENTS.map((c) => ({
    id: c.id,
    label: c.label,
    description: c.description,
    severity: componentSeverity.get(c.id) ?? 'operational',
  }));

  let bannerMode: BannerMode = 'none';
  let bannerTitle: string | null = null;
  let bannerSubtitle: string | null = null;
  let overallSummary = 'All systems operational.';

  if (anyDead) {
    const dead = active.find((i) => i.presumed_dead)!;
    bannerMode = 'presumed_dead';
    bannerTitle = 'ALL SERVICES UNREACHABLE';
    const hours = Math.floor((now - Date.parse(dead.last_user_reply_at)) / 3_600_000);
    bannerSubtitle = `No response in ${hours}h. No commits in 96h. Status: presumed offline.`;
    overallSummary = 'Major outage across all components. Service presumed unreachable.';
  } else if (components.some((c) => c.severity === 'major_outage')) {
    bannerMode = 'major';
    const inc = active.find((i) =>
      Object.values(i.impact).includes('major_outage')
    );
    const preset = inc ? PRESETS[inc.type] : undefined;
    bannerTitle = preset?.banner_label ?? 'MAJOR INCIDENT IN PROGRESS';
    bannerSubtitle = inc
      ? `Started ${formatRelative(Date.parse(inc.started_at), now)}. Engineering is on it (allegedly).`
      : null;
    overallSummary = 'Major incident in progress. Multiple components affected.';
  } else if (active.length > 0) {
    overallSummary = 'Minor incident in progress. Some components reporting degraded service.';
  }

  const lastUpdated =
    active
      .flatMap((i) => i.updates.map((u) => u.at))
      .concat(active.map((i) => i.started_at))
      .sort()
      .at(-1) ?? null;

  return {
    components,
    activeIncidents: active,
    pastIncidents: past,
    bannerMode,
    bannerTitle,
    bannerSubtitle,
    overallSummary,
    lastUpdated,
  };
}

export function formatRelative(then: number, now = Date.now()): string {
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatAbsolute(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', {
    timeZone: 'Indian/Maldives',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
