# Porter — handoff for Claude Code

This file is the source of truth for turning the current **Otto** app (repo `domchenn/otto-financial`) into **Porter**. Read it fully before changing code. The designs are in `Porter-designs.pdf` (screenshots) and `html/` (the same screens as standalone HTML you can open, inspect and copy styles from).

---

## 0. How to use this pack

| File | What it is | Use it for |
|---|---|---|
| `PORTER_HANDOFF.md` | This spec | Rename, product rules, design tokens, components, AI behavior |
| `Porter-designs.pdf` | 11 pages of final screens | What each screen should look like |
| `png/` | The same screens as PNGs | Viewing one screen at a time |
| `html/` | Standalone HTML for every screen | Exact colors, sizes, spacing and copy (read the inline styles) |

The HTML is a design reference, not production code. Rebuild it in React Native (Expo Router, TypeScript) using shared tokens and components, never by pasting HTML.

---

## 1. Name change: Otto → Porter

The product is now **Porter**. Brand wordmark: lowercase **`porter`**, Plus Jakarta Sans ExtraBold (800), tracking about −0.7px at 20px. The app icon is a white lowercase **p** on sage `#2F6B4F`. Navy `#1F3A5F` is the alternative, not decided yet.

### Rename rules

1. **Change everything users see:** app display name, splash, onboarding, headers, notifications, emails, App Store text, web titles, the landing page, error messages, and the assistant's name in copy ("Ask Porter", "Porter's on it").
2. **Change code identifiers where it's cheap and safe:** component names (`OttoHeader` → `PorterHeader`), copy constants, theme names, README and docs.
3. **Do NOT rename without asking the owner first**, because these break things or need migration:
   - The iOS bundle identifier, EAS project id, Apple app record, push certificates
   - The database name, tables, columns and Alembic history
   - AWS resource names (Lambda, ECR, SSM parameter paths), Terraform state, Neon project names
   - Clerk application ids, Plaid client names and webhooks
   - Environment variable names (add new `PORTER_*` aliases only if asked)
   - API route paths used by released builds
4. Search case-insensitively for `otto` and review every hit. Skip `lockfiles`, `node_modules` and migration files.
5. Note anything you intentionally left as "otto" in a short `RENAME_NOTES.md`.

### Checklist

- [ ] `app.json` / `app.config.*`: `name` → "Porter" (keep `slug`, `scheme` and `bundleIdentifier` unless the owner approves)
- [ ] App icon and splash: new "p" icon on sage; wordmark "porter"
- [ ] All UI strings and the assistant's name → Porter
- [ ] README, PRD and docs → Porter (the old PRD becomes "Otto v1, superseded")
- [ ] Web app and landing page titles, meta tags, favicon
- [ ] Notification and email templates
- [ ] `RENAME_NOTES.md` listing anything intentionally left

---

## 2. Product direction (what Porter is)

**Porter is an AI money companion for premium cardholders.** It knows your whole financial picture, acts for you once you approve, and makes sure every card benefit and point is used. It is a *system* built on your data (a financial model of you plus an agent). The app is one surface of it.

- **Promise:** "Every benefit used. Every dollar understood." Porter advises you better than you could advise yourself: it saves you money, makes you money, and takes busywork away.
- **User:** people with 2+ rewards or premium cards (Platinum, Gold, Sapphire Reserve, Venture X). Many are young: Millennials and Gen Z.
- **Not a card optimizer clone.** MaxRewards, CardPointers, Kudos, CardStack and AwardWallet already do card picks, credit tracking and points balances. Porter wins on **whole-money decisions** (checking, savings, investing and cards), **approvals** (prepared actions), **points to bookable trips**, and a **calm, premium UX**.
- **No ads, no card offers.** Paid subscription, so advice stays on the user's side.
- **Voice:** a calm advisor. Plain sentences. No mascot, no persona, no emoji, no hype.

---

## 3. Information architecture

Bottom bar with **5 items**: `Home · Accounts · [Ask] · Spending · Benefits`. Ask is a raised circular sage button in the center.

