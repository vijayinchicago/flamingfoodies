import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container-shell py-24">
      <div className="panel mx-auto max-w-2xl px-8 py-16 text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-4 font-display text-5xl text-cream">The heat ran cold.</h1>
        <p className="mt-4 text-cream/75">
          The page you&apos;re after is missing, archived, or still simmering.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-full bg-flame px-6 py-3 font-semibold text-white"
        >
          Back to home
        </Link>
      </div>
    </section>
  );
}
