# TODO

The working backlog. Scope and acceptance criteria live in [`docs/prd.html`](docs/prd.html);
this file is the order things get done in.

How to use it: add items as one line with a checkbox, keep the most important at the top of
each section, and delete an item when its PR merges (git history is the record). Link the PR
or PRD section when there is one.

## Now: finish the MVP slice

- [ ] Check Home, Wallet, a card and Transactions against the First Platypus Bank sandbox
      numbers on the phone

## Next

- [ ] Show net worth in the app: cash and investments vs card balances, the accounts behind
      each, and a history chart from the daily snapshots (1W / 1M / 3M / 1Y / All) (PRD F2)
- [ ] Benefits and expiring credits: catalog YAML, period generator, "needs attention" on
      Home, mark used (PRD F4, M2)
- [ ] Credits that aren't statement credits: Uber Cash (in the Uber app), Bilt Cash, DoorDash
      discounts on Sapphire Reserve, and travel-portal credits (Amex Travel, Chase Travel,
      Capital One Travel, Citi Travel). Need their own detection or a manual-only flow (PRD F4)
- [ ] Weekly and monthly budgets from real transactions; replace the sample $500 limit and
      the Spending tab's sample data (PRD F5)
- [ ] Points: quick manual update plus estimate since last confirmed (PRD F3)
- [ ] Deploy staging (Lambda + Neon) so the app works away from the Mac
- [ ] Plaid webhooks and the 6-hourly safety refresh; needs the public staging URL (PRD F1)
- [ ] Account deletion endpoint; Settings → Delete account is still a placeholder

## Later

- [ ] Apply for Plaid Production; register the OAuth redirect URI and bundle ID in the Plaid
      dashboard (Chase and Amex use OAuth)
- [ ] Apple Developer Program ($99/yr): native Sign in with Apple, one-year profiles instead
      of seven days, TestFlight, and the Live Activity and FinanceKit entitlements
- [ ] Clerk production instance with Otto's own Google and Apple credentials
- [ ] Real-time spend: App Intent, Live Activity / Dynamic Island, reconciliation (PRD §06, M3)
- [ ] Apple Card through FinanceKit (PRD F1 P1)
- [ ] Issuer alert emails through SES inbound (PRD §06)
- [ ] Push notifications (APNs) and the 8:00 daily digest (PRD F6)

## Research

- [ ] Floating tab bar at the bottom: how it should look and behave (blur, hide on scroll,
      safe-area and keyboard handling, accessibility), and whether to keep the custom
      `TabBar` or move to native tabs

## Dev environment

- [ ] Consider moving Otto's Postgres container to port 5433 so the setup doesn't rely on
      OrbStack's `*.orb.local` hostname (Homebrew `postgresql@15` on 5432 belongs to other
      projects and stays)
- [ ] Consider `expo-dev-client` for a launcher screen to pick the Metro server
- Free Apple team builds expire after 7 days: plug in the phone and run `make ios`
