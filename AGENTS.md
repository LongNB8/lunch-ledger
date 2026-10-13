<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Use TanStack Start and React for LunchDebt; preserve the template router instead of introducing another framework.
- Place shared LunchDebt navigation in the root layout and domain UI in src/components/lunchdebt so every leaf page shares the same desktop/mobile shell.
- Meals and meal_items are owner-scoped Cloud tables saved via an authenticated server function that re-checks the bill total; member management uses owner-scoped Cloud tables and authenticated validated server functions.
- Calculate optional meal VAT with the shared meal-totals module and persist server-generated tax item rows with the original eater IDs; this keeps existing ledger and balance calculations accurate without changing historical dish prices.
- Debts come from the security-invoker view view_member_balances (item price split evenly across its members minus payments); settling re-reads the balance server-side so a payment always equals the full debt.
- Define visual roles and responsive geometry in src/styles.css so desktop and iPhone layouts share a semantic design system.
- Member management stays public with an inline sign-in CTA; private records are read after session hydration and every mutation validates through the authenticated server boundary and RLS.
- Teams and members store an owner UUID and a composite team/owner foreign key to prevent cross-account associations; transfer codes are globally unique.
- Homepage, daily ledger and debt breakdowns share an authenticated owner-scoped ledger read and query cache; this keeps real records consistent without fabricated per-meal payment statuses.
- Daily ledger date and expanded meal are validated URL search parameters; saved-meal navigation and direct links retain the same view after refresh.
- Dish management uses the owner-scoped dishes table with authenticated validated server functions; meal creation suggests saved dishes for the meal name chips and dish name/price prefills.
- Persist dish icon identifiers validated by a shared allowlist and render them through a shared icon component so dish management and meal choices remain consistent.
- Resolve the reserved management login alias through login-identity before standard Cloud Auth; provision its confirmed account out of band, never with a public bootstrap endpoint or browser credentials, and preserve owner-scoped access.
