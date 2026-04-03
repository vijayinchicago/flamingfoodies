import Link from "next/link";

const nav = [
  { href: "/recipes", label: "Recipes" },
  { href: "/blog", label: "Blog" },
  { href: "/reviews", label: "Reviews" },
  { href: "/community", label: "Community" },
  { href: "/competitions", label: "Competitions" },
  { href: "/quiz", label: "Heat Quiz" }
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-charcoal/70 backdrop-blur-xl">
      <div className="container-shell flex items-center justify-between gap-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-flame to-ember text-xl">
            🔥
          </span>
          <div>
            <div className="font-display text-2xl text-cream">FlamingFoodies</div>
            <div className="text-xs uppercase tracking-[0.28em] text-cream/55">
              Turn Up the Heat
            </div>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-cream/80 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream/85 hover:border-white/30 hover:text-white"
          >
            Login
          </Link>
          <Link
            href="/admin"
            className="rounded-full bg-gradient-to-r from-flame to-ember px-4 py-2 text-sm font-semibold text-white"
          >
            Admin
          </Link>
        </div>
      </div>
    </header>
  );
}
