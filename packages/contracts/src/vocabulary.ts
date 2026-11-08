import words from './vocabulary.json';
import type { EvidenceState } from './generated/types';

/** Approved display words. Dates/details are separate presentation suffixes. */
export const EVIDENCE_STATE_WORDS = words.evidence satisfies Record<EvidenceState, string>;
/** Operational service states are separate from evidence and v1 envelope statuses. */
export const SERVICE_STATUS_WORDS = words.service;
export type ServiceStatus = keyof typeof SERVICE_STATUS_WORDS;
