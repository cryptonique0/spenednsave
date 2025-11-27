# Contributing to WCT_builder_project

Thanks for helping — your contributions increase visibility for the contest and are much appreciated. This guide shows quick, high-impact ways to contribute.

Getting started (local)

1. Fork the repo and create a branch: `git checkout -b feat/your-thing`
2. Install frontend deps and run the dev server:

```bash
cd dapp
npm install
npm run dev
```

3. Make a small, focused change (docs, small UI improvement, accessibility, tests) and open a PR. Small, frequent PRs help the contest metrics.

What counts as a useful contribution

- Clear README improvements or screenshots
- Small UI/UX fixes in `dapp/src/components/`
- Adding reproducible contract interaction demos (no private keys in PRs)
- Tests and CI improvements

Issue/PR process

- Open an issue first if your change is large; for small fixes you can open a PR directly.
- Prefix PR titles with `fix:`, `feat:`, `docs:`, or `chore:`.
- Link any deployed demo or verification link in the PR description.

Code style and checks

- Follow existing project conventions (JSX + minimal inline styles). Keep changes small and focused.
- Include a short description in the PR of why the change helps other contributors.

Security and secrets

- Never commit private keys or API keys. Use GitHub Secrets for CI (see `CONTRIBUTING.md` for examples).

Good first issues

- Look for issues labeled `good first issue` or `help wanted`. If none exist, check `ROADMAP.md` for suggested tasks and open a draft PR to get feedback.

Contact

If you need help, open an issue and tag `@maintainers` (or ask in the project chat if available).

Thanks — every contribution helps your contest rank and makes the project better.
