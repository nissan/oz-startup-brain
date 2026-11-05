// Oz Startup Brain component types (documentation; props read by the page).
export type EvidenceState = 'checked' | 'needs-check' | 'disagree' | 'suggested' | 'outside';
export interface Evidence { state: EvidenceState; date?: string; publisher?: string }
export interface ButtonProps { variant?: 'primary' | 'secondary' | 'quiet'; disabled?: boolean; onClick?: () => void; children: React.ReactNode }
export interface EvidenceLabelProps { state: EvidenceState; date?: string }
export interface StarterTaskProps { tasks: { id: string; title: string; hint?: string; active?: boolean }[]; onSelect?: (id: string) => void }
export interface ContextChipProps { label: string; value?: string; unknown?: boolean; onEdit?: () => void }
export interface ClarificationPromptProps { question: string; why?: string; options?: string[]; onConfirm?: (option: string) => void; onUnknown?: () => void }
export type Emphasis = 'primary' | 'secondary';
export interface NextStepCardProps { title: string; why: string; check?: string[]; evidence: Evidence; door?: string; onInspect?: () => void; onAsk?: () => void; emphasis?: Emphasis /* default secondary: the parent makes at most one card's inspect action primary */ }
export interface SourcePanelProps { title: string; publisher?: string; url: string; sourceVersionDate?: string; verifiedAt?: string | null; state?: EvidenceState; effectiveFrom?: string; excerpt?: string; excerptBefore?: string; excerptMark?: string }
export interface ComparisonCell { value?: string; unknown?: boolean; evidence?: Evidence }
export interface ComparisonTableProps { caption?: string; asOf?: string; criteria: string[]; options: { name: string; cells: ComparisonCell[] }[]; onInspect?: (optionIndex: number, criterionIndex: number) => void }
export interface PrerequisiteNode { id: string; label: string; kind: 'sourced' | 'editorial'; state?: EvidenceState; date?: string; current?: boolean; status?: string }
export interface PrerequisiteMapProps { nodes: PrerequisiteNode[] }
export interface ChecklistProps { title?: string; items: { text: string; done?: boolean; evidence?: Evidence }[]; context?: string; corpusVersion?: string; asOf?: string; onToggle?: (index: number, done: boolean) => void; onExport?: () => void; onEditContext?: () => void; emphasis?: Emphasis /* default primary */ }
export interface CoverageBannerProps { jurisdictions: string[]; corpusVersion?: string; asOf?: string; credentialMode?: 'development' | 'live' }
export interface WaitingStateProps { stage: 'finding' | 'checking' | 'building' }
export type ServiceStatus = 'graph-degraded' | 'retrieval-unavailable' | 'budget-exhausted' | 'paused';
export interface StatusNoticeProps { status: ServiceStatus; detail?: string }
export interface LimitPanelProps { kind: 'historical' | 'disagree' | 'outside' | 'graph-degraded' | 'outage' | 'budget'; title?: string; body?: string; draft?: string; detail?: string; onAction?: () => void; actionLabel?: string; onSecondary?: () => void; secondaryLabel?: string; emphasis?: Emphasis /* default primary */ }
export interface TranscriptReviewProps { transcript: string; flagged?: { word: string; reason: string }[]; onSend?: (text: string) => void; onDiscard?: () => void; disclosure?: string /* verified wording naming the transcription provider and audio retention; a visible placeholder renders when omitted */ }
