# ⚡ ExamEdge Pro

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> Gamified, intelligent exam preparation platform — built with pure HTML5, CSS3 & modular Vanilla JS. No frameworks. No build step.

---

## 🚀 Quick Start

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/examedge-pro.git
cd examedge-pro

# 2. Serve (MUST use a server — ES modules don't work on file://)
npx serve .
# or
python3 -m http.server 8080

# 3. Open browser
open http://localhost:3000
```

---

## 📁 Project Structure

```
examedge-pro/
├── index.html                  ← App shell + inline dashboard
├── .gitignore
│
├── css/
│   ├── styles.css              ← Design tokens, reset, typography
│   ├── layout.css              ← Navbar, sidebar, grid, responsive
│   └── components.css          ← All reusable UI components
│
├── js/
│   ├── app.js                  ← Bootstrap, SPA router, component loader
│   ├── config.js               ← Constants, feature flags, XP thresholds
│   ├── state.js                ← Reactive global state + localStorage sync
│   ├── utils.js                ← DOM helpers, toast, formatters, debounce
│   ├── firebase.js             ← Firebase stubs (not yet implemented)
│   └── modules/
│       ├── auth.js             ← Auth (mock + Firebase stubs)
│       ├── user.js             ← User profile management
│       ├── practice.js         ← Practice session logic
│       ├── mock.js             ← Mock exam + countdown timer
│       ├── exam.js             ← Live exam join
│       ├── xp.js               ← XP, levelling, streak bonuses
│       ├── achievements.js     ← Achievement definitions + unlock engine
│       ├── milestones.js       ← Cumulative study milestones
│       ├── leaderboard.js      ← Leaderboard fetch + 5-min cache
│       └── analytics.js        ← Accuracy, subject breakdown, history
│
├── components/
│   ├── navbar.html
│   ├── sidebar.html
│   └── modal.html
│
├── pages/
│   ├── dashboard.html
│   ├── practice.html
│   ├── mock.html
│   ├── exam.html
│   ├── profile.html
│   └── leaderboard.html
│
└── assets/
    ├── icons/favicon.svg
    └── images/
```

---

## 🏗️ Architecture

| Layer | File | Role |
|---|---|---|
| State | `js/state.js` | Reactive get/set/subscribe, auto-persists to localStorage |
| Router | `js/app.js` | Hash-based SPA — fetches HTML pages on navigation |
| Config | `js/config.js` | Single source of truth for all constants |
| Utils | `js/utils.js` | Shared pure functions — no side effects |
| Modules | `js/modules/*.js` | Self-contained feature slices |

---

## 🎮 Features

| Feature | Status |
|---|---|
| SPA hash routing | ✅ |
| Reactive state + persistence | ✅ |
| Dark / Light theme | ✅ |
| Practice sessions | ✅ |
| Mock exam + timer | ✅ |
| Live exam join | ✅ |
| XP & levelling system | ✅ |
| Achievements (8 types) | ✅ |
| Study milestones | ✅ |
| Leaderboard | ✅ |
| Analytics & subject breakdown | ✅ |
| Firebase integration | 🔜 |
| AI hints | 🔜 |

---

## 🔥 Firebase Integration

When ready:
1. Fill `CONFIG.FIREBASE` in `js/config.js`
2. Uncomment stubs in `js/firebase.js`
3. Replace `MOCK_*` constants in each module — every integration point is marked `// TODO:`

---

## 🎨 Design Tokens

All in `css/styles.css` `:root {}`:

| Token | Value | Used for |
|---|---|---|
| `--clr-accent` | `#6c63ff` | Primary, XP, level |
| `--clr-accent-2` | `#00e5a0` | Success, accuracy |
| `--clr-accent-3` | `#ff6b6b` | Danger, streak |
| `--clr-accent-4` | `#ffd166` | XP gold, warnings |
| `--font-display` | Syne 800 | Headings |
| `--font-body` | DM Sans | Body text |
| `--font-mono` | JetBrains Mono | Numbers, code |

---

## 📄 License

MIT — free to use, modify, and distribute.
