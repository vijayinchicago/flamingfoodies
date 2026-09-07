/** Reviewable production copy repair. Default: audit; --propose; --apply after review. */
import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const policy = JSON.parse(fs.readFileSync(new URL("../lib/generation/editorial-policy.json", import.meta.url), "utf8"));
const root = path.resolve("artifacts/editorial-cleanup", process.argv.includes("--articles") ? "articles" : ".");
fs.mkdirSync(root, { recursive: true, mode: 0o700 });
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const allowed = {
  recipes: ["description", "intro", "hero_summary", "seo_description", "tips", "variations", "serving_suggestions", "substitutions", "faqs"],
  blog_posts: ["title", "seo_title", "description", "content", "seo_description"],
  reviews: ["description", "content", "verdict", "best_for", "not_for", "pros", "cons", "flavor_notes", "seo_description"]
};
const patterns = [...policy.artifactPatterns, ...policy.fillerPatterns, "taste buds", "\\belevat\\w*", "trust me", "heat architecture", "(?:brain|receptor|dopamine|endorphin|neurotransmitter|scientists|researchers|studies show|food anthropologists|hijack|50\\s*(?:hz|hertz)|reward cycle|hypersensitiv)"];
const suspect = new RegExp(patterns.join("|"), "i");
const hard = new RegExp([...policy.artifactPatterns, ...policy.fillerPatterns].join("|"), "i");
const leaves = (value, prefix = "") => typeof value === "string" ? [[prefix, value]] : value && typeof value === "object" ? Object.entries(value).flatMap(([key, child]) => leaves(child, prefix ? `${prefix}.${key}` : key)) : [];
const readPath = (obj, key) => key.split(".").reduce((v, k) => v?.[k], obj);
function writePath(obj, key, value) {
  const keys = key.split("."); const last = keys.pop();
  keys.reduce((v, k) => v[k], obj)[last] = value;
}
const urls = (s) => (s.match(/https?:\/\/[^\s)"<>]+/g) || []).sort();
const numbers = (s) => (s.match(/\d+(?:[./]\d+)?/g) || []).sort();
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const save = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", { mode: 0o600 });
function parseObject(text) {
  // Ignore prose after the complete JSON object, as the production parser does.
  const start = text.indexOf("{");
  let depth = 0, quoted = false, escaped = false;
  for (let i = start; i >= 0 && i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') quoted = false;
    } else if (c === '"') quoted = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return JSON.parse(text.slice(start, i + 1));
  }
  throw new Error("No complete JSON object");
}

if (process.argv.includes("--apply")) {
  let applied = 0;
  const approved = JSON.parse(fs.readFileSync(path.join(root, "approved.json"), "utf8"));
  for (const file of approved) {
    if (!/^\w+-\d+\.proposal\.json$/.test(file)) throw new Error("Invalid approval filename");
    const proposal = JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
    if (!proposal.edits.length) continue;
    const { data: current, error } = await db.from(proposal.table).select("*").eq("id", proposal.id).single();
    if (error) throw error;
    if (current.status !== "published") throw new Error(`Status changed: ${file}`);
    const patch = {};
    for (const edit of proposal.edits) {
      const field = edit.path.split(".")[0];
      if (!allowed[proposal.table].includes(field)) throw new Error(`Protected field: ${file}`);
      if (!equal(urls(edit.before), urls(edit.after)) || hard.test(edit.after)) throw new Error(`Invalid reviewed copy: ${file}`);
      if (proposal.table === "recipes" && !equal(numbers(edit.before), numbers(edit.after))) throw new Error(`Recipe numbers changed: ${file}`);
      if (readPath(current, edit.path) !== edit.before) {
        if (readPath(current, edit.path) === edit.after) continue;
        throw new Error(`Copy changed since review: ${file} ${edit.path}`);
      }
      if (!(field in patch)) patch[field] = structuredClone(current[field]);
      writePath(patch, edit.path, edit.after);
    }
    if (!Object.keys(patch).length) continue;
    let update = db.from(proposal.table).update(patch).eq("id", proposal.id).eq("status", "published");
    // Compare every original changed column, including JSON, to avoid overwriting concurrent edits.
    for (const field of Object.keys(patch)) {
      const value = current[field];
      const textArray = Array.isArray(value) && value.every((item) => typeof item === "string");
      const expected = textArray
        ? `{${value.map((item) => `"${item.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",")}}`
        : typeof value === "object" ? JSON.stringify(value) : value;
      update = update.eq(field, expected);
    }
    const { data, error: updateError } = await update.select("id");
    if (updateError) throw updateError;
    if (data.length !== 1) throw new Error(`Concurrent change: ${file}`);
    applied++;
    console.log(`Updated ${proposal.table}/${proposal.id}: ${proposal.edits.length} prose fields`);
  }
  console.log(JSON.stringify({ applied }));
  process.exit(0);
}

const candidates = [];
for (const table of Object.keys(allowed)) {
  if (process.argv.includes("--articles") && table !== "blog_posts") continue;
  const { data, error } = await db.from(table).select("*").eq("status", "published").order("id");
  if (error) throw error;
  let count = 0;
  for (const row of data) {
    const copy = Object.fromEntries(allowed[table].filter((key) => row[key] != null).map((key) => [key, row[key]]));
    const flagged = leaves(copy).filter(([, value]) => suspect.test(value));
    if (!flagged.length) continue;
    count++;
    candidates.push({ table, row, copy, flagged });
  }
  console.log(JSON.stringify({ table, scanned: data.length, flagged: count }));
}
if (!process.argv.includes("--propose")) process.exit(0);
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 120000, maxRetries: 1 });
let cursor = 0;
async function worker() {
  while (cursor < candidates.length) {
    const { table, row, copy, flagged } = candidates[cursor++];
    const base = path.join(root, `${table}-${row.id}`);
    if (fs.existsSync(`${base}.proposal.json`)) continue;
    // Original row is a recovery artifact; never overwrite it on reruns.
    if (!fs.existsSync(`${base}.backup.json`)) save(`${base}.backup.json`, row);
    try {
      const response = await client.messages.create({
        model: process.env.EDITORIAL_CLEANUP_MODEL || process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
        max_tokens: 10000,
        system: policy.rules.join("\n") + "\nCOPY-REPAIR OVERRIDE: The existing articles contain FABRICATED science. Do not preserve, paraphrase or soften it. DELETE unsourced claims about chemical mechanisms, heat-release timing, brain responses, capsaicin breakdown, addiction or pain physiology. Focus only on ingredients, preparation and observable flavor. DELETE invented personal experience, broad cultural stereotypes, contempt for other cuisines, and superiority claims. Shortening is appropriate when removing falsehoods and padding. Do not replace them with new factual claims. Return JSON only, with no commentary afterward.",
        messages: [{ role: "user", content: `Copy-edit this published ${table} page: ${row.title}. Keep the original topic, useful details, links, structure and distinct voice. Return ONLY JSON {"edits":[{"path":"existing.leaf.path","text":"complete replacement string"}]}. Only edit the supplied flagged text leaves; skip any that are already precise and supported. Remove stock hype, redundant hooks and unsupported scientific/physiological mechanisms or research claims; do not replace them with new mechanisms or invent citations. Explain flavors through ingredients and preparation, not speculative neuroscience. No new factual claims, no invented tasting/testing. Preserve all URLs. For recipes preserve every number exactly and do not change culinary advice or procedural details: edit promotional wording only. For blog body preserve headings, lists and the article's useful cooking content; do not summarize the article. Do not add disclosures or bylines to each article. Unchanged leaves need no entry.\n\nFlagged leaves:\n${JSON.stringify(Object.fromEntries(flagged))}\n\nOther copy for context only:\n${JSON.stringify(Object.fromEntries(leaves(copy).filter(([key]) => !flagged.some(([k]) => k === key))))}` }]
      });
      if (response.stop_reason !== "end_turn") throw new Error(`Incomplete response: ${response.stop_reason}`);
      const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
      save(`${base}.response.json`, { text, usage: response.usage });
      const parsed = parseObject(text);
      const permitted = new Map(flagged);
      const seen = new Set();
      const edits = parsed.edits.map((edit) => {
        if (!permitted.has(edit.path) || seen.has(edit.path) || typeof edit.text !== "string" || !edit.text.trim()) throw new Error("Invalid edit path or text");
        seen.add(edit.path);
        const before = permitted.get(edit.path);
        if (!equal(urls(before), urls(edit.text))) throw new Error(`Links changed: ${edit.path}`);
        if (table === "recipes" && !equal(numbers(before), numbers(edit.text))) throw new Error(`Recipe numbers changed: ${edit.path}`);
        if (hard.test(edit.text)) throw new Error(`Stock filler remains: ${edit.path}`);
        if (edit.path === "content" && edit.text.length < 800) throw new Error("Article too short for review");
        return { path: edit.path, before, after: edit.text };
      }).filter((edit) => edit.before !== edit.after);
      save(`${base}.proposal.json`, { table, id: row.id, title: row.title, edits, usage: response.usage });
      console.log(`Proposed ${table}/${row.id}: ${edits.length} fields`);
    } catch (error) { console.log(`REVIEW ${table}/${row.id}: ${error.message}`); }
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
