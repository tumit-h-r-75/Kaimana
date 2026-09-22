# Kaimana — Frontend

**Pressure makes the edge.** Kaimana is a competitive-programming platform: solve problems against a real judge, get coached by AI on the code you actually wrote, practise mock interviews out loud, and compete in timed contests.

This repository is the web app. The API lives in [Kaimana-back](https://github.com/tumit-h-r-75/Kaimana-back).

- **Live site:** https://kaimana.vercel.app
- **API:** https://kaimana-back.vercel.app

---

## What's inside

| Area | What it does |
| --- | --- |
| **Problem library** (`/problems`) | Search, filter by difficulty and topic, grid or list view. Each card shows an excerpt, acceptance rate and submission count. Suggestions for what to open next. |
| **Workspace** (`/problems/[slug]`) | Monaco editor in Python, C++, JavaScript and TypeScript. Run against the samples or your own stdin, submit to the hidden tests, and see the failing line marked in the editor. |
| **AI coach** | Tiered hints paid for in gems, a Big-O audit of your submission, refactor suggestions checked against the tests, and the reference solution once you have solved it. |
| **Execution visualizer** | Steps through a Python run line by line, showing every variable at each step (behind a feature flag). |
| **Contests** (`/contest`) | Timed rounds with registration, a live gate on the workspace, and a scoreboard. Approved hosts can run their own. |
| **Mock interviews** (`/interview`) | An AI interviewer asks, follows up on what you say, and scores correctness, approach, complexity and communication. |
| **Community** (`/community`) | Every accepted solution in a searchable, filterable feed, with comments. |
| **Leaderboard, analytics, profile** | Rank, score, streaks, difficulty breakdown, submission history with verdict filters. |
| **Kids** (`/kids`) | *Code Quest* — robot puzzles with blocks, then real Python, for ages 8–14. |
| **Admin** (`/admin`) | Problems, test cases (including AI-generated ones that must be reviewed), users and roles, contests, host requests and problem proposals. |
| **Live notifications** | Decisions on your proposals and host requests, comments on your solutions, new contests and problems — as toasts, desktop notifications and a bell. |

## Tech stack

- **Next.js 15** (App Router) and **React 19**, written in **TypeScript**
- **CSS Modules** plus a small token layer in `app/globals.css` (dark, one accent)
- **Monaco Editor** via `@monaco-editor/react`
- No UI framework: dialogs, toasts, menus and charts are built in the codebase

## Getting started

Requires Node.js 22 or newer.

```bash
npm install
# create .env.local with the variables below (all optional for local work)
npm run dev                  # http://localhost:3000
```

| Script | Does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build (also type-checks and lints) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run format` / `format:check` | Prettier |

## Environment variables

Set these in `.env.local` locally and in the Vercel project settings for deployments. **Never commit `.env.local`.**

| Variable | Purpose |
| --- | --- |
| `BACKEND_ORIGIN` | Where the API runs. `/api/*` is proxied there by `next.config.ts`, so the browser only ever talks to this site. Defaults to the production API. |
| `NEXT_PUBLIC_API_URL` | **Leave empty.** An empty value makes the client call the same-origin `/api/*` proxy, which keeps the auth cookie first-party. |
| `NEXT_PUBLIC_APP_URL` | The site's own URL, for metadata and Open Graph links. |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.IO endpoint. Unused on Vercel, where the API is serverless. |
| `NEXT_PUBLIC_FEATURE_VISUALIZER` | `true` to show the execution visualizer. |

> A blank variable counts as unset. `BACKEND_ORIGIN=` falls back to the production API instead of proxying to nowhere.

## How it fits together

```
browser ──► kaimana.vercel.app ──/api/*──► kaimana-back.vercel.app ──► MongoDB
                  (Next.js)          proxy          (Express)            Judge0 · Groq / Gemini
```

- **Same-origin API.** Every request goes to `/api/*` on this site and is rewritten to `BACKEND_ORIGIN`. The session cookie is therefore first-party, and browsers that block third-party cookies still stay signed in.
- **Live updates without sockets.** Vercel functions can't hold a connection open, so `providers/NotificationsProvider.tsx` polls: every 30 seconds while the tab is visible, every 90 while hidden, and at once when you come back.
- **Dialogs, not `window.confirm`.** `providers/DialogProvider.tsx` gives every page `dialog.confirm()`, `dialog.alert()` and `dialog.toast()`.

## Project structure

```
app/            Routes (App Router), one folder per page, each with its CSS module
  _components/  Site header, footer and the homepage sections
components/     Shared UI by domain — admin, editor, workspace, kids, proposals, ui…
hooks/          useReveal, useDismiss
lib/            API client and one module per API area, formatting helpers
providers/      Auth, dialogs and toasts, live notifications
types/          Shared API types
public/         Static assets
```

## Accessibility and responsiveness

- Layouts collapse to a single column on phones, and grid tracks use `minmax(0, 1fr)` so a long line of code can't widen the page. Admin tables become labelled cards under 700 px.
- Keyboard support throughout: tabs move with the arrow keys, menus close on Escape and give focus back, and dialogs trap focus.
- All motion stops under `prefers-reduced-motion`.

## Author

Designed and built by **Tumit Hasan**.

[Portfolio](https://my-protfolio-tumit.web.app/) · [GitHub](https://github.com/tumit-h-r-75) · [LinkedIn](https://www.linkedin.com/in/tumit-hasan-rafi/)
