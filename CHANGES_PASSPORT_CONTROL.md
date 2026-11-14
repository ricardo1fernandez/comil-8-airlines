# COMIL 8 AIRLINES — Passport Control update

Changes made to the original website:
- Added **Passport Control** between **Security** and **Plane Taking Off** in Flight Simulation.
- Passport Control opens the existing English dialogue activity.
- Removed **Gate 4 · Flight to Asia** and **Visiting South Korea, China and Japan** from Flight Simulation.
- Removed the Asia / Gate 4 activity from the interactive terminal and removed Asian destinations from boarding-pass choices.
- Updated stage numbering, navigation, automatic playback, the progress counter, and the return-to-check-in button.
- Preserved all original visual assets, 3D terminal, and other website files.
- Removed `.vercel` metadata from the previous account.

## Deploy
Extract the ZIP and open a terminal in `COMIL8 Airlines`:

```bash
npx vercel --prod
```

Note: Existing `config.js` remains unchanged and may point to the previous Supabase database.
