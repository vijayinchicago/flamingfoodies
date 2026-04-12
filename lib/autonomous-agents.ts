export type AutonomousAgentStatus = "live" | "needs_config";

export type AutonomousAgent = {
  id: string;
  name: string;
  status: AutonomousAgentStatus;
  cadence: string;
  purpose: string;
  outcome: string;
  dependencyNote: string;
};

export function getAutonomousAgents(input: {
  autoPublishEnabled: boolean;
  hasBuffer: boolean;
  hasPinterestProfile: boolean;
  hasConvertKit: boolean;
}) {
  const socialReady = input.hasBuffer;
  const pinterestReady = input.hasBuffer && input.hasPinterestProfile;

  const agents: AutonomousAgent[] = [
    {
      id: "editorial-autopublisher",
      name: "Editorial autopublisher",
      status: input.autoPublishEnabled ? "live" : "needs_config",
      cadence: "Whenever generation runs, then daily publish checks",
      purpose:
        "Turns generated recipes, blog posts, and review drafts into scheduled published content without waiting for manual approval.",
      outcome:
        "Keeps daily inventory going live on its own so the site can compound search traffic.",
      dependencyNote: input.autoPublishEnabled
        ? "Auto-publish is enabled in site settings."
        : "Turn on `auto_publish_ai_content` so eligible content can publish on its own."
    },
    {
      id: "pinterest-distributor",
      name: "Pinterest distributor",
      status: pinterestReady ? "live" : "needs_config",
      cadence: "Daily social queue + publish pass",
      purpose:
        "Creates Pinterest social posts for newly published recipes, blog posts, and reviews, then publishes them through Buffer.",
      outcome:
        "Turns each published page into a fresh traffic shot at Pinterest search and saved-pin discovery.",
      dependencyNote: pinterestReady
        ? "Buffer is configured with a Pinterest profile mapping."
        : "Add a Pinterest profile to `BUFFER_PROFILE_IDS` so posts can publish instead of just queueing."
    },
    {
      id: "growth-loop-promoter",
      name: "Growth loop promoter",
      status: socialReady ? "live" : "needs_config",
      cadence: "Daily winner scan + daily social queue",
      purpose:
        "Finds winner pages from live traffic, share, and affiliate signals, then re-queues the strongest pages for social distribution.",
      outcome:
        "Reuses proven winners to pull more sessions and clicks instead of relying only on brand-new content.",
      dependencyNote: socialReady
        ? "Buffer is configured, so winner pages can move from insights into live promotion."
        : "Connect Buffer so winner pages can be auto-promoted instead of only logged."
    },
    {
      id: "shop-shelf-curator",
      name: "Shop shelf curator",
      status: "live",
      cadence: "Daily new pick + nightly catalog refresh",
      purpose:
        "Keeps the shop fresh with new affiliate picks and re-ranks the shelf using real click data.",
      outcome:
        "Protects affiliate revenue by keeping the shelf current and pushing higher-intent products upward.",
      dependencyNote:
        "This agent is already wired to the daily shop-pick run and nightly shelf refresh."
    },
    {
      id: "newsletter-digest-agent",
      name: "Newsletter digest agent",
      status: input.hasConvertKit ? "live" : "needs_config",
      cadence: "Weekly digest + due-send processing",
      purpose:
        "Builds digest campaigns from published content and sends them when the scheduled window opens.",
      outcome:
        "Turns new inventory and proven winners into repeat traffic instead of one-and-done visits.",
      dependencyNote: input.hasConvertKit
        ? "ConvertKit is configured for live sends."
        : "Connect ConvertKit to move from draft-only digest creation into real audience delivery."
    }
  ];

  return agents;
}
