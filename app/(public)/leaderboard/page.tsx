import { SectionHeading } from "@/components/layout/section-heading";
import { buildMetadata } from "@/lib/seo";
import { getLeaderboard } from "@/lib/services/content";

export const metadata = buildMetadata({
  title: "Community Leaderboard | FlamingFoodies",
  description:
    "See the hottest contributors, top heat scores, and the community members driving FlamingFoodies.",
  path: "/leaderboard"
});

export default async function LeaderboardPage() {
  const profiles = await getLeaderboard();

  return (
    <section className="container-shell py-16">
      <SectionHeading
        eyebrow="Leaderboard"
        title="Heat score makes community effort legible."
        copy="Contribution points, likes, and competition wins roll into a visible status system that pushes return behavior."
      />
      <div className="mt-10 overflow-hidden rounded-[2rem] border border-white/10">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-white/5">
            <tr className="text-left text-xs uppercase tracking-[0.24em] text-cream/50">
              <th className="px-6 py-4">Rank</th>
              <th className="px-6 py-4">Member</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Heat score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 bg-white/5">
            {profiles.map((profile, index) => (
              <tr key={profile.id}>
                <td className="px-6 py-5 text-sm text-cream/75">#{index + 1}</td>
                <td className="px-6 py-5">
                  <div className="font-semibold text-cream">{profile.displayName}</div>
                  <div className="text-sm text-cream/55">@{profile.username}</div>
                </td>
                <td className="px-6 py-5 text-sm capitalize text-cream/75">{profile.role}</td>
                <td className="px-6 py-5 text-sm font-semibold text-ember">
                  {profile.heatScore}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
