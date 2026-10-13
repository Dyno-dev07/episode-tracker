# Episode Tracker portal design

_Started 2026-10-13 15:17 UTC_

---

## User

Design a desktop-first web portal called "Episode Tracker" for a small video production team. It replaces a spreadsheet and is used by the social media operator (Deanne) to run every episode from handoff to verified social posts.

BRANDING (WSC client palette, strict)
- Primary: Navy #1B2A4A (sidebar, headers, primary buttons)
- Accent: Gold #C8A951 (active states, status highlights, key labels only; never body text, never full backgrounds)
- Neutrals: white backgrounds, light grey surfaces and borders, dark grey body text (never pure black)
- Typography: Arial for everything. Bold for headings, regular for body. No serif fonts.
- No logo. Use the text "Episode Tracker" in the sidebar header.
- Copy rules: sentence case for all headings and labels, no em dashes, no exclamation points, no emojis. Short, direct labels.
- Clean, structured, operational feel. No gradients, no decorative illustrations.

TEAM AND WORKFLOW
- Tyler: records and edits the episode
- Nik: reviews only
- Wes: approves
- Deanne: owns the tracker and handoffs, builds the social package in OpusClip, schedules, publishes, and verifies all social posts

Episode stages, in order:
1. Recording and edit (Tyler)
2. Review (Nik)
3. Approval (Wes)
4. Social package (Deanne)
5. Scheduled (Deanne)
6. Published (Deanne)
7. Verified (Deanne)

SCREENS AND FUNCTIONS

1. Dashboard
- Pipeline board (kanban) with one column per stage. Episode cards show title, episode number, current owner, due date, and days in stage.
- Summary strip: episodes in progress, waiting on someone else, scheduled this week, published awaiting verification.
- "Needs my action" panel listing episodes sitting in Deanne's stages.

2. Episode tracker (table view)
- Sortable, filterable table of all episodes: number, title, stage, owner, record date, due date, publish date, status.
- Filters by stage, owner, and date range. Search by title.
- Button to add a new episode.

3. Episode detail page
- Header with title, number, current stage, and owner.
- Stage timeline showing every stage with completion date and who completed it.

4. Handoffs (tab on episode detail)
- "Mark complete and hand off" action that moves the episode to the next stage and assigns the next owner.
- Handoff log: who handed off to whom, when, with an optional note.
- Flag for blocked or overdue handoffs.

5. Social package (tab on episode detail)
- Checklist for building the package in OpusClip: clips received from Tyler, clips generated, captions written, captions approved, thumbnails ready.
- Field for the OpusClip project link.
- List of clips, each with clip name, length, target platforms, and caption text.

6. Scheduling (tab on episode detail, plus a calendar screen)
- Per-clip scheduling: platform, date, time, status (draft, scheduled).
- Content calendar screen (week and month views) showing all scheduled posts across episodes, color-coded by platform.

7. Publishing
- Per-post publish status: scheduled, published, failed.
- Field for the live post URL once published.

8. Verification
- Verification checklist per post: post is live, caption correct, video plays, link works, correct account.
- "Mark verified" action. Episode moves to Verified only when every post is verified.
- Report of published posts still awaiting verification.

LAYOUT
- Left sidebar navigation: Dashboard, Episodes, Calendar, Verification.
- Top bar with search and a "New episode" button.
- Show realistic sample data: 6 to 8 episodes spread across different stages, with several clips and posts each.

## Assistant

_[tool: read_skill_prompt]_

_[tool: dc_write]_

_[tool: ready_for_verification]_

I've built Episode Tracker as one clickable prototype. It has four screens: the dashboard, the episodes table, the calendar and the verification report, plus an episode detail page with five tabs. It's out for a final automated check.

- **Sample data:** 8 episodes (EP 108 to 115), one or more in every stage. They include one blocked and overdue episode (112), one post that failed to publish (109) and several published posts awaiting verification. "Today" is set to Oct 13, 2026.
- **Working actions:**
  - "Mark complete and hand off" moves the episode, changes the owner and adds an entry to the handoff log.
  - You can flag an episode as blocked and clear the flag.
  - The checklists, schedule fields, publish status buttons and live post URL fields can all be edited.
  - "Mark verified" only works once all five checks are ticked. When the last post is verified, the episode moves to Verified on its own.
