// Shared D1 helpers: schema bootstrap, lazy migration v1 -> v2, relational reads/writes.
// The legacy schema stored everything as JSON in config(key,value). v2 splits
// categories/subcategories/links into rows so updates are diff-based instead of
// overwriting 100KB blobs.

import type { Category, SubCategory, LinkItem, UserPreferences } from "../../../src/types";

// @ts-expect-error - D1Database is provided by Cloudflare environment
export type D1 = D1Database;

export const CURRENT_SCHEMA_VERSION = 2;

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "home",
    title: "Home",
    subCategories: [
      {
        id: "default",
        title: "Default",
        items: [
          { id: "1", title: "Google", url: "https://google.com", icon: "Search" },
          { id: "2", title: "GitHub", url: "https://github.com", icon: "Github" },
        ],
      },
    ],
  },
];

const DEFAULT_BACKGROUND = "radial-gradient(circle at 50% -20%, #334155, #0f172a, #020617)";

const DEFAULT_PREFS: UserPreferences = {
  cardOpacity: 0.1,
  themeColor: "#6280a3",
  // @ts-expect-error - ThemeMode enum value string
  themeMode: "dark",
};

export async function ensureSchema(db: D1): Promise<void> {
  // Create relational tables if missing (idempotent).
  await db.exec("CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT)");
  await db.exec(
    "CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, title TEXT NOT NULL, position INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL DEFAULT (unixepoch()))"
  );
  await db.exec(
    "CREATE TABLE IF NOT EXISTS subcategories (id TEXT PRIMARY KEY, category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE, title TEXT NOT NULL, position INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL DEFAULT (unixepoch()))"
  );
  await db.exec(
    "CREATE TABLE IF NOT EXISTS links (id TEXT PRIMARY KEY, subcategory_id TEXT NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE, title TEXT NOT NULL, url TEXT NOT NULL, description TEXT, icon TEXT, position INTEGER NOT NULL DEFAULT 0, visit_count INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL DEFAULT (unixepoch()))"
  );
  await db.exec("CREATE INDEX IF NOT EXISTS idx_sub_cat ON subcategories(category_id, position)");
  await db.exec("CREATE INDEX IF NOT EXISTS idx_link_sub ON links(subcategory_id, position)");
}

export async function getSchemaVersion(db: D1): Promise<number> {
  const row = await db
    .prepare("SELECT value FROM config WHERE key = 'schema_version'")
    .first<{ value: string }>();
  return row?.value ? parseInt(row.value, 10) || 1 : 1;
}

