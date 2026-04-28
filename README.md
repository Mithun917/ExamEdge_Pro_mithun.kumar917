# ⚡ ExamEdge Pro

> The intelligent, gamified exam preparation platform — built with pure HTML5, CSS3, and modular Vanilla JavaScript.

---

## 🚀 Quick Start

```bash
# Clone or unzip the project
cd ExamEdge-Pro

# Serve locally (any static file server works)
npx serve .
# or
python3 -m http.server 8080
# or use VS Code Live Server extension
```

Open `http://localhost:8080` in your browser.

> ⚠️ The project uses ES modules (`type="module"`), so it **must be served over HTTP/HTTPS** — opening `index.html` directly via `file://` will not work.

---

## 📁 Project Structure

```
ExamEdge-Pro/
├── index.html                  # App shell & entry point
│
├── css/
│   ├── styles.css              # Design tokens, reset, typography, utilities
│   ├── layout.css              # App shell, navbar, sidebar, grid system
│   └── components.css          # All reusable UI components
│
├── js/
│   ├── app.js                  # Bootstrap, router, component loader
│   ├── config.js               # App-wide constants & feature flags
│   ├── state.js                # Reactive global state manager
│   ├── utils.js                # Shared utilities (DOM, toast, formatters…)
│   ├── firebase.js             # Firebase placeholder (not yet implemented)
│   └── modules/
│       ├── auth.js             # Authentication (mock + Firebase stubs)
│       ├── user.js             # User profile management
│       ├── practice.js         # Practice session logic
│       ├── mock.js             # Mock exam + timer logic
│       ├── exam.js             # Live exam session
│       ├── xp.js               # XP & levelling system
│       ├── achievements.js     # Achievement definitions & unlock logic
│       ├── milestones.js       # Cumulative study milestones
│       ├── leaderboard.js      # Leaderboard fetch & cache
│       └── analytics.js        # Study analytics & subject breakdown
│
├── components/
│   ├── navbar.html             # Top navigation bar
│   ├── sidebar.html            # Left sidebar with nav links
│   └── modal.html              # Modal mount point
│
├── pages/
│   ├── dashboard.html          # Home / overview page
│   ├── practice.html           # Practice mode
│   ├── mock.html               # Mock exam with timer & navigator
│   ├── exam.html               # Live exam join page
│   ├── profile.html            # User profile, stats & achievements
│   └── leaderboard.html        # Global leaderboard
│
└── assets/
    ├── images/                 # Static images
    └── icons/                  # SVG icons / favicon
```

---

## 🏗️ Architecture

### State Management (`js/state.js`)
A lightweight reactive store — no external dependencies:
```js
import { state } from './js/state.js';

state.set('xp', 500);
state.get('xp');                         // 500
state.subscribe('xp', (val) => { … });  // reactive
state.merge('analytics', { totalQuestionsAttempted: 5 });
```
Whitelisted keys are automatically persisted to `localStorage`.

### Routing (`js/app.js`)
Hash-based client-side router. Pages are loaded dynamically via `fetch`:
```
#dashboard   → pages/dashboard.html
#practice    → pages/practice.html
#mock        → pages/mock.html
#exam        → pages/exam.html
#profile     → pages/profile.html
#leaderboard → pages/leaderboard.html
```

### Component Loading
Shared components (navbar, sidebar, modal) are fetched and injected once at boot:
```js
await mountComponent('navbar-mount', 'components/navbar.html');
```

### Module Pattern
Every feature is a self-contained ES module:
```js
// Import only what you need
import { startPracticeSession, submitAnswer } from './js/modules/practice.js';
```

---

## 🎮 Feature Overview

| Feature | Status | Module |
|---|---|---|
| Hash-based SPA routing | ✅ | `app.js` |
| Reactive state + localStorage | ✅ | `state.js` |
| Dark / Light theme toggle | ✅ | `styles.css` |
| Auth (mock + Firebase stubs) | ✅ | `modules/auth.js` |
| Practice sessions | ✅ | `modules/practice.js` |
| Mock exam + timer | ✅ | `modules/mock.js` |
| Live exam join | ✅ | `modules/exam.js` |
| XP & Levelling | ✅ | `modules/xp.js` |
| Achievements | ✅ | `modules/achievements.js` |
| Milestones | ✅ | `modules/milestones.js` |
| Leaderboard | ✅ | `modules/leaderboard.js` |
| Analytics & subject breakdown | ✅ | `modules/analytics.js` |
| Firebase integration | 🔜 | `firebase.js` |
| AI-powered hints | 🔜 | `config.js` feature flag |

---

## 🔥 Firebase Integration

When you're ready to add a backend:

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Fill in your credentials in `js/config.js` under `CONFIG.FIREBASE`
3. Uncomment the stubs in `js/firebase.js`
4. Replace mock data in each module with the Firestore helpers:

```js
// Before (mock)
const data = MOCK_LEADERBOARD;

// After (Firebase)
const data = await queryCollection('users', orderBy('xp', 'desc'), limit(50));
```

Each module has `// TODO:` comments marking every Firebase integration point.

---

## 🎨 Design System

| Token | Value |
|---|---|
| Primary accent | `#6c63ff` |
| Success | `#00e5a0` |
| Danger | `#ff6b6b` |
| Warning | `#ffd166` |
| Display font | Syne (800) |
| Body font | DM Sans |
| Mono font | JetBrains Mono |

All tokens live in `css/styles.css` as CSS custom properties and support both dark and light themes via `data-theme` on `<html>`.

---

## 📦 Dependencies

**Zero runtime dependencies.** Everything runs on native browser APIs:
- ES Modules (`import/export`)
- `fetch` API for component & page loading
- `localStorage` for persistence
- `crypto.randomUUID()` for ID generation
- `Intl` for formatting
- CSS custom properties for theming

---

## 🧩 Extending the Platform

**Add a new page:**
1. Create `pages/mypage.html`
2. Add to `ROUTES` in `js/app.js`
3. Add a `<a class="nav-link" data-route="#mypage">` in `components/sidebar.html`

**Add a new module:**
1. Create `js/modules/mymodule.js`
2. Export your functions
3. Import in `app.js` or in your page's `<script type="module">`

**Add a new achievement:**
```js
// In modules/achievements.js
{
  id:          'my_achievement',
  title:       'My Achievement',
  description: 'Do something awesome.',
  icon:        '🌟',
  xpReward:    150,
  condition:   s => s.analytics.totalQuestionsAttempted >= 250,
}
```

---

## 🛡️ Browser Support

Chrome 89+, Firefox 89+, Safari 15+, Edge 89+ (all support ES modules natively).

---

*Built with ❤️ for serious exam aspirants.*
