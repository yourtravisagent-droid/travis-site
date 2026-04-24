# Travis — marketing site

Static one-page site describing the Travis personal-AI-chief-of-staff
feature set. No backend, no analytics, no tracking. Every page is hand-
written HTML using a shared stylesheet.

Deployed on Vercel from the `main` branch of this repo.

```
.
├── index.html            # landing: hero + feature grid + philosophy
├── style.css             # shared tokens + layout (dark theme)
├── vercel.json           # clean URLs, no trailing slash
└── features/             # one page per agent
    ├── auto-grocery.html
    ├── theory.html
    ├── warren.html
    ├── morning-briefing.html
    ├── family-note.html
    ├── calendar-auto.html
    ├── kid-daily.html
    ├── inbox-scanner.html
    ├── cc-benefits.html
    ├── awardwallet.html
    ├── travel-toolkit.html
    └── security.html
```

Each feature page uses the same 4-step card pattern (Learn / Act / Handle /
Respect, accented per category). The intent is consistent visual rhythm —
same skeleton, different colors, different content, easy to add a 13th.

Accent system: body class controls the CSS variable. `.a-green`, `.a-orange`,
`.a-gold`, `.a-blue`, `.a-pink`, `.a-teal`, `.a-lav`, `.a-red`.

Nothing here is Travis's source. For that, see the starter repo.
