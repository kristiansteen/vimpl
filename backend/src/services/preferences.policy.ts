// User preferences kept on the account (Ailean app): language and process taxonomy.
// Only these keys are stored; anything else sent is ignored. null clears a key.

export const MAX_CUSTOM_NODES = 5000;
const LANGS = ['en', 'da'];
const SOURCES = ['apqc', 'msbpc', 'custom'];

export interface TaxonomyNode { id: string; name: string; level: 1 | 2 | 3; parentId: string | null }
export interface Preferences {
  preferredLang?: string;
  taxonomySource?: string;
  customTaxonomyName?: string | null;
  customTaxonomy?: TaxonomyNode[] | null;
}

const str = (v: unknown, max: number) => (typeof v === 'string' && v.trim() && v.length <= max ? v.trim() : null);

function cleanNode(n: unknown): TaxonomyNode | null {
  if (!n || typeof n !== 'object') return null;
  const o = n as Record<string, unknown>;
  const id = str(o.id, 64);
  const name = str(o.name, 300);
  const level = Number(o.level);
  if (!id || !name || ![1, 2, 3].includes(level)) return null;
  const parentId = level === 1 ? null : str(o.parentId, 64);
  return { id, name, level: level as 1 | 2 | 3, parentId };
}

export function sanitizePreferences(input: unknown): Preferences {
  const out: Preferences = {};
  if (!input || typeof input !== 'object') return out;
  const i = input as Record<string, unknown>;
  if (typeof i.preferredLang === 'string' && LANGS.includes(i.preferredLang)) out.preferredLang = i.preferredLang;
  if (typeof i.taxonomySource === 'string' && SOURCES.includes(i.taxonomySource)) out.taxonomySource = i.taxonomySource;
  if (i.customTaxonomyName === null) out.customTaxonomyName = null;
  else if (str(i.customTaxonomyName, 100)) out.customTaxonomyName = str(i.customTaxonomyName, 100);
  if (i.customTaxonomy === null) out.customTaxonomy = null;
  else if (Array.isArray(i.customTaxonomy)) {
    if (i.customTaxonomy.length > MAX_CUSTOM_NODES) throw new Error(`Too many taxonomy nodes (max ${MAX_CUSTOM_NODES})`);
    out.customTaxonomy = i.customTaxonomy.map(cleanNode).filter((n): n is TaxonomyNode => n !== null);
  }
  return out;
}

export function mergePreferences(stored: unknown, patch: Preferences): Preferences {
  const base: Record<string, unknown> = stored && typeof stored === 'object' && !Array.isArray(stored) ? { ...(stored as object) } : {};
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) delete base[k];
    else base[k] = v;
  }
  return base as Preferences;
}
