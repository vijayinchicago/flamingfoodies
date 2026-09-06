import { LoginPanel } from "@/components/forms/login-panel";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Admin Sign In | FlamingFoodies",
  description: "Restricted administrator sign-in for FlamingFoodies.",
  path: "/login",
  noIndex: true
});

export default function LoginPage({
  searchParams
}: {
  searchParams?: { error?: string };
}) {
  return (
    <section className="container-shell py-16">
      <LoginPanel initialMessage={searchParams?.error || ""} />
    </section>
  );
}
