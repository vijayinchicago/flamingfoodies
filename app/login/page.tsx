import { LoginPanel } from "@/components/forms/login-panel";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Log In | FlamingFoodies",
  description: "Sign in to save recipes, join competitions, comment, and manage your FlamingFoodies profile.",
  path: "/login",
  noIndex: true
});

export default function LoginPage() {
  return (
    <section className="container-shell py-16">
      <LoginPanel />
    </section>
  );
}