| Screen | Key contents (top to bottom) | PDF page |
|---|---|---|
| **Home** | Header (wordmark, date, avatar) · **Daily brief slot** · 3 stats (Net worth, Spent this month vs plan, Next due) · **Porter's on it** (up to 2 approval rows) · **Use before they expire** (horizontal benefit cards with countdown rings) | 1 |
| **Ask** | Opens as a **bottom sheet over the current screen** with the background blurred and dimmed; it is not its own page. User bubble → Porter's answer (one bold sentence) → **plan steps** (numbered, checkable) → **Keep going** chips → input at bottom | 2 |
| **Accounts** | Net worth + stacked bar (cash / investing / cards) · one Porter insight line · Cash group · Investing group (+ "Connect a 401(k), IRA or Roth") · Credit cards row → Cards (wallet) | 3 |
| **Cards (Wallet)** | One card at a time, **swipe** between cards (neighbors peek at the sides), slow tilt + sheen on the active card, tap to flip to its benefits; below: balance / due / credits left, "Use it for", recent on this card | — (see canvas) |
| **Spending** | Month picker · **category ring** with total in the center · "Porter's read" (plain text plus action chips) · missed-points callout ("+210 points you left on the table") · top places | 4 |
| **Benefits** | Holding vs used this year · Expiring soon (rings + Use button) · By card (progress bars) · **Turn points into a trip** banner → Trips | 5 |
| **Points → trips** | From / to / dates / cabin · Porter's one-line take · results ranked by value with a "Porter pick" badge and transfer path ("Transfer Amex → Virgin Atlantic") · data-partner note | 6 |
| **Monthly review** | Totals (spent vs plan, cards paid back, bills on time) · "The takeaway" (plain text, no box) · Where it went · "Set next month's plan" · "Play your recap" tile → **Recap** | 7 |
| **Recap** | 5 story slides you tap through (color + texture per slide, count-up numbers, card of the month, "ALL USED" stamp, shareable summary) | — (see canvas) |
| **Dynamic Island / Live Activity** | After a purchase: compact pill ("$142 left") → expanded (merchant, amount, points earned, budget bar); if a credit applies: green check draws in, "Uber Cash applied", charge crossed out to $0 | — (see canvas) |
| **Web app** | Left sidebar (Home, Accounts, Spending, Benefits, Trips) · main = brief, 4 stats, approvals, expiring benefits · **Ask docked on the right** with conversation + plan + Keep going | 9 |
| **Landing page** | Nav · hero ("Every benefit used. Every dollar understood.") + waitlist + phone mockup · 4 feature cards · Ask demo · single pricing card `[PRICE]` · footer | 10 |

Home in navy is page 8; the wordmark and app icon are page 11.

---

## 4. Design system

### Tokens

```ts
export const colors = {
  bg: '#FFFFFF',          // screen background (white was chosen over stone/sage backgrounds)
  surface: '#F5F5F3',     // cards, inputs, summary slot
  line: '#ECECEA',        // hairlines and dividers
  ink: '#17171A',         // primary text, primary buttons
  muted: '#6B6B70',       // secondary text
  accent: '#2F6B4F',      // sage: Ask button, links, positive states, live dot
  accentAlt: '#1F3A5F',   // navy alternative (not final)
  warn: '#A2502F',        // terracotta: overspend and expiring only
  // category tints: always the same category
  mint: '#E3F0E7',   // groceries, positive
  butter: '#FAF1D6', // dining, credits
  sky: '#E6ECF8',    // transport, travel
  blush: '#F6E6DF',  // shopping
  lilac: '#EEEAF7',  // other, investing
};
export const radius = { card: 22, tile: 18, button: 14, chip: 999, sheet: 30, icon: 12 };
export const space = { screen: 20, gap: 16, section: 18 };
export const type = {
  family: 'Plus Jakarta Sans',  // 400, 500, 600, 700, 800; tabular numbers for all amounts
  title: { size: 28, weight: '800', tracking: -0.9 },
  hero:  { size: 30, weight: '600', tracking: -1.2 },  // big amounts
  answer:{ size: 20, weight: '600', tracking: -0.4 },  // Porter's answer sentence
  body:  { size: 15, weight: '500' },
  label: { size: 12, weight: '700', tracking: 0.4 },   // "TODAY", "PORTER'S ON IT"
  small: { size: 12, weight: '500' },
};
```

### Components (build once, reuse)

1. **SummarySlot** (daily brief): fixed height that fits exactly 3 lines (≈122px), surface background, radius 22, label "TODAY" with a **pulsing sage dot** (means "live AI content"), timestamp on the right, text 16/1.4 weight 500, clamped to 3 lines. It **never changes height**; longer text gets a "Read all" link. Show a skeleton while generating; fall back to a template line on error.
2. **StatRow**: 3 columns split by hairlines: label 12 muted, value 19–20 bold, sub-line 11 colored (warn / muted / accent).
3. **ActionRow** ("Porter's on it"): tinted icon square · bold title · muted reason · buttons `Approve` (ink, filled) + `Not now` (outline). Every insight ends in an action.
4. **BenefitCard**: white with a 1px line border, radius 20, card-art swatch, issuer name, **countdown ring** (terracotta when ≤14 days, sage otherwise), amount, credit name, "Expires in N days", CTA button. In a horizontal scroll with the next card peeking.
5. **TransactionRow**: tinted icon · merchant · sub-line that carries the **benefit tag** ("✓ Uber Cash covered it" in sage with the amount struck through; "Gold · +59 pts at 4x").
6. **TabBar**: floating, inset 12–16px, radius 24, white, soft shadow; 5 items; the center Ask is a 54px sage circle raised above the bar with a white ring.
7. **AskSheet**: bottom sheet (≈660 of 844pt), radius 30, grab handle; the background blurs and dims; tap outside to close. Context-aware: it knows which screen it was opened from.
8. **PlanStep**: numbered circle (or sage check when done) · bold title · muted detail · optional card swatch.
9. **Chip**: 36–40pt, outline, radius 999, used for "Keep going" and follow-ups.
10. **CardArt**: stylized metal gradients (platinum, gold, navy, green). Do not use real issuer artwork without permission.

