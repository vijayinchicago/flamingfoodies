/** Audit published copy; apply only an explicitly reviewed, exact-match replacement manifest. */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve("artifacts/editorial-cleanup/planning-jargon");
fs.mkdirSync(root, { recursive: true, mode: 0o700 });
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const tables = ["recipes", "blog_posts", "reviews", "brands", "peppers", "festivals", "tutorials"];
const excluded = /(?:url|slug|source|credit|license|disclosure|qa|author|reviewed|status|model|prompt|token|_id$|^id$|recipe_?lane)/i;
const suspect = /\blanes?\b|\b(?:use cases?|search intent|(?:browse|shop) by intent|why-buy|content (?:pillar|cluster|surface|franchise)|editorial franchise|conversion funnel|engagement signals?|ingredient signals?|audience segment|keyword strategy|email capture|follow-on activity|content-planning|shopping paths?|buying paths?|more paths|pillar guides?)\b|^\s*pillar\s*$/igm;
const leaves = (value, prefix = "") => typeof value === "string" ? [[prefix, value]] : value && typeof value === "object" ? Object.entries(value).filter(([key]) => !excluded.test(key)).flatMap(([key, child]) => leaves(child, prefix ? `${prefix}.${key}` : key)) : [];
const read = (obj, key) => key.split(".").reduce((value, part) => value?.[part], obj);
const save = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", { mode: 0o600 });

if (process.argv.includes("--apply")) {
  const approved = JSON.parse(fs.readFileSync(path.join(root, "approved.json"), "utf8"));
  for (const entry of approved) {
    if (!tables.includes(entry.table)) throw new Error("Unapproved table");
    const { data: current, error } = await db.from(entry.table).select("*").eq("id", entry.id).eq("status", "published").single();
    if (error) throw error;
    const patch = {};
    for (const edit of entry.edits) {
      if (!leaves(current).some(([key]) => key === edit.path)) throw new Error(`Protected path: ${edit.path}`);
      const field = edit.path.split(".")[0];
      // This repair only changes narrative copy, never recipe procedures or quantities.
      if (/^(?:ingredients|ingredient_sections|instructions|method_steps|.*time.*|servings|difficulty)$/.test(field)) throw new Error(`Protected recipe field: ${field}`);
      const original = read(patch[field] === undefined ? current : patch, edit.path);
      if (!original.includes(edit.before) || original.split(edit.before).length !== 2) throw new Error(`Expected one exact match: ${entry.table}/${entry.id} ${edit.path}`);
      if (/https?:|\]\(/.test(edit.before + edit.after)) throw new Error("Do not alter links");
      if (JSON.stringify(edit.before.match(/\d+/g)) !== JSON.stringify(edit.after.match(/\d+/g))) throw new Error("Numbers changed");
      if (!(field in patch)) patch[field] = structuredClone(current[field]);
      const parts = edit.path.split("."); const last = parts.pop();
      parts.reduce((obj, key) => obj[key], patch)[last] = original.replace(edit.before, edit.after);
    }
    const backup = path.join(root, `${entry.table}-${entry.id}.backup.json`);
    if (!fs.existsSync(backup)) save(backup, current);
    let update = db.from(entry.table).update(patch).eq("id", entry.id).eq("status", "published");
    for (const field of Object.keys(patch)) {
      const value = current[field];
      const textArray = ["tips", "variations", "serving_suggestions", "substitutions", "pros", "cons", "flavor_notes"].includes(field) && Array.isArray(value);
      const expected = textArray ? `{${value.map((item) => `"${item.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",")}}` : typeof value === "object" ? JSON.stringify(value) : value;
      update = update.eq(field, expected);
    }
    const { data, error: updateError } = await update.select("id");
    if (updateError) throw updateError;
    if (data.length !== 1) throw new Error("Concurrent edit; stopped safely");
    const { data: verified, error: verifyError } = await db.from(entry.table).select("*").eq("id", entry.id).single();
    if (verifyError) throw verifyError;
    for (const [key, value] of Object.entries(patch)) if (JSON.stringify(verified[key]) !== JSON.stringify(value)) throw new Error("Verification failed");
    console.log(`Verified ${entry.table}/${entry.id}: ${entry.edits.length} replacements`);
  }
  process.exit(0);
}

const matches = [];
for (const table of tables) {
  let offset = 0, total = 0;
  while (true) {
    const { data, error } = await db.from(table).select("*").eq("status", "published").order("id").range(offset, offset + 499);
    if (error?.code === "PGRST205") {
      console.log(JSON.stringify({ table, fallback: "Table unavailable; audit source-backed public content instead." }));
      break;
    }
    if (error) throw error;
    total += data.length;
    for (const row of data) {
      for (const [key, value] of leaves(row)) {
        const hits = [...value.matchAll(suspect)];
        if (!hits.length) continue;
        matches.push({ table, id: row.id, title: row.title || row.name, path: key, text: value, contexts: hits.map((hit) => value.slice(Math.max(0, hit.index - 130), hit.index + hit[0].length + 160)) });
      }
    }
    if (data.length < 500) break;
    offset += 500;
  }
  console.log(JSON.stringify({ table, scanned: total, flaggedFields: matches.filter((m) => m.table === table).length }));
}
save(path.join(root, "audit.json"), matches);
for (const { text, ...match } of matches) console.log(JSON.stringify(match));
