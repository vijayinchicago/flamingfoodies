export function AdminPage({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Admin</p>
        <h1 className="mt-3 font-display text-5xl text-charcoal">{title}</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-charcoal/65">{description}</p>
      </div>
      {children}
    </div>
  );
}
