# Global Intelligence Platform

LeadScope is a static frontend app for business lead discovery, job search, people lookup, and spreadsheet-friendly exports using user-provided Apify API keys.

## Features

- Business lead search using Google Maps data through Apify actors
- Job discovery across multiple sources
- People finder with LinkedIn-focused public search flows
- CSV, TSV, JSON, and browser sheet exports
- User-specific Apify API key saved in the browser
- Static hosting friendly deployment

## Project Structure

```text
global_intelligence_platform.html
scripts/
  apify.js
  export.js
  init.js
  render.js
  searches.js
  state.js
  ui.js
styles/
  main.css
```

## Requirements

- Modern browser
- Internet connection
- Apify account and API key for each user who wants to run searches

## Local Development

Serve the project from the repository root:

```bash
python3 -m http.server 8000
```

Open:

```text
http://localhost:8000/
```

You can also open `global_intelligence_platform.html` directly, but using a local server is better for realistic testing.

## How Users Add Their Apify Key

1. Open the app.
2. Click `Get Apify API Key` in the sidebar.
3. Create or copy an Apify API key from the Apify console.
4. Paste the key into the `Apify API Key` field.
5. The key is saved in that user’s browser until they remove it.

Important:

- Keys are not hardcoded in the project.
- Keys are stored in the browser for that user only.
- If `localStorage` is unavailable, the app falls back to browser cookies.
- Users can remove the saved key using `Remove Saved Key`.

## Export Formats

The export center supports:

- `CSV`: best for Excel
- `TSV`: tab-separated text export
- `JSON`: structured data export
- `Browser Sheet View`: opens a table in a new browser tab and includes a CSV download link

Spreadsheet export behavior:

- Stable column order per module
- Human-readable headers
- Better Excel compatibility with UTF-8 BOM and CRLF line endings
- Safer cell output for spreadsheet apps

## Deploy on Vercel

This project can be deployed as a static site on the Vercel Hobby plan.

### Recommended Vercel Settings

- Framework Preset: `Other`
- Build Command: leave empty
- Output Directory: leave empty
- Install Command: leave empty
- Root Directory: repository root

### Deploy Steps

1. Push this repo to GitHub.
2. Open Vercel.
3. Click `Add New...` -> `Project`.
4. Import `global-intelligence-platform`.
5. Keep the project as a static site with no build command.
6. Deploy.

## Production Model

This app is designed for a client-side usage model:

- Each user brings their own Apify key.
- Each user stores that key in their own browser.
- Your deployment does not need to store or manage shared Apify secrets.

This is suitable for static hosting. If you ever want to use one shared platform-owned Apify key, move API calls behind a backend service.

## Manual QA Checklist

Before production use, verify:

- Business search runs and returns results
- Job search runs and filters work
- People finder runs and renders results
- Export center downloads valid CSV, TSV, and JSON files
- Browser sheet view opens correctly
- Saved Apify key persists after refresh
- Remove key flow clears the saved value
- Mobile layout is usable
- Browser console has no JavaScript errors

## Security Notes

- Do not commit real API keys to the repository.
- This app uses browser-side requests to Apify and OpenStreetMap Nominatim.
- Hosted deployments should use HTTPS only.
- Users should use their own Apify accounts and keys.

## Tech Notes

- No package manager or build pipeline is required
- No backend is required for the current deployment model
- JavaScript is split into small browser-loaded modules under `scripts/`

## License

Add your preferred license here before public distribution.
