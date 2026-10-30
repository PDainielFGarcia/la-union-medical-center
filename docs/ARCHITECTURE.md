# Architecture

## Intent

Recreate the La Union Medical Center (LUMC) hospital UI in React (JavaScript) with a clean API boundary so Laravel + MySQL can replace the mock layer later.

## Layout

- Public: `/login` split-screen marketing + sign-in card.
- Authenticated shell: 256px `slate-900` sidebar, 64px header, `slate-50` content.
- Full-screen: `/public-display` hospital clinic queue board (codes only, live clock; no sidebar).

## Auth

1. `LoginPage` calls `useAuth().login`.
2. `authService` calls `authApi.login` and stores `{ token, user }` in `localStorage`.
3. `ProtectedRoute` restores the session via `GET /user`.
4. `401` responses clear the session and redirect to `/login`.

## Data flow

`Page → api/*.js → apiClient.request → mock handlers OR Axios → Laravel`

Pages do not import `services/mock`.

## Roles

Sidebar items are filtered in `src/layouts/navConfig.js`. Administrator sees all modules; other roles see the operations they own. Unauthorized deep links redirect home with an on-screen notice.

Queues are **per clinic** (not per doctor). Availability toggles: doctor → self only; OPD/admin → any; nursing → none. Notifications and queue/bed/display views refresh on a short poll for near–real-time updates.

## Visual system

Tailwind utilities matching the reference:

- Primary: `blue-600` / `blue-700`
- Sidebar: `slate-900`
- Cards: white, `rounded-xl`, light border
- Status badges: emerald / amber / red / blue pills
