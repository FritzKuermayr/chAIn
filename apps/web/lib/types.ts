export type Category =
  | "name"
  | "address"
  | "tax_id"
  | "account"
  | "password"
  | "api_key"
  | "medical"
  | "identifier"
  | "contact"
  | "other";

export type Severity = "SAFE" | "CRITICAL";
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
  severity: Severity;
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
  name: "Name",
  address: "Address",
  tax_id: "Tax ID",
  account: "Account",
  password: "Password",
  api_key: "API key",
  medical: "Medical",
  identifier: "Identifier",
  contact: "Contact",
  other: "Other",
};
