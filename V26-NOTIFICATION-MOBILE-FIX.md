# RE-SKIN V26 — Mobile Notification Dismissal Fix

## Changes
- Added a visible close (×) button to live and demo notification panels.
- Added outside-tap dismissal for touch devices and pointer users.
- Added Escape-key dismissal for keyboard users.
- Kept notification filters, mark-as-read actions, deep links, and notification data behavior unchanged.
- Adjusted the mobile panel to sit below the dashboard action row, use a centered compact width, and limit its height on short screens.
- Applied the same dismissal behavior to both Supabase live mode and local demo mode.

## Files changed
- `src/components/LiveNotificationCenter.tsx`
- `src/components/demo/DemoNotificationCenter.tsx`
- `src/app/globals.css`

No database schema, Supabase credentials, account data, or transaction logic was changed.
