# RE-SKIN Build Fix V24

This patch fixes the three TypeScript errors reported by the first Vercel deployment.

## Files included
- `src/app/admin/page.tsx`: ensures the pickup status filter is always a string.
- `src/components/LandingInteractions.tsx`: wraps the optional login-mode function in a click callback so the PointerEvent is not passed as the login mode.
- `src/proxy.ts`: updates the Supabase SSR cookie `setAll` callback to the one-argument API supported by the locked `@supabase/ssr` 0.7.x version.

## Apply
Extract this ZIP into the root of the existing local RE-SKIN project and allow the three files to be overwritten. Do not replace or delete `.env.local`.

Then run:

```powershell
npm ci
npm run build
```

If the local build succeeds, commit and push the fix:

```powershell
git add src/app/admin/page.tsx src/components/LandingInteractions.tsx src/proxy.ts
git commit -m "Fix TypeScript errors for Vercel deployment"
git push
```

No Supabase schema or data migration is required for this code fix.
