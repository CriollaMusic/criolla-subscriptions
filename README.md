# Criolla Subscriptions

Standalone consumer web portal for **Criolla Music** subscriptions. Users sign in (email/password or Google), subscribe through **PayPal smart buttons**, and manage / cancel / reactivate their plan and view payment history.

This site is intentionally separate from the admin dashboard so it can be deployed to its own domain (e.g. `subscriptions.criollamusic.com`) and collect 100% of fees outside the app stores.

## Stack

- Angular 16 (NgModule app)
- Angular Material (cards, forms, table, icons)
- SweetAlert2 for dialogs
- PayPal JS SDK (loaded at runtime)
- Google Identity Services (loaded at runtime)
- Backend: Criolla `UserService` API (auth + subscriptions)

## Routes

| Path        | Page                                            |
|-------------|-------------------------------------------------|
| `/login`    | Email/password + Google sign-in                 |
| `/subscribe`| Plan list with PayPal subscribe buttons         |
| `/manage`   | Active subscription, billing, cancel/reactivate |

`/` redirects to `/manage` (which bounces to `/login` if not authenticated).

## Configuration

All settings live in `src/environments/environment.ts`:

- `userApi` — base URL of the `UserService` API (trailing slash required).
- `payPalClientId` / `payPalEnvironment` — PayPal JS SDK client id (currently **live**).
- `googleClientId` — Google OAuth Web client id.
- `appReturnParam` / `appDeepLink` — native-app return contract (see below).

## Native app return (deep link)

This site is served from the **main domain** (`criollamusic.com`). When the Criolla mobile
app opens it (e.g. `https://criollamusic.com/subscribe?from=app`) it appends `?from=app` (configurable via
`appReturnParam`). The flag is captured at bootstrap (`AppBridgeService.captureReturnFlag`)
and kept in `sessionStorage` across the login → subscribe flow. On a **confirmed/paid
subscription**, instead of routing to `/manage`, the site redirects to the app's deep link
`criollamusic://subscribed?sid=<paypalSubscriptionId>` (configurable via `appDeepLink`).

The mobile app registers an Android intent filter for `criollamusic://subscribed`, comes to
the foreground (cold or warm start), refreshes the user's subscription from the API, and shows
the updated subscription. Web-only visitors (no `from=app`) are unaffected and stay on `/manage`.

## Run locally

```bash
npm install
npm start         # ng serve on http://localhost:4200
```

## Build for deployment

```bash
npm run build     # outputs dist/criolla-subscriptions
```

Copy the **contents** of `dist/criolla-subscriptions/` to your web server root.

### Server requirements

- **SPA fallback:** route all unknown paths to `index.html` (IIS URL Rewrite / Nginx `try_files $uri /index.html` / Apache `FallbackResource /index.html`), or deep links like `/manage` will 404 on refresh.
- **Google OAuth:** add the deployed domain to the OAuth client's *Authorized JavaScript origins* or the Google button won't initialize.
- Served from the domain root (`<base href="/">`). For a subfolder, build with `--base-href /yourpath/`.

### Backend endpoint used

This portal expects these `UserService` endpoints (already present in the API):
`POST User/authenticate`, `POST User/authenticateSocial`,
`GET Subscription/plans`, `GET Subscription/user/{userId}`, `GET Subscription/payments/{userId}`,
`POST Subscription/web-subscribe`, `POST Subscription/cancel`, `POST Subscription/reactivate`.
