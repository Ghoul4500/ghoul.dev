import type { ComponentId, IncidentType, Preset } from './types.ts';

export const COMPONENTS: { id: ComponentId; label: string; description: string }[] = [
  { id: 'brain',          label: 'Brain',          description: 'Cognitive throughput · executive function · short-term recall' },
  { id: 'sleep',          label: 'Sleep',          description: 'Restorative service · nightly batch job' },
  { id: 'caffeine',       label: 'Caffeine',       description: 'Stimulant ingestion pipeline · ms-latency dependency' },
  { id: 'code_output',    label: 'Code Output',    description: 'Commit throughput · debug capacity' },
  { id: 'dm_response',    label: 'DM Response',    description: 'Telegram, Discord, WhatsApp message handling' },
  { id: 'email_response', label: 'Email Response', description: 'Inbox processing · async write queue' },
  { id: 'social_battery', label: 'Social Battery', description: 'Bandwidth for human interaction' },
  { id: 'hydration',      label: 'Hydration',      description: 'Fluid intake monitor · downstream of caffeine' },
  { id: 'touching_grass', label: 'Touching Grass', description: 'Outdoor exposure subsystem · IRL connector' },
  { id: 'vibes',          label: 'Vibes',          description: 'Aggregate signal · derived from all of the above' },
];

export const PRESETS: Record<IncidentType, Preset> = {
  sick: {
    type: 'sick',
    label: 'sick',
    banner_label: 'ILLNESS EVENT',
    impact: {
      brain:          'major_outage',
      sleep:          'degraded',
      code_output:    'major_outage',
      dm_response:    'partial_outage',
      email_response: 'major_outage',
      social_battery: 'major_outage',
      hydration:      'degraded',
      vibes:          'major_outage',
    },
    auto_resolve_hours: 72,
    full_resolve_on_auto: false,
    check_ins: [
      { after_hours: 12, dm: 'u feeling any better T-T',
        page_update: 'Engineering attempted contact. Awaiting response.' },
      { after_hours: 36, dm: 'still cooked? need anything 🥺',
        page_update: 'Second contact attempt. User unresponsive.' },
      { after_hours: 72, dm: 'hello??? blink twice if alive',
        page_update: 'Concern escalating. Wellness check under consideration.' },
    ],
  },
  busy: {
    type: 'busy',
    label: 'busy',
    banner_label: 'PARTIAL OUTAGE — REDUCED BANDWIDTH',
    impact: {
      dm_response:    'partial_outage',
      email_response: 'degraded',
      social_battery: 'major_outage',
      code_output:    'operational',
      vibes:          'degraded',
    },
    auto_resolve_hours: 24,
    full_resolve_on_auto: true,
    check_ins: [
      { after_hours: 8, dm: 'still cooked or can the world have you back?',
        page_update: 'Bandwidth check pending response.' },
    ],
  },
  cooked: {
    type: 'cooked',
    label: 'cooked',
    banner_label: 'DEGRADED PERFORMANCE — USER OPERATING ON FUMES',
    impact: {
      brain:          'degraded',
      sleep:          'major_outage',
      caffeine:       'major_outage',
      hydration:      'degraded',
      code_output:    'degraded',
      vibes:          'partial_outage',
    },
    auto_resolve_hours: 48,
    full_resolve_on_auto: false,
    check_ins: [
      { after_hours: 12, dm: 'did u sleep yet',
        page_update: 'Sleep service still not reporting. Caffeine substitution detected.' },
      { after_hours: 36, dm: 'ok seriously go to bed',
        page_update: 'Continued sleep deficit. User refusing remediation.' },
    ],
  },
  'touching-grass': {
    type: 'touching-grass',
    label: 'touching-grass',
    banner_label: 'SCHEDULED MAINTENANCE — OFFLINE FOR MEATSPACE',
    impact: {
      dm_response:    'partial_outage',
      email_response: 'partial_outage',
      code_output:    'major_outage',
      touching_grass: 'operational',
      social_battery: 'degraded',
    },
    auto_resolve_hours: 6,
    full_resolve_on_auto: true,
    check_ins: [
      { after_hours: 2, dm: 'u done touching grass yet hermit',
        page_update: 'User believed to still be outdoors. Status unverified.' },
    ],
  },
};

export function presetFor(type: IncidentType): Preset {
  return PRESETS[type];
}

export function isIncidentType(s: string): s is IncidentType {
  return s in PRESETS;
}
