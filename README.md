# Trips Dashboard Web

React (JavaScript) + Vite + Tailwind CSS v4 + PrimeReact 10, talking to the Trips Dashboard API.

## Run

    npm install          # also copies the PrimeReact light and dark themes into public/themes
    copy .env.example .env
    npm run dev          # http://localhost:5173
    npm test             # 36 tests
    npm run build        # production build in dist/

The API must allow the origin you open the app from. The default `CORS_ORIGINS` already includes
http://localhost:5173. Start the API with auth either on (log in with `DASHBOARD_ACCESS_KEY`) or off (`AUTH_ENABLED=false`).

## Themes

Light and dark, switchable from the header and the login page.
- First visit follows the operating system. After you pick one, your choice is saved and wins.
- The page applies the theme before first paint (inline script in `index.html`), so there is no flash.
- Switching loads the new PrimeReact stylesheet first, then removes the old one.
- Tailwind colors (`bg-card`, `text-muted`, `border-line`, `text-accent`, `bg-surface`, `text-fg`) read the PrimeReact
  theme variables, so everything follows the active theme. Use `dark:` for the few cases that need an explicit override.
- The navy dark palette is set in `src/index.css` (`html.dark`). Change the five variables there to restyle it.
- To use other PrimeReact themes, change the two names in `scripts/copy-themes.mjs` and the two paths in `index.html`.

## How it fits together

    src/
      main.jsx, App.jsx   entry point and routes
      api/                fetch wrapper (errors, 401 handling, downloads), one function per endpoint
      lib/                config, formatting (rupees, lakh and crore), dates, CSV download, query client
      hooks/              TanStack Query data hooks
      features/
        auth/             login page, token store, AuthProvider, RequireAuth
        theme/            light and dark switching
        realtime/         SSE connection with tickets, refresh provider, Live badge
        filters/          city, date range and zoom level, kept in the URL
        dashboard/        dashboard page and the chart data helpers
      layout/             app shell around the private pages
      test/               test setup and fakes

Rule of thumb: code used by one feature lives inside that feature, code used by several lives in `lib`, `api` or `hooks`.
Tests sit next to the file they test.

Live refresh: the API pushes a `refresh` event when new data lands. The provider invalidates all queries, and the ETag
makes unchanged refetches almost free. After any reconnect the app refetches once, in case an event was missed.