- **Platform colors:** the palette had no colors for telling platforms apart, so I added five muted colors that match in lightness. Gold appears only on active and "your stage" markers.
- **Settings:** there are two adjustable settings: which screen opens first, and full or compact pipeline cards.

Changes only last until the page is reloaded.

## User

Found issues — fixing…

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

I fixed the layout problems that showed up in a narrower window. The fixes are back with the automated check.

- **"Needs my action" rows:** the columns now shrink to fit instead of cutting text off at the right edge.
- **Episode detail header:** the "Mark complete and hand off" button moves onto its own line when space is tight. Labels like "Days in stage" no longer break word by word.
- **Buttons:** "New episode" and "Clear filters" stay on one line.
- **Episodes table and stage timeline:** both now scroll sideways in a narrow window instead of hiding columns.

## User

Found issues — fixing…

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

In a narrow window, the tables in the Scheduling and Publishing tabs now scroll sideways instead of running off the right edge. This works the same way as the Episodes table. The change is back with the automated check.

## User

Address these comments from my teammates:

**Deanne** (on `Episode Tracker.dc.html` at `[data-comment-anchor="28d4993563-div"]`):
<commented-element>react:    Episode Tracker
dom:      body › div#dc-root › div.sc-host › div › div › main › div › div › div › div[2/2]
text:     "OpusClip project link Open in OpusClip"
children: h2, input, a
selector: [data-om-id="ae22d0bf:244"]</commented-element>
<teammate-comment>Well tyler doesn't give me the opus project link since all footage and clips are all on google drive</teammate-comment>

## Assistant

_[tool: grep]_

_[tool: run_script]_

_[tool: ready_for_verification]_

I replaced the OpusClip project link with a Google Drive folder link, following Deanne's comment. The Social package tab now has a "Google Drive folder" field labelled "Footage and clips from Tyler", with an "Open in Google Drive" link.

- **Sample data:** the folder link is now filled in from the Review stage onward, since Tyler shares the folder when he finishes the edit.
- **Checklist:** the first item now reads "Clips received in Google Drive".

There's no longer a field for an OpusClip project link. If Deanne wants to keep her own OpusClip link as a second, optional field, I can add it back.

## User

Address these comments from my teammates:

**Deanne** (on `Episode Tracker.dc.html` at `[data-comment-anchor="ee91e1e9a5-div"]`):
<commented-element>react:    Episode Tracker
dom:      body › div#dc-root › div.sc-host › div › div › main › div
text:     "Back to episodes EP 116 Test Current stage Scheduled Owner …"
children: div, div, div, div
selector: [data-om-id="a5b1e873:133"]</commented-element>
<teammate-comment>There are no options to schedule this post</teammate-comment>

## Assistant

_[tool: grep]_

_[tool: run_script]_

_[tool: ready_for_verification]_

Deanne couldn't schedule anything on EP 116 because a new episode starts with no clips, and the app had no way to add them. You can now add both clips and posts by hand. The change is back with the automated check.

- **Social package tab:** a new "Add clip" form takes the clip name, length, caption and target platforms. Each platform you pick becomes a draft post, dated on the episode's due date.
- **Scheduling tab:** a new "Add post" row lets you pick the clip, platform, date, time and status (draft or scheduled). If the episode has no clips yet, the tab shows a button that takes you to the Social package tab instead.

## User

Address these comments from my teammates:

**Deanne** (on `Episode Tracker.dc.html` at `[data-comment-anchor="18c5cae36b-div"]`):
<commented-element>react:    Episode Tracker
dom:      body › div#dc-root › div.sc-host › div › aside › div › div[2/2]
text:     "WSC video production"
children: text
selector: [data-om-id="09f0d6a9:11"]</commented-element>
<teammate-comment>remove this</teammate-comment>

**Deanne** (on `Episode Tracker.dc.html` at `[data-comment-anchor="ee27a02951-div"]`):
<commented-element>react:    Episode Tracker
dom:      body › div#dc-root › div.sc-host › div › aside › div[3/3]
text:     "D Deanne Social media operator"
children: span, div
selector: [data-om-id="09f0d6a9:18"]</commented-element>
<teammate-comment>Let's remove this part</teammate-comment>

## Assistant

_[tool: grep]_

_[tool: run_script]_

_[tool: ready_for_verification]_

I removed both parts Deanne flagged: the "WSC video production" line under the sidebar header, and the Deanne profile block at the bottom of the sidebar. The page loads without errors.

