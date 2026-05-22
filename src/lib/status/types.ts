export type Severity =
  | 'operational'
  | 'degraded'
  | 'partial_outage'
  | 'major_outage'
  | 'presumed_dead';

export type ComponentId =
  | 'brain'
  | 'sleep'
  | 'caffeine'
  | 'code_output'
  | 'dm_response'
  | 'email_response'
  | 'social_battery'
  | 'hydration'
  | 'touching_grass'
  | 'vibes';

export type IncidentType = 'sick' | 'busy' | 'cooked' | 'touching-grass';

export type Phase =
  | 'investigating'
  | 'identified'
  | 'monitoring'
  | 'resolved';

export type IncidentUpdate = {
  at: string;
  phase: Phase;
  text: string;
  auto?: boolean;
};

export type Incident = {
  id: string;
  type: IncidentType;
  started_at: string;
  resolved_at: string | null;
  presumed_dead: boolean;
  presumed_recovered: boolean;
  /**
   * When the bot sent its "u alive?" wellness check DM. The two-stage
   * presumed-dead flow: this gets set first, then after a grace window with
   * still no user reply AND no commits, the incident actually flips to
   * `presumed_dead`. Cleared on any user activity so a future silence cycle
   * gets its own ask-first round instead of going straight to RIP.
   */
  wellness_check_sent_at: string | null;
  /**
   * Hours added to the preset's auto_resolve_hours for this specific incident.
   * Bumped by /extend.
   */
  auto_resolve_offset_hours: number;
  fired_check_ins: number[];
  impact: Partial<Record<ComponentId, Severity>>;
  updates: IncidentUpdate[];
  last_user_reply_at: string;
  /**
   * Set when the bot DMs the user a question (check-in or wellness). The next
   * reply is interpreted in this context — affirmative closes the incident,
   * negative is a silent ack, anything else becomes a public update. Cleared
   * once consumed or after PENDING_PROMPT_TTL_HOURS elapses.
   */
  pending_prompt: PendingPrompt | null;
};

export type PendingPrompt = {
  kind: 'checkin' | 'wellness';
  sent_at: string;
  /** Telegram message_id of the question DM, so we can edit it on reply. */
  dm_message_id: number | null;
};

export type CheckIn = {
  after_hours: number;
  dm: string;
  page_update: string;
};

export type Preset = {
  type: IncidentType;
  label: string;
  banner_label: string;
  impact: Partial<Record<ComponentId, Severity>>;
  auto_resolve_hours: number;
  full_resolve_on_auto: boolean;
  check_ins: CheckIn[];
};

export type Store = {
  incidents: Incident[];
};
