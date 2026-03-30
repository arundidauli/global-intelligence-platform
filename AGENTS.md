# Repository Guidelines

## Project Structure & Module Organization
This repository is currently a single-page frontend prototype in [global_intelligence_platform.html](/Users/macbook/Documents/global_intelligence_platform/global_intelligence_platform.html). CSS and JavaScript are embedded in the same file, so keep changes grouped by concern: design tokens and layout in the `<style>` block, UI markup in the HTML body, and behavior in the `<script>` block near the end. There are no dedicated `src/`, `tests/`, or `assets/` directories yet; add them only if the project is split into multiple files.

## Build, Test, and Development Commands
There is no package-based build step configured.

- `python3 -m http.server 8000` from the repo root serves the page locally at `http://localhost:8000/`.
- `open global_intelligence_platform.html` opens the file directly in a browser on macOS for quick inspection.
- `npx prettier --check global_intelligence_platform.html` verifies formatting if Prettier is available locally.

If the project grows beyond a single file, add repeatable build and lint commands here before merging structural changes.

## Coding Style & Naming Conventions
Use 2-space indentation in HTML, CSS, and JavaScript. Preserve the existing naming style: kebab-case for CSS classes (`.stat-card`), camelCase for JavaScript functions and state keys (`runBusinessSearch`, `updateBizStats`), and descriptive IDs prefixed by feature area (`b-`, `j-`, `p-`, `exp-`). Prefer small, targeted edits over broad rewrites because layout, state, and API behavior are tightly coupled in one document.

## Testing Guidelines
No automated test suite is configured yet. Validate changes manually in a browser:

- Confirm layout at desktop and mobile breakpoints.
- Exercise business, jobs, people, and export flows.
- Check console output for JavaScript errors after each change.

When adding automated tests later, place them in a top-level `tests/` directory and use names matching the feature under test, such as `business-search.test.js`.

## Commit & Pull Request Guidelines
Git history is not available in this workspace, so use clear imperative commit subjects such as `Add export validation for empty datasets`. Keep commits focused on one change. Pull requests should include a short summary, manual test notes, and screenshots or screen recordings for UI updates. Link any related issue or task ID in the PR description.

## Security & Configuration Tips
The page calls external APIs from browser-side JavaScript. Do not hardcode real API keys in the HTML; use temporary local values only for manual testing and remove them before committing.
