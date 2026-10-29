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

## Backend

- Advisor system instructions must remain server-owned constants; validated caller context belongs only in user-role data, never in system instructions, to prevent instruction injection.

- This project uses an external, user-managed Supabase project (ref `pvcamhciwpfharnrbsij`) — not Lovable Cloud. Never create a new project or re-enable Cloud; app-internal server logic goes through TanStack server functions (`createServerFn`), not Supabase Edge Functions. Service-role key is stored as a secret; never expose it to the browser.
- The app currently renders mock data from `src/lib/data.ts`; pages are not yet wired to the database.
