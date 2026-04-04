export const ANALYTICS_EVENTS = {
  pageView: "page_view",
  affiliateClick: "affiliate_click",
  emailSignup: "email_signup",
  onboardingComplete: "onboarding_complete",
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

export type EventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
