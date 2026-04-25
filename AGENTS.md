# DJMIXHUB project instructions

## Project goals
- Keep this site simple, dark, modern, and music-focused.
- Preserve the DJMIXHUB brand and tagline:
  "Open Source Energy. Community Sourced Mixes."
- Optimize for easy self-hosted Docker deployment.
- Optimize for both phone and desktop use.
- Prefer maintainability over cleverness.

## Working rules
- Do not overengineer.
- Do not introduce unnecessary dependencies.
- Do not rewrite large sections unless clearly needed.
- Preserve existing functionality unless a bug or UX issue requires change.
- Keep edits minimal and practical.

## Configuration rules
- Move environment-specific values into config/env where reasonable.
- Prefer a single obvious config pattern over multiple competing ones.
- Create or maintain `.env.example`.
- Do not place secrets in browser-exposed frontend code.
- If a value must be public, keep it in clearly named public config.

## Code quality
- Reuse existing structure where possible.
- Reduce hardcoded URLs, domains, endpoints, and station IDs.
- Improve naming only when it clearly helps readability.
- Keep comments concise and useful.

## Deliverables
- Summarize current structure first.
- Then explain config/env plan.
- Then implement.
- Then list changed files and why.
- Update README with local/dev/deploy instructions.
