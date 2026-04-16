/**
 * Inline affiliate link injection.
 *
 * Scans rendered HTML for product/ingredient mentions and wraps the *first
 * occurrence* of each matched term in a /go/{key} affiliate link.
 *
 * Term list is derived entirely from the AFFILIATE_LINKS catalog — adding a
 * new catalog entry with searchTerms[] automatically makes it linkable in
 * prose. No manual sync required.
 *
 * Skips content inside <a>, <h1-h6>, <code>, and <pre> so we never
 * double-link or corrupt headings.
 *
 * Usage:
 *   const rawHtml = await markdownToHtml(content);
 *   const html = injectInlineAffiliateLinks(rawHtml, "/blog/my-post");
 *
 *   // With dynamic catalog entries loaded from DB:
 *   const html = injectInlineAffiliateLinks(rawHtml, "/blog/my-post", dynamicTerms);
 */

import {
  type InlineCatalogTerm,
  buildInlineTermsFromCatalog,
  type AffiliateLinkDefinition
} from "@/lib/affiliates";

// Re-export for callers that need the type
export type { InlineCatalogTerm };

// ---------------------------------------------------------------------------
// HTML-aware injection
// ---------------------------------------------------------------------------

// Tags whose text content must not be modified
const UNSAFE_TAGS = new Set(["a", "h1", "h2", "h3", "h4", "h5", "h6", "code", "pre", "script"]);

/**
 * Builds a case-insensitive regex for a literal phrase.
 * Negative lookbehind/lookahead prevents matching inside compound words
 * (e.g. "harissa" won't match "harissa-stuffed").
 */
function buildTermRegex(term: string): RegExp {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![\\w-])${escaped}(?![\\w-])`, "i");
}

/**
 * Injects /go/ affiliate links around the first occurrence of each matched
 * ingredient or product name in the HTML.  Safe for dangerouslySetInnerHTML.
 *
 * @param html       Rendered HTML string from markdownToHtml()
 * @param sourcePage Page path for click tracking (e.g. "/blog/my-post")
 * @param extraTerms Additional terms from the dynamic catalog (loaded from DB)
 */
export function injectInlineAffiliateLinks(
  html: string,
  sourcePage: string,
  extraTerms: InlineCatalogTerm[] = []
): string {
  // Build the full term list from catalog + any dynamic extras, then compile regexes
  const allTerms = [...buildInlineTermsFromCatalog(), ...extraTerms];

  // Deduplicate: if the same pattern appears for multiple keys, keep the first one
  const seen = new Set<string>();
  const terms = allTerms
    .filter((t) => {
      if (seen.has(t.pattern)) return false;
      seen.add(t.pattern);
      return true;
    })
    .map((t) => ({ ...t, regex: buildTermRegex(t.pattern) }));

  // Split HTML at tag boundaries — odd indices are tags, even are text nodes
  const parts = html.split(/(<[^>]+>)/);
  const usedKeys = new Set<string>();
  let unsafeDepth = 0;

  const result = parts.map((part, idx) => {
    // Odd parts are HTML tags
    if (idx % 2 === 1) {
      const isClosing = part.startsWith("</");
      const isSelfClosing = part.endsWith("/>") || part.startsWith("<!--");
      const rawTag = part.slice(isClosing ? 2 : 1).split(/[\s>]/)[0].toLowerCase();

      if (UNSAFE_TAGS.has(rawTag)) {
        if (isClosing) {
          unsafeDepth = Math.max(0, unsafeDepth - 1);
        } else if (!isSelfClosing) {
          unsafeDepth++;
        }
      }
      return part;
    }

    // Even parts are text nodes — skip if inside an unsafe zone or empty
    if (unsafeDepth > 0 || !part.trim()) return part;

    let text = part;
    for (const term of terms) {
      if (usedKeys.has(term.key)) continue;

      const replaced = text.replace(term.regex, (match) => {
        if (usedKeys.has(term.key)) return match; // guard against multiple matches in one node
        usedKeys.add(term.key);
        const href = `/go/${encodeURIComponent(term.key)}?source=${encodeURIComponent(sourcePage)}&position=inline`;
        return `<a href="${href}" class="affiliate-inline" rel="sponsored noopener" target="_blank">${match}</a>`;
      });

      if (replaced !== text) text = replaced;
    }

    return text;
  });

  return result.join("");
}
