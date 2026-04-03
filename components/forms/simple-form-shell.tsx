export function SimpleFormShell({
  title,
  copy,
  children
}: {
  title: string;
  copy: string;
  children: React.ReactNode;
}) {
  return (
    <section className="container-shell py-16">
      <div className="panel-light mx-auto max-w-3xl p-8">
        <h1 className="font-display text-5xl text-charcoal">{title}</h1>
        <p className="mt-4 text-sm leading-7 text-charcoal/70">{copy}</p>
        <div className="mt-8 space-y-5">{children}</div>
      </div>
    </section>
  );
}