export async function migrateIfNeeded(db: D1): Promise<void> {
  await ensureSchema(db);
  const version = await getSchemaVersion(db);
  if (version >= CURRENT_SCHEMA_VERSION) return;

  // v1 -> v2: read legacy categories JSON, fan out into relational rows.
  const legacy = await db
    .prepare("SELECT value FROM config WHERE key = 'categories'")
    .first<{ value: string }>();

  if (legacy?.value) {
    try {
      const parsed = JSON.parse(legacy.value) as Category[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        await writeAllCategories(db, parsed);
      }
    } catch (e) {
      console.error("v1->v2 migration: invalid legacy categories JSON, skipping", e);
    }
  }

  await db
    .prepare(
      "INSERT INTO config (key, value) VALUES ('schema_version', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    )
    .bind(String(CURRENT_SCHEMA_VERSION))
    .run();
}

interface CategoryRow {
  id: string;
  title: string;
  position: number;
}
interface SubRow {
  id: string;
  category_id: string;
  title: string;
  position: number;
}
interface LinkRow {
  id: string;
  subcategory_id: string;
  title: string;
  url: string;
  description: string | null;
  icon: string | null;
  position: number;
}

export async function readAllCategories(db: D1): Promise<Category[]> {
  const [{ results: cats }, { results: subs }, { results: links }] = await Promise.all([
    db
      .prepare("SELECT id, title, position FROM categories ORDER BY position ASC, id ASC")
      .all<CategoryRow>(),
    db
      .prepare(
        "SELECT id, category_id, title, position FROM subcategories ORDER BY position ASC, id ASC"
      )
      .all<SubRow>(),
    db
      .prepare(
        "SELECT id, subcategory_id, title, url, description, icon, position FROM links ORDER BY position ASC, id ASC"
      )
      .all<LinkRow>(),
  ]);

  if (!cats || cats.length === 0) return [];

  const linksBySub = new Map<string, LinkItem[]>();
  for (const l of links ?? []) {
    const item: LinkItem = {
      id: l.id,
      title: l.title,
      url: l.url,
      ...(l.description ? { description: l.description } : {}),
      ...(l.icon ? { icon: l.icon } : {}),
    };
    const arr = linksBySub.get(l.subcategory_id);
    if (arr) arr.push(item);
    else linksBySub.set(l.subcategory_id, [item]);
  }

  const subsByCat = new Map<string, SubCategory[]>();
  for (const s of subs ?? []) {
    const sub: SubCategory = {
      id: s.id,
      title: s.title,
      items: linksBySub.get(s.id) ?? [],
    };
    const arr = subsByCat.get(s.category_id);
    if (arr) arr.push(sub);
    else subsByCat.set(s.category_id, [sub]);
  }

  return cats.map((c) => ({
    id: c.id,
    title: c.title,
    subCategories: subsByCat.get(c.id) ?? [],
  }));
}

// Full replace via batch: wipe + insert in one D1 batch.
// Cheap for our scale (typical user: <500 links). Diff-based upserts can come later.
export async function writeAllCategories(db: D1, categories: Category[]): Promise<void> {
  const stmts: any[] = [
    db.prepare("DELETE FROM links"),
    db.prepare("DELETE FROM subcategories"),
    db.prepare("DELETE FROM categories"),
  ];

  categories.forEach((cat, ci) => {
    stmts.push(
      db
        .prepare("INSERT INTO categories (id, title, position) VALUES (?, ?, ?)")
        .bind(cat.id, cat.title, ci)
    );
    cat.subCategories?.forEach((sub, si) => {
      stmts.push(
        db
          .prepare(
            "INSERT INTO subcategories (id, category_id, title, position) VALUES (?, ?, ?, ?)"
          )
          .bind(sub.id, cat.id, sub.title, si)
      );
      sub.items?.forEach((link, li) => {
        stmts.push(
          db
            .prepare(
              "INSERT INTO links (id, subcategory_id, title, url, description, icon, position) VALUES (?, ?, ?, ?, ?, ?, ?)"
            )
            .bind(
              link.id,
              sub.id,
              link.title,
              link.url,
              link.description ?? null,
              link.icon ?? null,
              li
            )
        );
      });
    });
  });

  if (stmts.length > 3) await db.batch(stmts);
  else await db.batch(stmts.slice(0, 3));
}

export async function getKVConfig(db: D1): Promise<{ background: string; prefs: UserPreferences }> {
  const { results } = await db
    .prepare("SELECT key, value FROM config WHERE key IN ('background', 'prefs')")
    .all<{ key: string; value: string }>();
  const map = new Map<string, string>();
  results?.forEach((r) => map.set(r.key, r.value));

  let background: string = map.get("background") || DEFAULT_BACKGROUND;
  if (typeof background !== "string" || !background) background = DEFAULT_BACKGROUND;

  let prefs: UserPreferences = DEFAULT_PREFS;
  const rawPrefs = map.get("prefs");
  if (rawPrefs) {
    try {
      const parsed = JSON.parse(rawPrefs);
      if (parsed && typeof parsed === "object") prefs = parsed;
    } catch (e) {
      console.warn("prefs JSON parse failed", e);
    }
  }

  return { background, prefs };
}

export async function isDefaultAuthCode(db: D1): Promise<boolean> {
  const row = await db
    .prepare("SELECT value FROM config WHERE key = 'auth_code'")
    .first<{ value: string }>();
  return !row?.value || row.value === "admin";
}

export function getDefaultCategories(): Category[] {
  return DEFAULT_CATEGORIES;
}

export function getDefaultBackground(): string {
  return DEFAULT_BACKGROUND;
}

export function getDefaultPrefs(): UserPreferences {
  return DEFAULT_PREFS;
}
