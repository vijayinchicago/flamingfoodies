# Flame Club — Referral Reward Sequences (Tier 1 / 2 / 3)

Three single-email MailerLite Automations. Each fires when the subscriber
joins the matching group:

| Tier | Threshold | Group joined (added by app) | Automation to create |
| --- | --- | --- | --- |
| 1 | 3 referrals | `Flame Club — Referrer Tier 1` | "Reward — Tier 1 (Pepper Dossier)" |
| 2 | 5 referrals | `Flame Club — Referrer Tier 2` | "Reward — Tier 2 (Ten-Bottle Shelf)" |
| 3 | 10 referrals | `Flame Club — Referrer Tier 3` | "Reward — Tier 3 (Festival Planner + VIP)" |

The "join group → Automation" wiring lives in MailerLite (see
[`flame-club-mailerlite-setup.md`](./flame-club-mailerlite-setup.md), Step 8).
The codebase auto-adds the subscriber to the right group when a referral
threshold is hit ([lib/services/newsletter.ts](../lib/services/newsletter.ts)).

> **MailerLite template variables:** `{$name|default:"friend"}` falls back to "friend" if no first name is set. `{$referral_token}` is the custom field added on every signup. If MailerLite's editor shows variables as `{{name}}` instead of `{$name}`, both syntaxes work — pick whichever the editor inserts when you click the personalization menu.

## Behavioral framework applied

Each tier is engineered around a different psychological lever. The escalation
matters — if all three rewards felt the same, the loop dies after Tier 1.

- **Tier 1 — quick win.** Fogg's "Tiny Habits" principle: the first reward must arrive *fast* enough that the action feels worth repeating. 3 referrals is achievable in a single texting session. The reward (a printable PDF) is concrete, immediate, and sharable in itself.
- **Tier 2 — variable, anticipatory reward.** This is the Hook Model's "variable reward" peak. By tier 2 they've learned the loop works. The reward is positioned as scarce and curated ("our hand-picked 10 bottles"). The number 10 is psychologically anchored as "complete" — Zeigarnik close.
- **Tier 3 — identity reward.** Status, not stuff. The "lifetime VIP" tag isn't a coupon; it's an identity marker. Identity-based rewards have the longest behavioral half-life (Cialdini, *commitment & consistency*). Once someone identifies as a Flame Club VIP, churn drops to near zero.

Each email also re-asks for referrals. Once someone has shared 3 times, the
ask gets *easier* to honor, not harder (consistency principle).

---

## Tier 1 reward email — "The Pepper Dossier"

Triggered when subscriber joins `Flame Club — Referrer Tier 1` group. Send immediately.

**Subject line:**
`You earned this. The Pepper Dossier is yours.`

**Preview text:**
`40 pages. Every common pepper. What it tastes like. What to cook with it.`

**Body:**

```
Hey {$name|default:"friend"},

Three friends signed up because of you.

That's not nothing. The hot sauce world is small and word of mouth is the
only honest currency in it. Thank you. Genuinely.

As promised, here's your reward:

📕 THE PEPPER DOSSIER
40 pages. Every common pepper. Scoville range, flavor profile, what to cook
with it, what to substitute it with, where to buy it.

→ Download it here: {{ TIER 1 REWARD URL }}

It's printable. Stick it on the inside of your spice cabinet door — that's
where I keep mine.

═══════════════════════════════════════════

Want the next reward? Five total referrals unlocks something better:

🍶 THE TEN-BOTTLE STARTER SHELF
Our curated list of the 10 hot sauces every kitchen should own — with the
cheapest place to buy each. Two more friends and it's yours.

Your share link is still:
https://flamingfoodies.com/flame-club?ref={$referral_token}

═══════════════════════════════════════════

Cook well this week,
Vijay
```

> **Why this works:**
> - Opens with **acknowledgment** ("That's not nothing"). Reciprocity primes the next ask.
> - Reward is **concrete** (PDF link in the email body, not a "claim it" button — friction removed).
> - **Next-tier preview** uses anchoring: now that 3 worked, 5 sounds like only "two more."
> - Share link is at the bottom, *after* the reward — they got the win first; the ask comes second.

---

## Tier 2 reward email — "The Ten-Bottle Starter Shelf"

Triggered when subscriber joins `Flame Club — Referrer Tier 2` group. Send immediately.

**Subject line:**
`Five friends in. Here's the shelf I'd actually buy.`

**Preview text:**
`The 10 hot sauces every kitchen should own. With the cheapest places to buy each.`

**Body:**

