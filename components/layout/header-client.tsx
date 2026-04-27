"use client";

import Link from "next/link";
import { useState } from "react";

import { SiteBrand } from "@/components/layout/site-brand";
import { SearchForm } from "@/components/search/search-form";

const primaryNav = [
  { href: "/recipes", label: "Recipes" },
  { href: "/hot-sauces", label: "Hot Sauces" },
  { href: "/reviews", label: "Reviews" },
  { href: "/shop", label: "Shop" }
];

const secondaryNav = [
  { href: "/peppers", label: "Peppers" },
  { href: "/festivals", label: "Festivals" },
  { href: "/blog", label: "Blog" }
];

export function HeaderClient({
  profileHref,
  showLogin,
  showAdmin
}: {
  profileHref?: string;
  showLogin: boolean;
  showAdmin: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-charcoal/70 backdrop-blur-xl">
      <div className="container-shell py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3 lg:gap-5 xl:gap-8">
          <SiteBrand
            href="/"
            subtitle="Flavor-first spicy food"
            priority
            imageSize={44}
            className="shrink-0"
            titleClassName="max-w-[11ch] truncate text-[1.55rem] leading-none sm:max-w-none sm:overflow-visible sm:whitespace-nowrap sm:text-[1.9rem]"
            subtitleClassName="tracking-[0.22em]"
            onClick={() => setMobileOpen(false)}
          />
          <nav className="hidden items-center gap-5 lg:flex xl:gap-6">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-cream/80 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden 2xl:block 2xl:w-[280px]">
            <SearchForm source="header" compact />
          </div>
          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/search"
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream/85 hover:border-white/30 hover:text-white xl:hidden"
            >
              Search
            </Link>
            {profileHref ? (
              <Link
                href={profileHref}
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream/85 hover:border-white/30 hover:text-white"
              >
                Profile
              </Link>
            ) : null}
            {showLogin ? (
              <Link
                href="/login"
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream/85 hover:border-white/30 hover:text-white"
              >
                Login
              </Link>
            ) : null}
            {showAdmin ? (
              <Link
                href="/admin"
                className="rounded-full bg-gradient-to-r from-flame to-ember px-4 py-2 text-sm font-semibold text-white"
              >
                Admin
              </Link>
            ) : null}
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
              aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
              onClick={() => setMobileOpen((value) => !value)}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-sm font-semibold text-cream/85 hover:border-white/30 hover:text-white"
            >
              <span className="sr-only">{mobileOpen ? "Close menu" : "Open menu"}</span>
              <span className="relative flex h-5 w-5 items-center justify-center" aria-hidden="true">
                <span
                  className={`absolute h-0.5 w-5 rounded-full bg-current transition ${
                    mobileOpen ? "rotate-45" : "-translate-y-1.5"
                  }`}
                />
                <span
                  className={`absolute h-0.5 w-5 rounded-full bg-current transition ${
                    mobileOpen ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`absolute h-0.5 w-5 rounded-full bg-current transition ${
                    mobileOpen ? "-rotate-45" : "translate-y-1.5"
                  }`}
                />
              </span>
              <span className="hidden sm:inline">{mobileOpen ? "Close" : "Menu"}</span>
            </button>
          </div>
        </div>
        {mobileOpen ? (
          <div
            id="mobile-header-nav"
            className="mt-4 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 lg:hidden"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ember">Primary paths</p>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {primaryNav.map((item) => (
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
            <div className="mt-5">
              <p className="text-xs uppercase tracking-[0.22em] text-ember">Explore more</p>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {secondaryNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-[1.1rem] border border-white/10 bg-white/[0.02] px-4 py-3 text-sm font-semibold text-cream/78"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-4">
              <SearchForm source="mobile-header" className="p-4" />
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              {profileHref ? (
                <Link
                  href={profileHref}
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex justify-center rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-cream/85"
                >
                  Profile
                </Link>
              ) : null}
              {showLogin ? (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex justify-center rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-cream/85"
                >
                  Login
                </Link>
              ) : null}
              {showAdmin ? (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex justify-center rounded-full bg-gradient-to-r from-flame to-ember px-4 py-3 text-sm font-semibold text-white"
                >
                  Admin
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
