"use client";

import Link from "next/link";
import { useState } from "react";

import { SearchForm } from "@/components/search/search-form";

const nav = [
  { href: "/recipes", label: "Recipes" },
  { href: "/blog", label: "Blog" },
  { href: "/hot-sauces", label: "Hot Sauces" },
  { href: "/community", label: "Community" },
  { href: "/shop", label: "Shop" },
  { href: "/quiz", label: "Heat Quiz" },
  { href: "/search", label: "Search" }
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-charcoal/70 backdrop-blur-xl">
      <div className="container-shell py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3 lg:gap-6">
          <Link href="/" className="flex min-w-0 items-center gap-3" onClick={() => setMobileOpen(false)}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-flame to-ember text-lg sm:h-10 sm:w-10 sm:text-xl">
            🔥
            </span>
            <div className="min-w-0">
              <div className="truncate font-display text-xl text-cream sm:text-2xl">FlamingFoodies</div>
              <div className="hidden text-xs uppercase tracking-[0.28em] text-cream/55 sm:block">
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
          <div className="hidden xl:block xl:w-[320px]">
            <SearchForm source="header" compact />
          </div>
          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/search"
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream/85 hover:border-white/30 hover:text-white xl:hidden"
            >
              Search
            </Link>
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
          <div className="flex items-center gap-2 lg:hidden">
            <Link
              href="/search"
              className="rounded-full border border-white/15 px-3 py-2 text-sm font-semibold text-cream/85 hover:border-white/30 hover:text-white"
            >
              Search
            </Link>
            <button
              type="button"
              aria-expanded={mobileOpen}
              aria-controls="mobile-header-nav"
              onClick={() => setMobileOpen((value) => !value)}
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream/85 hover:border-white/30 hover:text-white"
            >
              {mobileOpen ? "Close" : "Menu"}
            </button>
          </div>
        </div>
        {mobileOpen ? (
          <div
            id="mobile-header-nav"
            className="mt-4 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 lg:hidden"
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-[1.1rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-cream/88"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-4">
              <SearchForm source="mobile-header" className="p-4" />
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="inline-flex justify-center rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-cream/85"
              >
                Login
              </Link>
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="inline-flex justify-center rounded-full bg-gradient-to-r from-flame to-ember px-4 py-3 text-sm font-semibold text-white"
              >
                Admin
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