```
Hey {$name|default:"friend"},

Five Flame Club referrals. Not bad.

Real talk: most "best hot sauce" lists are written to drive Amazon clicks.
This isn't one of those.

This is the shelf I'd build if I were starting from scratch tomorrow.
10 bottles. Each one earns its space. I'll tell you why I picked each, what
I'd cook with it first, and the actual cheapest place I've found to buy it
(not always Amazon — sometimes the brand's own site beats it by 30%).

📋 THE TEN-BOTTLE STARTER SHELF
→ {{ TIER 2 REWARD URL }}

If you build the whole shelf, send me a photo. I post the best ones in the
Friday email (with your permission, never your last name).

═══════════════════════════════════════════

The last tier is the one I've made it hardest to reach — and the only one
worth flexing.

🎟️ TIER 3 — FESTIVAL PLANNER + LIFETIME VIP
At 10 total referrals, you get our complete US hot sauce festival travel
planner — every festival worth attending, what to buy at each, where to stay,
what to skip. Plus a lifetime VIP tag in Flame Club: first dibs on every
giveaway, drop, and sneak preview I run. Forever.

Five more friends. You're closer than you think.

https://flamingfoodies.com/flame-club?ref={$referral_token}

═══════════════════════════════════════════

— Vijay
```

> **Why this works:**
> - Opens with a **truth-telling frame** ("most lists are written to drive clicks — this isn't one"). Differentiation = perceived value boost.
> - **Photo request** invites them to invest *more* (Hook Model: investment phase). It also fuels future Friday content.
> - Tier 3 framed as **scarce and identity-shaping** ("the only one worth flexing"). Status framing > utility framing at this stage.
> - "Five more friends. You're closer than you think." → loss-aversion + endowed progress (the perception that they've already started something, so finishing feels mandatory).

---

## Tier 3 reward email — "Festival Planner + VIP"

Triggered when subscriber joins `Flame Club — Referrer Tier 3` group. Send immediately.

**Subject line:**
`You're VIP now. (No, seriously.)`

**Preview text:**
`Ten friends in. Here's the festival planner — and your lifetime tag.`

**Body:**

```
Hey {$name|default:"friend"},

Ten Flame Club members because of you. Ten.

Most people who try to share something stall out at three. You hit ten.
That's a different category of human.

Here's everything you've earned:

🎟️ THE VIP FESTIVAL PLANNER
Every US hot sauce festival worth your travel time. What to buy at each.
Where to stay. What to skip. Insider tips from organizers I've talked to.
→ {{ TIER 3 REWARD URL }}

🏷️ LIFETIME VIP TAG (just applied to your account)
You're now flagged in our system. What that means in practice:
  • First-look access to every new bottle drop we cover
  • Free entry to any future giveaway (skip the "enter now" hoops)
  • Early access to anything we ship as a paid product down the road
  • A real human reply if you ever email back. (Hit reply on this email and
    say hi — I'd actually like to know who hit ten.)

═══════════════════════════════════════════

There's no Tier 4. You've maxed it.

But if you want to keep sharing — because at this point, I think you might —
there are three things we'll do for VIPs that money can't buy:

  1. Featured "Sharer Spotlight" in a Friday email (drives traffic to your
     food Instagram, blog, whatever you'd like) — just reply with a link
  2. First seat at any in-person dinner or tasting we ever run
  3. A handwritten thank-you note in the mail — reply with your address if
     you want one

═══════════════════════════════════════════

Genuinely — thank you. This is how a real publication gets built.

— Vijay
```

> **Why this works:**
> - **Identity language** ("That's a different category of human"). Per Cialdini, identity rewards drive lifetime loyalty better than discounts.
> - **Reply request** ("hit reply and say hi") is the deepest investment ask possible — once they've replied, they're psychologically a member of the team, not an audience member. (Also: replies → high inbox-placement reputation with Gmail/Outlook, a tangible deliverability win.)
> - **"There's no Tier 4"** removes ambiguity but immediately offers three optional, money-can't-buy benefits. This protects the loop without cheapening the cap.
> - **Handwritten thank-you note** is a small, weird, memorable gesture. It's the kind of thing people screenshot and post — which is itself a referral driver.

---

## Production checklist before starting these Automations

- [ ] Tier 1 PDF actually exists at `{{ TIER 1 REWARD URL }}`
- [ ] Tier 2 PDF actually exists at `{{ TIER 2 REWARD URL }}`
- [ ] Tier 3 PDF actually exists at `{{ TIER 3 REWARD URL }}`
- [ ] All three Automations show status **Running** in MailerLite (not Draft)
- [ ] Custom field `referral_token` exists on subscribers in MailerLite (alias must be exactly `referral_token`)
- [ ] All three `Flame Club — Referrer Tier N` groups exist and their IDs are in the `MAILERLITE_GROUPS` env var
- [ ] You've manually added yourself to the `Flame Club — Referrer Tier 1` group as a test and confirmed the email arrives within 2 minutes

If you don't have the PDFs ready when you publish, change the link text to
"Coming this week — I'll email it the moment it's live" and ship those
deliverables on a deadline. **Do not let people earn a reward and then
silently drop it.** That kills trust faster than any other newsletter mistake.
