# Flame Club — Welcome Sequence (3 emails)

Paste each email into the matching step of the MailerLite Automation named
**"Welcome — Flame Club"** (see [`flame-club-mailerlite-setup.md`](./flame-club-mailerlite-setup.md), Step 7).
Each email is annotated with the behavioral psychology principle it applies,
so future edits don't strip out what's load-bearing.

> **MailerLite template variables:** `{$name|default:"friend"}` falls back to "friend" if no first name is set. `{$referral_token}` is the custom field we add to every subscriber. If MailerLite's editor shows variables as `{{name}}` instead of `{$name}`, both syntaxes are supported — pick whichever the editor inserts when you click the personalization menu.

> **Two MailerLite gotchas to know about before you paste anything:**
> 1. **Variables inside link URLs:** the editor auto-detects URLs and converts them to hyperlinks, but stops at the `{` character. So `https://flamingfoodies.com/flame-club?ref={$referral_token}` becomes a link to `https://flamingfoodies.com/flame-club?ref=` (token missing from the href, even though it shows in the visible text). For every URL containing a variable, you must manually create the link via the **Insert link** toolbar button and paste the full URL with the variable into the URL field.
> 2. **No calendar-day promises in the welcome series.** Email 1 fires on signup (any day) and Email 2 fires 3 days later (also any day). Don't write "see you Friday" or "Friday's email" — it's wrong for ~5 of 7 signup days. Save the Friday cadence reference for the actual Friday Broadcast (which always lands Friday because the cron runs Friday 13:00 UTC).

## Behavioral framework applied

We're using two complementary models:

- **BJ Fogg's B = M × A × T** (Behavior = Motivation × Ability × Trigger). For any desired action — open, click, share — all three must be high simultaneously. When motivation is low we increase ability (make the click trivial) or strengthen the trigger (better subject, better hook).
- **Nir Eyal's Hook Model** (Trigger → Action → Variable Reward → Investment). Each email is one cycle of the loop. Variable rewards keep the dopamine loop intact. Investment ("you taught us your heat level") creates switching cost so the next Friday email gets opened.

The welcome sequence's job is to **install the habit of opening Friday emails.**
Everything is engineered toward that single outcome.

---

## Email 1 — sent immediately on signup

**Behavioral logic:**
- Motivation is at its lifetime peak right now — they just signed up. We must deliver real value within 60 seconds or trust collapses.
- Variable Reward: a specific recipe + sauce pick they can use *tonight*.
- Investment: one-click heat-level survey. Tiny ask (high Ability), creates personalization data (locks in switching cost).
- Trigger seed for future emails: explicit promise of "Friday."

**Subject line:**
`You're in. Here's tonight's spicy dinner.`

**Preview text:**
`Plus one bottle worth opening — and a 2-second question that personalizes everything.`

**Body:**

```
Hey {$name|default:"friend"},

Welcome to Flame Club. You're now in a small, weirdly enthusiastic group of
home cooks who like real spice and useful reviews — not stunts.

Before your weekly pick lands, here's something you can use tonight:

🌶️ TONIGHT'S RECIPE
[Korean Gochujang Glazed Salmon — 25 minutes, scales mild→hot]
→ {{ link to a strong evergreen recipe page }}

🔥 ONE BOTTLE WORTH OPENING
[Truff Original — what it's actually good on, what to skip it for]
→ {{ link to the matching review page }}

Now — one quick favor. It'll personalize every email I send you for the next
year:

WHAT'S YOUR HEAT TOLERANCE?

🌶️ Mild — I want flavor, gentle warmth → {{ link with utm + ?heat=mild }}
🌶️🌶️ Medium — I like a kick, kids can still eat → {{ link with ?heat=medium }}
🌶️🌶️🌶️ Hot — bring the burn → {{ link with ?heat=hot }}
🌶️🌶️🌶️🌶️ Inferno — I'm one of *those* people → {{ link with ?heat=inferno }}

(One click. No form. I'll see your answer instantly.)

See you soon with the next pick,
Vijay
FlamingFoodies

P.S. — Did a friend send you here? Send Flame Club back to them. After 3
referrals, I send you our printable Pepper Dossier — the 40-page cheat sheet
on every common pepper, what it tastes like, and what to cook with it.

Your personal share link: https://flamingfoodies.com/flame-club?ref={$referral_token}
```

> **Implementation notes for the heat-level links:**
> - In MailerLite, you can attach a "tag" or "group" to a click using **trackable links**. Easiest path: instead of trying to auto-tag from a click, point each heat-level link at a thin URL on our site (`/flame-club/heat?level=mild` etc.) that records the click in Supabase and redirects to a thank-you page. We can add that endpoint later — for v1, simpler to just have the links go to `/recipes?heat=mild` etc. The personalization data lives in *what they browse next*, not in a dedicated tag.
> - `referral_token` is already pushed to MailerLite as a custom field on every signup ([lib/services/newsletter.ts](../lib/services/newsletter.ts)). Make sure you created the field with the alias `referral_token` (Step 5 of the setup doc) — if the alias is different, the variable will be empty and the share link will fall back to a generic `/flame-club` URL.

---

## Email 2 — sent on Day 3

