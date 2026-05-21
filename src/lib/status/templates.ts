import type { IncidentType, Phase } from './types.ts';

type FallbackTable = Record<IncidentType, Partial<Record<Phase, string[]>>>;

export const FALLBACKS: FallbackTable = {
  sick: {
    investigating: [
      'Multiple components reporting failures. Cause under investigation.',
      'Symptoms detected at unknown timestamp. Triage in progress.',
      'Unexpected illness event. Engineering paged.',
    ],
    monitoring: [
      'Still cooked. ETA on recovery unclear.',
      'Vitals stable but degraded. Continued monitoring.',
      'No significant improvement since last update.',
    ],
    resolved: [
      'All systems back online. Cause undetermined.',
      'Recovery confirmed. Resuming normal operations.',
      'Post-mortem deferred indefinitely.',
    ],
  },
  busy: {
    investigating: [
      'Inbound load exceeded provisioned capacity. Throttling applied.',
      'Sudden bandwidth contention. Reducing non-essential traffic.',
    ],
    monitoring: [
      'Queue depth still elevated. Drainage ongoing.',
      'Working through backlog. Replies will arrive eventually.',
    ],
    resolved: [
      'Backlog cleared. Normal response times restored.',
      'Bandwidth recovered. Inbox no longer on fire.',
    ],
  },
  cooked: {
    investigating: [
      'Sleep service did not run last night. Cascading failures observed.',
      'Detected: user is running on caffeine and spite.',
    ],
    monitoring: [
      'Function remains degraded. Brain cache cold.',
      'Compensating with stimulants. Diminishing returns logged.',
    ],
    resolved: [
      'Sleep service completed batch. Operating within normal parameters.',
      'Recovery sleep applied. Reboot successful.',
    ],
  },
  'touching-grass': {
    investigating: [
      'User has exited the building. Outdoor exposure detected.',
      'Initiating scheduled meatspace maintenance window.',
    ],
    monitoring: [
      'Still outside. Photons confirmed reaching skin.',
      'Walk in progress. Inbox not being read.',
    ],
    resolved: [
      'Returned indoors. Sunlight exposure logged.',
      'Maintenance window closed. Resuming online presence.',
    ],
  },
};

export function pickFallback(type: IncidentType, phase: Phase): string {
  const pool = FALLBACKS[type]?.[phase] ?? FALLBACKS[type]?.monitoring ?? ['Status update.'];
  return pool[Math.floor(Math.random() * pool.length)];
}
