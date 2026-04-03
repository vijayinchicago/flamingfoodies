import Link from "next/link";

const navSections = [
  {
    title: "Overview",
    items: [{ href: "/admin", label: "Dashboard" }]
  },
  {
    title: "Content",
    items: [
      { href: "/admin/content/blog", label: "Blog" },
      { href: "/admin/content/recipes", label: "Recipes" },
      { href: "/admin/content/reviews", label: "Reviews" }
    ]
  },
  {
    title: "Community",
    items: [
      { href: "/admin/community/moderation", label: "Moderation" },
      { href: "/admin/community/users", label: "Users" },
      { href: "/admin/community/comments", label: "Comments" }
    ]
  },
  {
    title: "Automation",
    items: [
      { href: "/admin/automation/jobs", label: "Jobs" },
      { href: "/admin/automation/schedule", label: "Schedule" },
      { href: "/admin/automation/trigger", label: "Trigger" }
    ]
  },
  {
    title: "Growth",
    items: [
      { href: "/admin/newsletter/subscribers", label: "Subscribers" },
      { href: "/admin/newsletter/campaigns", label: "Campaigns" },
      { href: "/admin/newsletter/new", label: "Compose" },
      { href: "/admin/social/queue", label: "Social queue" },
      { href: "/admin/analytics/traffic", label: "Traffic" },
      { href: "/admin/analytics/affiliate", label: "Affiliate" },
      { href: "/admin/analytics/content", label: "Content analytics" }
    ]
  },
  {
    title: "Settings",
    items: [
      { href: "/admin/settings/general", label: "General" },
      { href: "/admin/settings/affiliates", label: "Affiliates" },
      { href: "/admin/settings/audit-log", label: "Audit log" }
    ]
  }
];

export function AdminSidebar() {
  return (
    <aside className="panel-light h-fit p-5">
      {navSections.map((section) => (
        <div key={section.title} className="mb-7 last:mb-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ember">
            {section.title}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl px-3 py-2 text-sm text-charcoal/70 transition hover:bg-charcoal/5 hover:text-charcoal"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}
