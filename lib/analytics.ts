export const ANALYTICS_EVENTS = {
  affiliateClick: "affiliate_click",
  emailSignup: "email_signup",
  quizStart: "quiz_start",
  quizComplete: "quiz_complete",
  recipeRating: "recipe_rating",
  recipeSave: "recipe_save",
  recipeShare: "recipe_share",
  communitySubmit: "community_submit",
  competitionEnter: "competition_enter",
  voteCast: "vote_cast",
  likePost: "like_post",
  commentPosted: "comment_posted",
  userFollow: "user_follow",
  searchPerformed: "search_performed",
  heatScoreMilestone: "heat_score_milestone",
  scrollDepth: "scroll_depth"
} as const;

type EventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    plausible?: (eventName: string, options?: { props?: Record<string, unknown> }) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

export function trackEvent(name: EventName, payload: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  window.gtag?.("event", name, payload);
  window.plausible?.(name, { props: payload });
}
