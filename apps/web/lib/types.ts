export type Category =
  | "identity"
  | "contact_location"
  | "financial"
  | "auth_secret"
  | "health"
  | "sensitive_trait"
  | "private_record"
  | "household"
  | "digital_identifier"
  | "behavioral"
  | "inferred"
  | "communication_content"
  | "other";

export type Severity = "SAFE" | "REVIEW" | "SENSITIVE" | "CRITICAL";

export type RecommendedAction =
  | "allow"
  | "allow_with_redaction"
  | "warn"
  | "block"
  | "manual_review";

export type ReplacementMode = "placeholder" | "dummy";
export type ModelChoice = "openai" | "kimi";
export type RecipientContext =
  | "Tax Authority"
  | "Bank"
  | "Client"
  | "Agent Network"
  | "Public Sector"
  | "Other";
export type Visibility = "Public" | "Restricted";
export type PostStatus = "Open" | "Solved";

export interface Span {
  start: number;
  end: number;
  text: string;
  category: Category;
  subcategory?: string | null;
  severity: Severity;
  recommended_action?: RecommendedAction | null;
  confidence?: number | null;
  note?: string | null;
}

export interface ClassifyResponse {
  spans: Span[];
  overall: Severity;
}

export interface MappingEntry {
  original: string;
  replacement: string;
  category: Category;
}

export interface RewriteResponse {
  rewritten: string;
  mapping: MappingEntry[];
}

export interface Comment {
  id: string;
  body: string;
  author: string;
  created_at: string;
  is_solution: boolean;
  upvotes: number;
}

export interface Post {
  id: string;
  title: string;
  body: string;
  topic: string;
  hashtags: string[];
  visibility: Visibility;
  author: string;
  created_at: string;
  status: PostStatus;
  upvotes: number;
  downvotes: number;
  comments: Comment[];
  accepted_solution_id: string | null;
}

export interface TopicCount {
  name: string;
  count: number;
}

export interface HashtagCount {
  name: string;
  count: number;
}

export const CATEGORY_LABEL: Record<Category, string> = {
  identity: "Identity",
  contact_location: "Contact / Location",
  financial: "Financial",
  auth_secret: "Auth / Secret",
  health: "Health",
  sensitive_trait: "Sensitive trait",
  private_record: "Private record",
  household: "Household",
  digital_identifier: "Digital ID",
  behavioral: "Behavioral",
  inferred: "Inferred",
  communication_content: "Communication",
  other: "Other",
};

// Severity rank — used to compute the highest severity across spans.
export const SEVERITY_RANK: Record<Severity, number> = {
  SAFE: 0,
  REVIEW: 1,
  SENSITIVE: 2,
  CRITICAL: 3,
};
