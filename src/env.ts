/**
 * Environment bindings for the MCP Streamable HTTP Worker.
 * KV namespaces are accessed directly via bindings — no API token needed.
 */
export interface Env {
  // Bridge
  BRIDGE_ACCOUNTS: KVNamespace;

  // Courts
  KV_COURT_OF_APPEAL: KVNamespace;
  KV_CHANCERY: KVNamespace;
  KV_ADMIN_COURT: KVNamespace;
  KV_KINGS_BENCH: KVNamespace;
  KV_SUPREME: KVNamespace;
  KV_CLERKENWELL: KVNamespace;
  KV_CENTRAL_LONDON: KVNamespace;

  // Claimants / Defendants
  KV_LIU: KVNamespace;
  KV_HK_LAW: KVNamespace;
  KV_LESSEL: KVNamespace;
  KV_LETTING_AGENTS: KVNamespace;
  KV_BARRISTERS: KVNamespace;

  // Government
  KV_GLD: KVNamespace;
  KV_US_STATE_DEPT: KVNamespace;
  KV_ESTONIA: KVNamespace;

  // Complaints
  KV_HMCTS: KVNamespace;
  KV_ICO: KVNamespace;
  KV_PHSO: KVNamespace;
  KV_BAR_STANDARDS: KVNamespace;
  KV_PARLIAMENT: KVNamespace;
}

/**
 * Mapping from human-readable namespace name to binding key.
 * Used to resolve a namespace name from tool arguments to the actual KV binding.
 */
export const NAMESPACE_MAP: Record<string, keyof Env> = {
  "bridge-accounts": "BRIDGE_ACCOUNTS",

  // Courts
  "court-of-appeal": "KV_COURT_OF_APPEAL",
  "chancery": "KV_CHANCERY",
  "admin-court": "KV_ADMIN_COURT",
  "kings-bench": "KV_KINGS_BENCH",
  "supreme": "KV_SUPREME",
  "clerkenwell": "KV_CLERKENWELL",
  "central-london": "KV_CENTRAL_LONDON",

  // Claimants / Defendants
  "liu": "KV_LIU",
  "hk-law": "KV_HK_LAW",
  "lessel": "KV_LESSEL",
  "letting-agents": "KV_LETTING_AGENTS",
  "barristers": "KV_BARRISTERS",

  // Government
  "gld": "KV_GLD",
  "us-state-dept": "KV_US_STATE_DEPT",
  "estonia": "KV_ESTONIA",

  // Complaints
  "hmcts": "KV_HMCTS",
  "ico": "KV_ICO",
  "phso": "KV_PHSO",
  "bar-standards": "KV_BAR_STANDARDS",
  "parliament": "KV_PARLIAMENT",
};

/**
 * IMAP folder → namespace binding mapping (mirrors your stdio server).
 */
export const FOLDER_BINDING_MAP: Record<string, { binding: keyof Env; humanName: string }> = {
  // Claimants
  "INBOX/MobiCycle Estonia/Liu":           { binding: "KV_LIU", humanName: "Liu Litigation" },
  "INBOX/MobiCycle Estonia/HK Law":        { binding: "KV_HK_LAW", humanName: "HK Law Defendants" },
  "INBOX/MobiCycle Estonia/Lessel":        { binding: "KV_LESSEL", humanName: "Lessel Property" },
  "INBOX/MobiCycle Estonia/Letting Agents":{ binding: "KV_LETTING_AGENTS", humanName: "Rentify Letting Agents" },

  // Labels
  "Labels/HK Law": { binding: "KV_HK_LAW", humanName: "HK Law Defendants" },
  "Labels/Liu":    { binding: "KV_LIU", humanName: "Liu Litigation" },
  "Labels/Veena":  { binding: "KV_BARRISTERS", humanName: "Pro Bono Barristers" },

  // Government
  "INBOX/Government/GLD":          { binding: "KV_GLD", humanName: "Government Legal Department" },
  "INBOX/Government/US State Dept":{ binding: "KV_US_STATE_DEPT", humanName: "US State Department" },
  "INBOX/Government/Estonia":      { binding: "KV_ESTONIA", humanName: "Estonian Government" },

  // Courts
  "INBOX/Courts/Court of Appeal": { binding: "KV_COURT_OF_APPEAL", humanName: "Court of Appeal" },
  "INBOX/Courts/Chancery":        { binding: "KV_CHANCERY", humanName: "Chancery Division" },
  "INBOX/Courts/Admin Court":     { binding: "KV_ADMIN_COURT", humanName: "Administrative Court" },
  "INBOX/Courts/Kings Bench":     { binding: "KV_KINGS_BENCH", humanName: "King's Bench Division" },
  "INBOX/Courts/Supreme":         { binding: "KV_SUPREME", humanName: "Supreme Court" },
  "INBOX/Courts/Clerkenwell":     { binding: "KV_CLERKENWELL", humanName: "Clerkenwell County Court" },
  "INBOX/Courts/Central London":  { binding: "KV_CENTRAL_LONDON", humanName: "Central London County Court" },

  // Complaints
  "INBOX/Complaints/HMCTS":         { binding: "KV_HMCTS", humanName: "HMCTS Complaints" },
  "INBOX/Complaints/ICO":           { binding: "KV_ICO", humanName: "ICO Complaints" },
  "INBOX/Complaints/PHSO":          { binding: "KV_PHSO", humanName: "PHSO Complaints" },
  "INBOX/Complaints/Bar Standards": { binding: "KV_BAR_STANDARDS", humanName: "Bar Standards Board" },
  "INBOX/Complaints/Parliament":    { binding: "KV_PARLIAMENT", humanName: "Parliamentary Complaints" },
};
