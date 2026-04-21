import type {
  AutomationAgentId,
  AutomationAutonomyMode,
  AutomationRiskClass
} from "@/lib/services/automation-control";

export type AutonomousAgentStatus = "live" | "needs_config";

export type AutonomousAgent = {
  id: AutomationAgentId;
  name: string;
  status: AutonomousAgentStatus;
  cadence: string;
  purpose: string;
  outcome: string;
  dependencyNote: string;
  riskClass: AutomationRiskClass;
  autonomyMode: AutomationAutonomyMode;
  writesLiveState: boolean;
  writesExternalState: boolean;
  isSupport: boolean;
};

export function getAutonomousAgents(input: {
  autoPublishEnabled: boolean;
  hasBuffer: boolean;
  hasPinterestProfile: boolean;
  hasConvertKit: boolean;
  hasSearchConsole?: boolean;
  hasAnthropic?: boolean;
  hasSupabaseAdmin?: boolean;
}) {
  const socialReady = input.hasBuffer;
  const pinterestReady = input.hasBuffer && input.hasPinterestProfile;
  const searchConsoleReady = Boolean(input.hasSearchConsole);
  const aiResearchReady = (input.hasAnthropic ?? true) && (input.hasSupabaseAdmin ?? true);
  const dbReady = input.hasSupabaseAdmin ?? true;

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
        : "Turn on `auto_publish_ai_content` so eligible content can publish on its own.",
      riskClass: "bounded_live",
      autonomyMode: "bounded_live",
      writesLiveState: true,
      writesExternalState: false,
      isSupport: false
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
        : "Add a Pinterest profile to `BUFFER_PROFILE_IDS` so posts can publish instead of just queueing.",
      riskClass: "external_send",
      autonomyMode: "external_send",
      writesLiveState: false,
      writesExternalState: true,
      isSupport: false
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
        : "Connect Buffer so winner pages can be auto-promoted instead of only logged.",
      riskClass: "bounded_live",
      autonomyMode: "bounded_live",
      writesLiveState: true,
      writesExternalState: false,
      isSupport: false
    },
    {
      id: "shop-shelf-curator",
      name: "Shop shelf curator",
      status: dbReady ? "live" : "needs_config",
      cadence: "Daily new pick + nightly catalog refresh",
      purpose:
        "Keeps the shop fresh with new affiliate picks and re-ranks the shelf using real click data.",
      outcome:
        "Protects affiliate revenue by keeping the shelf current and pushing higher-intent products upward.",
      dependencyNote: dbReady
        ? "This agent is already wired to the daily shop-pick run and nightly shelf refresh."
        : "Supabase admin access is required so the shop shelf can mutate live catalog rows.",
      riskClass: "bounded_live",
      autonomyMode: "bounded_live",
      writesLiveState: true,
      writesExternalState: false,
      isSupport: false
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
        ? "ConvertKit is configured for live sends, while the autonomy policy can still keep delivery approval-gated."
        : "Connect ConvertKit to move from draft-only digest creation into real audience delivery.",
      riskClass: "external_send",
      autonomyMode: "draft_only",
      writesLiveState: false,
      writesExternalState: true,
      isSupport: false
    },
    {
      id: "search-insights-analyst",
      name: "Search insights analyst",
      status: searchConsoleReady ? "live" : "needs_config",
      cadence: "Weekly Search Console sync + queue refresh",
      purpose:
        "Pulls Search Console data automatically, turns it into a structured SEO backlog, and refreshes the approval queue without publishing anything by itself.",
      outcome:
        "Keeps core search pages aligned with the query clusters Google is already testing, without collapsing analysis and publishing into the same step.",
      dependencyNote: searchConsoleReady
        ? "Search Console OAuth is configured, so the weekly sync can keep the queue fresh."
        : "Connect Google Search Console so the analyst can fetch live query and page data.",
      riskClass: "draft_only",
      autonomyMode: "draft_only",
      writesLiveState: false,
      writesExternalState: false,
      isSupport: false
    },
    {
      id: "search-recommendation-executor",
      name: "Search recommendation executor",
      status: searchConsoleReady ? "live" : "needs_config",
      cadence: "Daily approved-queue pass + manual run",
      purpose:
        "Reads approved Search Console recommendations, decides which ones are supported by the runtime overlay layer, and applies only those bounded changes.",
      outcome:
        "Turns approved SEO decisions into live site improvements without letting the analyst auto-publish everything it detects.",
      dependencyNote: searchConsoleReady
        ? "Search Console OAuth and the queue are available, so approved items can be applied safely."
        : "Connect Google Search Console so the executor has an approval queue to work from.",
      riskClass: "bounded_live",
      autonomyMode: "bounded_live",
      writesLiveState: true,
      writesExternalState: false,
      isSupport: false
    },
    {
      id: "festival-discovery",
      name: "Festival discovery",
      status: aiResearchReady ? "live" : "needs_config",
      cadence: "Nightly discovery scan",
      purpose:
        "Researches food festivals and writes only draft records so the editorial backlog keeps growing without publishing new public pages directly.",
      outcome:
        "Keeps the events inventory expanding while preserving a clean draft-only review step.",
      dependencyNote: aiResearchReady
        ? "AI research and database access are configured, so new festival ideas can land as drafts."
        : "Anthropic and Supabase admin access are required before nightly draft discovery can run.",
      riskClass: "draft_only",
      autonomyMode: "draft_only",
      writesLiveState: false,
      writesExternalState: false,
      isSupport: false
    },
    {
      id: "pepper-discovery",
      name: "Pepper discovery",
      status: aiResearchReady ? "live" : "needs_config",
      cadence: "Weekly discovery scan",
      purpose:
        "Finds under-covered pepper varieties and inserts only draft-oriented research rows for later editorial review.",
      outcome:
        "Helps the site cover more pepper entities without letting AI research publish unsupported claims live.",
      dependencyNote: aiResearchReady
        ? "AI research and database access are configured, so new pepper entries can land safely as drafts."
        : "Anthropic and Supabase admin access are required before pepper discovery can run.",
      riskClass: "draft_only",
      autonomyMode: "draft_only",
      writesLiveState: false,
      writesExternalState: false,
      isSupport: false
    },
    {
      id: "brand-monitor",
      name: "Brand monitor",
      status: aiResearchReady ? "live" : "needs_config",
      cadence: "Weekly brand and release scan",
      purpose:
        "Tracks emerging hot sauce brands and release signals so the team can decide what belongs in draft research versus approval-gated live publishing.",
      outcome:
        "Keeps brand awareness current while flagging the part of the lane that should not silently auto-publish.",
      dependencyNote: aiResearchReady
        ? "The research stack is configured, but this lane should still be treated as approval-required for high-risk live output."
        : "Anthropic and Supabase admin access are required before the monitor can scan new brands and launches.",
      riskClass: "approval_required",
      autonomyMode: "approval_required",
      writesLiveState: true,
      writesExternalState: false,
      isSupport: false
    },
    {
      id: "tutorial-generator",
      name: "Tutorial generator",
      status: aiResearchReady ? "live" : "needs_config",
      cadence: "Weekly guide generation",
      purpose:
        "Finds one strong how-to topic and writes it into the tutorials backlog as a draft instead of publishing it immediately.",
      outcome:
        "Grows tutorial coverage while keeping the final editorial decision in the draft review layer.",
      dependencyNote: aiResearchReady
        ? "AI research and database access are configured, so draft tutorials can be generated safely."
        : "Anthropic and Supabase admin access are required before tutorial generation can run.",
      riskClass: "draft_only",
      autonomyMode: "draft_only",
      writesLiveState: false,
      writesExternalState: false,
      isSupport: false
    },
    {
      id: "content-shop-sync",
      name: "Content-shop sync",
      status: dbReady ? "live" : "needs_config",
      cadence: "Daily internal sync",
      purpose:
        "Scans recent content against shop inventory and logs match and gap signals that other commerce decisions can use later.",
      outcome:
        "Strengthens the internal merchandising loop without acting like a public-facing autonomous publisher.",
      dependencyNote: dbReady
        ? "Supabase admin access is available, so the support sync can keep commerce signals fresh."
        : "Supabase admin access is required before the content-shop support sync can run.",
      riskClass: "internal_support",
      autonomyMode: "bounded_live",
      writesLiveState: false,
      writesExternalState: false,
      isSupport: true
    }
  ];

  return agents;
}
