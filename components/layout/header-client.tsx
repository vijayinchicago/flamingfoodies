"use client";

import Link from "next/link";
import { useState } from "react";

import { SiteBrand } from "@/components/layout/site-brand";
import { SearchForm } from "@/components/search/search-form";

const primaryNav = [
  { href: "/recipes", label: "Recipes" },
  { href: "/reviews", label: "Reviews" },
  { href: "/hot-sauces", label: "Hot Sauces" },
  { href: "/peppers", label: "Peppers" },
  { href: "/how-to", label: "How-To" },
  { href: "/blog", label: "Blog" },
  { href: "/shop", label: "Shop" }
];

export function HeaderClient({
  profileHref,
  showLogin
}: {
  profileHref?: string;
  showLogin: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-charcoal/10 bg-white/85 backdrop-blur-xl">
      <div className="container-shell py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3 lg:gap-5 xl:gap-8">
          <SiteBrand
            href="/"
            subtitle="For real kitchens and mixed tables"
            priority
            imageSize={44}
            className="shrink-0"
            titleClassName="max-w-[13ch] truncate text-[1.35rem] leading-none sm:max-w-none sm:overflow-visible sm:whitespace-nowrap sm:text-[1.9rem]"
            subtitleClassName="tracking-[0.16em]"
            onClick={() => setMobileOpen(false)}
          />
          <nav className="hidden items-center gap-3 lg:flex xl:gap-5">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap text-sm font-semibold text-charcoal/75 hover:text-charcoal"
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
              className="rounded-full border border-charcoal/15 px-4 py-2 text-sm font-semibold text-charcoal/75 hover:border-charcoal/20 hover:text-charcoal xl:hidden"
            >
              Search
            </Link>
            {profileHref ? (
              <Link
                href={profileHref}
                className="rounded-full border border-charcoal/15 px-4 py-2 text-sm font-semibold text-charcoal/75 hover:border-charcoal/20 hover:text-charcoal"
              >
                Profile
              </Link>
            ) : null}
            {showLogin ? (
              <Link
                href="/login"
                className="rounded-full border border-charcoal/15 px-4 py-2 text-sm font-semibold text-charcoal/75 hover:border-charcoal/20 hover:text-charcoal"
              >
                Login
              </Link>
            ) : null}
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              aria-expanded={mobileOpen}
              aria-controls="mobile-header-nav"
              aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
              onClick={() => setMobileOpen((value) => !value)}
              className="inline-flex items-center gap-2 rounded-full border border-charcoal/15 px-3 py-2 text-sm font-semibold text-charcoal/75 hover:border-charcoal/20 hover:text-charcoal"
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
            className="mt-4 rounded-[1.75rem] border border-charcoal/10 bg-charcoal/[0.04] p-4 lg:hidden"
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {primaryNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-[1.1rem] border border-charcoal/10 bg-charcoal/[0.04] px-4 py-3 text-sm font-semibold text-charcoal/80"
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
                  className="inline-flex justify-center rounded-full border border-charcoal/15 px-4 py-3 text-sm font-semibold text-charcoal/75"
                >
                  Profile
                </Link>
              ) : null}
              {showLogin ? (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex justify-center rounded-full border border-charcoal/15 px-4 py-3 text-sm font-semibold text-charcoal/75"
                >
                  Login
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