**Behavioral logic:**
- Trigger: anticipatory — opens a curiosity loop (Zeigarnik effect) that gets resolved by the next Friday Broadcast.
- Action: light read, no click required. Re-establishes the relationship.
- Variable Reward: a behind-the-scenes story.
- **Day-agnostic by design.** Day 3 lands on a different weekday for every signup; calendar promises ("Friday's coming") would be wrong for ~5 of 7 signup days. The recurring Friday Broadcast handles weekday anchoring instead.

**Subject line:**
`The next pick (and why I almost killed it)`

**Preview text:**
`A weeknight dinner that nearly didn't make the cut, plus a sauce I changed my mind about.`

**Body:**

```
Hey {$name|default:"friend"},

The next pick almost didn't ship.

I tested the recipe four times last weekend. The first version was too sweet.
The second was too salty. The third was so good I thought I'd faked it. The
fourth — a small tweak that makes it weeknight-doable — is what's headed
your way.

One-line tease: it's a one-pan dinner, under 35 minutes, that tastes like it
took an hour. The heat dial goes from "your toddler can eat it" to "you'll
need water." Same pan.

The bottle pick is something I was publicly skeptical of last year and
quietly changed my mind on after three months on my shelf. I'll explain why
when you get it.

That's it for today. No clicks, no homework. Just a heads up so it doesn't
catch you mid-meeting when it lands.

— Vijay

P.S. — If you didn't tell me your heat level yet, one click and it
personalizes everything I send you:

🌶️ Mild → https://flamingfoodies.com/recipes?heat=mild
🌶️🌶️ Medium → https://flamingfoodies.com/recipes?heat=medium
🌶️🌶️🌶️ Hot → https://flamingfoodies.com/recipes?heat=hot
🌶️🌶️🌶️🌶️ Inferno → https://flamingfoodies.com/recipes?heat=inferno
```

> **Why no big CTA:** at Day 3, the goal is to *show up* and reinforce the brand voice. A heavy ask here breaks rapport. The P.S. catches anyone who skipped the first email's poll.

---

## Email 3 — sent on Day 7 (first real Friday)

**Behavioral logic:**
- This is the first delivery on the promised cadence. Hook Model habit-loop completes here: trigger (Friday morning) → action (open) → variable reward (this week's specific recipe + bottle) → investment (saving, sharing, replying).
- Includes a referral nudge in the footer — by now they've experienced one full cycle of value, so the ask lands at peak motivation.
- Subject line is intentionally simple and "branded" — over time, a recognizable subject pattern (`Flame Club Friday — [hook]`) becomes its own trigger.

**Subject line:**
`Flame Club Friday — the dinner that almost didn't ship`

**Preview text:**
`One recipe, one bottle, one tiny shopping tip. ~3 min read.`

**Body:**

```
Hey {$name|default:"friend"},

Welcome to your first real Flame Club Friday. Here's the format you'll get
every week:

ONE RECIPE WORTH COOKING
ONE BOTTLE WORTH OPENING
ONE THING WORTH KNOWING

That's it. No 17-link listicle. No filler. Three things.

═══════════════════════════════════════════
🌶️ ONE RECIPE WORTH COOKING
═══════════════════════════════════════════

[Recipe title — e.g. Sichuan-Style Cumin Lamb, 35 min]

[2-3 sentences on why this one. The "I almost killed it" backstory pays off
here — readers like seeing the gut-check, not just polish.]

→ Get the recipe: {{ recipe URL }}

PRO TIP: [one specific, useful thing — e.g. "If you can only buy one new
spice for this, it's whole cumin seed, not ground. Toast in a dry pan 60
seconds. The difference is enormous."]

═══════════════════════════════════════════
🔥 ONE BOTTLE WORTH OPENING
═══════════════════════════════════════════

[Bottle name — e.g. Marie Sharp's Smoked Habanero]

[2-3 sentences. What it's good on (specifically — "great on eggs and roasted
sweet potato"), what to skip it for ("don't waste it on tacos — too smoky for
the mix"), what it costs.]

→ Read the full review: {{ review URL }}
→ Buy the bottle: {{ affiliate link }}

═══════════════════════════════════════════
💡 ONE THING WORTH KNOWING
═══════════════════════════════════════════

[A tiny, useful, kitchen-spice fact. Could be: a Scoville myth, a
fermentation tip, a "the difference between cayenne and aleppo" note. Keep
under 80 words.]

═══════════════════════════════════════════

That's the whole thing. See you next Friday.

— Vijay

—

P.S. — One ask: if you know one person who'd love Flame Club, send them
this:

https://flamingfoodies.com/flame-club?ref={$referral_token}

After 3 friends sign up, I send you our printable Pepper Dossier — 40 pages,
free, no catch. The hot sauce world is small. Word of mouth is how it grows.
```

> **Why this format:** scannable, predictable, repeatable. Predictability is a feature for newsletters — it lowers the cognitive cost of opening (high Ability), which protects open rates over time. The "1/1/1" structure is a pattern they can tell friends about ("it's a recipe + a sauce + a tip — that's it"), which itself drives referrals.

---

## After this sequence

The subscriber rolls into your normal Friday broadcast cadence. Continue
shipping the **same 1/1/1 format** every week. Variation should live *inside*
each block, not in the structure. Habit formation requires structural
consistency.

Optional next-cycle additions (don't build until welcome → Friday is solid):
- Day 14: re-engagement email if no opens after first 2 Fridays
- Day 30: "what'd you think of your first month?" feedback ask (also surfaces UGC)
- Quarterly: subscriber survey → resurfaces investment, gives you content fuel
