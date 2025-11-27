# Roadmap & Good-first tasks

This file lists small, high-impact tasks that help drive GitHub contribution activity and make the dapp easier to use. Pick a task, open an issue, and send a PR — each meaningful commit helps contest metrics.

Priority (short-term)

1. Documentation
   - Add screenshots and a short demo GIF to the root `README.md` (good-first)
   - Add a quickstart for running the dapp locally (good-first)

2. Accessibility & UX
   - Add aria labels to important inputs and buttons (good-first)
   - Improve form validation messages and colors (help wanted)

3. Demo flows and contract usage
   - Wire `TransactionDemo` to a verified contract address and add a demo token (help wanted)
   - Add a script in `scripts/` that runs a few demo transactions on a supported testnet (help wanted)

4. CI & Verification
   - Add a GitHub Action to run build/tests and, on release, deploy + run contract verification steps (help wanted)

Suggested Good First Issues (ready to open)

- Add demo GIF to `README.md` — create a `demo/` folder and add `demo.gif`.
- Add `aria-label` attributes to inputs in `dapp/src/components/TransactionDemo.jsx`.
- Create `dapp/docs/quickstart.md` with dev server instructions and expected ports.

How to claim a task

1. Open an issue naming the task and add the label `good first issue`.
2. Assign yourself (or request assignment) and open a PR that references the issue.
3. Keep PRs small — the maintainers will review and merge quickly.
