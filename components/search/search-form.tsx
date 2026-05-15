import { cn } from "@/lib/utils";

export function SearchForm({
  defaultValue = "",
  source = "search-page",
  className,
  compact = false
}: {
  defaultValue?: string;
  source?: string;
  className?: string;
  compact?: boolean;
}) {
  const placeholder = compact
    ? "Search the site"
    : "Search recipes, reviews, blog, and guides";

  return (
    <form
      action="/search"
      method="get"
      className={cn(
        compact
          ? "flex items-center gap-2 rounded-full border border-charcoal/10 bg-charcoal/[0.04] px-3 py-2"
          : "panel flex flex-col gap-4 p-5 md:flex-row md:items-end",
        className
      )}
    >
      <input type="hidden" name="source" value={source} />
      <div className={compact ? "min-w-0 flex-1" : "flex-1"}>
        {compact ? null : (
          <label htmlFor={`search-q-${source}`} className="mb-2 block text-sm text-charcoal/70">
            Search the site
          </label>
        )}
        <input
          id={`search-q-${source}`}
          name="q"
          defaultValue={defaultValue}
          type="search"
          required
          placeholder={placeholder}
          className={cn(
            compact
              ? "w-full bg-transparent px-2 py-1 text-sm text-charcoal caret-charcoal outline-none placeholder:text-charcoal/45"
              : "w-full rounded-2xl border border-charcoal/15 bg-white px-4 py-3 text-charcoal caret-charcoal outline-none placeholder:text-charcoal/45 focus:border-ember"
          )}
        />
      </div>
      <button
        type="submit"
        className={cn(
          compact
            ? "rounded-full border border-charcoal/15 px-4 py-2 text-sm font-semibold text-charcoal transition hover:border-charcoal/20 hover:text-charcoal"
            : "rounded-full bg-gradient-to-r from-flame to-ember px-6 py-3 font-semibold text-white"
        )}
      >
        Search
      </button>
    </form>
  );
}
