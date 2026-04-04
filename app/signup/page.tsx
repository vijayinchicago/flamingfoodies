import { redirect } from "next/navigation";

import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Sign Up | FlamingFoodies",
  description: "Create your FlamingFoodies account to save recipes and join the community.",
  path: "/signup",
  noIndex: true
});

export default function SignupPage() {
  redirect("/login");
}