### Rules

- White background. Use **no black hero cards** and **no gradients** except the card-art metal.
- The answer is **never a big boxed card** (the owner finds that tacky). Porter's answer is plain text on the sheet, followed by structured steps.
- Expiring benefits are visible on Home, not hidden behind a tap.
- Benefits are central but not the headline: the whole financial picture comes first.
- Touch targets are 44pt or more; text contrast is 4.5:1 or better; support Dynamic Type.
- Motion: bars and rings animate in; the live dot pulses; the wallet card tilts slowly with a sheen; haptics on Approve.
- Use the bottom nav bar. Don't use the ✦ sparkle icon for AI. The Ask icon is a ring with a center dot.
- Spending icon = pie slice; Benefits icon = ticket; Accounts icon = bank columns.

---

## 5. AI behavior

| Feature | Output contract |
|---|---|
| Daily brief | `{ summary: string /* ≤140 chars */, detail?: string }`; written by the model from tool results only; cached per day |
| Porter's on it | `{ id, kind: 'sweep_cash'\|'default_card'\|'use_credit'\|'cancel_sub'\|'enroll_benefit', title, reason, impact?: string, primary: string, secondary?: string, status: 'proposed'\|'approved'\|'done'\|'dismissed' }` |
| Ask answer | `{ answer: string, steps?: {title, detail, done: boolean, card?: string}[], followups: string[], basedOn: string[] /* account names */ }` |
| Best card | Before you pay: a nudge by merchant category. After: "points left on the table" callouts. |
| Trips | Results from an award-data partner (Seats.aero partner API, AwardWallet award search API, or a PointsYeah / Pointhound partnership) plus the user's balances and transfer paths, ranked by value. Porter does not build its own scraper. |

**Grounding:** money data is structured, so the model calls typed tools (`get_balances`, `get_transactions`, `get_credits`, `simulate_plan`) and **all math happens in code**. Use RAG (pgvector in the existing Postgres) only for card and travel *knowledge* (benefit terms, reset dates, transfer partners), with a source and last-checked date. Actions always need an explicit Approve and are written to an audit log.

---

## 6. Build order

1. **Rebrand + redesign:** rename (section 1), tokens, new 5-tab nav, Home with the summary slot, Accounts tab, Ask as a sheet.
2. **Agent core:** Plaid webhooks and sync jobs, benefits catalog + matcher, approvals service, grounded Ask with tools and RAG, Live Activity / Dynamic Island (needs the paid Apple Developer Program and APNs).
3. **Delight:** monthly review + recap, wallet card art and swipe, web app, landing page with waitlist.
4. **Travel:** Points to trips with a data partner; later **Passport** (a map of every place you've spent, built from card transaction locations).

Keep the existing stack: Expo / React Native + Expo Router + TypeScript, FastAPI modular monolith on AWS Lambda, Neon Postgres + Alembic, Terraform, GitHub Actions staging → prod, Plaid, Clerk.

---

## 7. Decision log

| Decision | Status |
|---|---|
| Name: Porter (was Otto) | Final |
| Wordmark: lowercase sans "porter"; a classic serif P was tried and rejected | Final |
| Background white; accent sage (navy is the alternative) | Sage default, navy still open |
| Design language: Porter's own (soft, rounded, calm), not cold fintech, not dark or Origin-like, no black and gold | Final |
| No mascot or persona; the AI is shown through behavior (brief, approvals, Ask) | Final |
| Bottom nav, 5 tabs, Ask in the center | Final |
| Ask opens as a sheet with the background blurred; answer = conversation + plan + "Keep going" | Final |
| Home: whole picture first; expiring benefits visible on Home | Final |
| Accounts tab adds checking, savings and investing | Final |
| Wallet: one card at a time with swipe (no fanned stack) | Final |
| Monthly review + story recap with texture | Final |
| Award flights: partner for data, don't build a scraper | Final |
| Pricing | Open: `[PRICE]` |

---

## 8. References

- Design canvas (all rounds; final = Round 8, clickable prototype): https://claude.ai/artifact/Nhb2TJbVGLV4YWMmWuG5eC
- PRD v2: https://claude.ai/artifact/F1Ls8Vq4T8XKhUhrZhDRi4
- Investor deck: https://claude.ai/artifact/YUFUiuaNfo6b2iXAtViXPR
- Repo: https://github.com/domchenn/otto-financial

These links need the owner's claude.ai sign-in. This file plus the PDF and HTML carry everything Claude Code needs offline.
