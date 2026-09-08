/** Audit published copy; apply only an explicitly reviewed, exact-match replacement manifest. */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const campaign = process.argv.find((arg) => arg.startsWith("--campaign="))?.split("=")[1] || "planning-jargon";
if (!/^[a-z0-9-]+$/.test(campaign)) throw new Error("Invalid audit campaign name");
const root = path.resolve("artifacts/editorial-cleanup", campaign);
fs.mkdirSync(root, { recursive: true, mode: 0o700 });
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const tables = ["recipes", "blog_posts", "reviews", "brands", "peppers", "festivals", "tutorials"];
const excluded = /(?:url|slug|source|credit|license|disclosure|qa|author|reviewed|status|model|prompt|token|_id$|^id$|recipe_?lane)/i;
const policy = JSON.parse(fs.readFileSync(new URL("../lib/generation/editorial-policy.json", import.meta.url), "utf8"));
const suspect = new RegExp([
  ...policy.planningJargonPatterns, "\\blanes?\\b", "follow-on activity",
  ...(process.argv.includes("--style") ? [...policy.fillerPatterns, ...policy.boilerplatePatterns,
    "\\b(?:sweet spot|hits different|in all the right ways|punch(?:es|ing)? above (?:its|their) weight)\\b"] : [])
].join("|"), "igm");
const leaves = (value, prefix = "") => typeof value === "string" ? [[prefix, value]] : value && typeof value === "object" ? Object.entries(value).filter(([key]) => !excluded.test(key)).flatMap(([key, child]) => leaves(child, prefix ? `${prefix}.${key}` : key)) : [];
const read = (obj, key) => key.split(".").reduce((value, part) => value?.[part], obj);
const save = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", { mode: 0o600 });

if (process.argv.includes("--apply-runtime")) {
  const key = "search_runtime_optimizations";
  const { data, error } = await db.from("site_settings").select("value").eq("key", key).single();
  if (error) throw error;
  const before = "If you found this while looking for how to make a hot chicken sandwich, the make-or-break move is the Nashville oil. Fry the chicken until the crust is solid first, then brush on enough cayenne oil to stain the breading without drowning it, and use slaw plus pickles to keep the sandwich moving.";
  const after = "The Nashville oil is key to this hot chicken sandwich. Fry the chicken until the crust is solid first, then brush on enough cayenne oil to stain the breading without drowning it, and use slaw plus pickles to balance the heat.";
  const value = structuredClone(data.value);
  const recipe = value.recipes?.["nashville-hot-chicken-sandwiches"];
  if (recipe?.introAppendix !== before) throw new Error("Runtime copy changed; review before applying");
  const backup = path.join(root, "search-runtime.backup.json");
  if (!fs.existsSync(backup)) save(backup, data.value);
  recipe.introAppendix = after;
  const { data: updated, error: updateError } = await db.from("site_settings").update({ value }).eq("key", key).eq("value", JSON.stringify(data.value)).select("value");
  if (updateError) throw updateError;
  if (updated.length !== 1 || JSON.stringify(updated[0].value) !== JSON.stringify(value)) throw new Error("Runtime update not verified");
  console.log("Verified one recipe intro override; all other runtime settings preserved.");
  process.exit(0);
}

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
      // Only this known trailing editorial aside may be removed from a method tip.
      // The serving instruction preceding it, all step bodies and quantities stay intact.
      const removeTipAside = /^method_steps\.\d+\.tip$/.test(edit.path)
        && edit.before === " Both earn their place." && edit.after === "";
      if (/^(?:ingredients|ingredient_sections|instructions|method_steps|.*time.*|servings|difficulty)$/.test(field) && !removeTipAside) throw new Error(`Protected recipe field: ${field}`);
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
const { data: runtime, error: runtimeError } = await db.from("site_settings").select("value").eq("key", "search_runtime_optimizations").maybeSingle();
if (runtimeError) throw runtimeError;
const runtimeMatches = leaves(runtime?.value).filter(([, value]) => [...value.matchAll(suspect)].length);
console.log(JSON.stringify({ setting: "search_runtime_optimizations", present: !!runtime, flaggedFields: runtimeMatches.length }));
for (const [key, value] of runtimeMatches) matches.push({ table: "site_settings", id: "search_runtime_optimizations", path: key, text: value });
save(path.join(root, "audit.json"), matches);
for (const { text, ...match } of matches) console.log(JSON.stringify(match));
