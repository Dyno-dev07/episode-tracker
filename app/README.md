# Episode Tracker

Desktop-first portal that runs every episode from Tyler's handoff to verified social posts. Built from the Claude Design handoff in `../project/Episode Tracker.dc.html`.

React 19, Vite, TypeScript, Supabase (Postgres, Auth, Realtime).

## Run locally

```sh
npm install
npm run dev
```

Without Supabase settings the app runs in **demo mode**: it loads the sample episodes and saves changes in your browser only.

## Connect Supabase

1. Create a project at supabase.com.
2. In the SQL editor, run each file in `supabase/migrations/` in order (`0001_init.sql`, then `0002_on_hold.sql`). This creates the tables, access policies, the `hand_off`, `verify_post` and `create_episode` functions, and turns on realtime.
3. Optional: run `supabase/seed.sql` to load the 8 sample episodes (EP 108 to 115).
4. Copy `.env.example` to `.env.local` and fill in the project URL and anon key from Project settings > API.
5. Under Authentication > URL configuration, set the Site URL to where the app runs (for example `http://localhost:5173`) and add it to the redirect URLs.
6. Under Authentication > Users, invite Deanne, Tyler, Nik and Wes. Sign-in uses an email link, and only invited users can sign in.

Every signed-in user can read and edit every episode. Changes appear in other open browsers right away.

If you use the Supabase CLI instead: `supabase link`, then `supabase db push`.

## Structure

- `src/data/store.ts`: the read and write interface. `supabaseStore.ts` and `localStore.ts` (demo mode) implement it.
- `src/screens/`: Dashboard, Episodes, Calendar, Verification, and `detail/` with the five episode tabs.
- `src/lib/constants.ts`: stages, owners, platforms, checklists and status colors.
- `supabase/`: schema and seed. Rebuild the seed from `src/data/seed.ts` with `npm run seed:sql`.

## Rules the app enforces

- Stages run in order: Recording and edit (Tyler), Review (Nik), Approval (Wes), Social package, Scheduled, Published, Verified (Deanne).
- "Mark complete and hand off" logs the handoff, moves the stage, assigns the next owner and clears any blocked flag.
- A post can be marked verified only when it is published and all five checks are ticked. The episode moves from Published to Verified automatically when its last post is verified, and cannot be handed off before then.
- Setting a post back to scheduled or failed clears its verification.
- "Edit details" on the episode page changes the episode number, title, record date and due date. Stage and owner change only through handoffs.
- Clips can be edited (name, length, caption, platforms) or deleted. Adding a platform creates a draft post; removing one deletes that platform's posts for the clip.
- "Put on hold" pauses an episode until further notice, with an optional reason. While on hold it cannot be handed off, is never flagged overdue, and is left out of Needs my action and the in-progress counts. "Resume episode" puts it back in its stage.
- Deleting an episode (button on the episode page) removes its handoffs, clips and posts for everyone, after a confirmation.
- Export (Episodes and Calendar screens) downloads posts, episodes or handoffs as CSV for a week, a month or a date range.

URLs can be shared, for example `#/episodes/110/scheduling`.
