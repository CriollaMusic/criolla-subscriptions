export const environment = {
  production: false,
  // Local dev uses a RELATIVE path so the Angular dev-server proxy (proxy.conf.json)
  // forwards API calls to https://api.criollamusic.com server-side, avoiding CORS.
  userApi: '/UserService/',
  // LIVE PayPal client id (browser JS SDK). Completing a checkout creates a REAL subscription.
  payPalClientId: 'ARygiRmayqpNAlPsKGyqdaJyUXs_wDvpDq4Za4hWT-BHbyA8hHVydqplVLL6U6lNRPkq__E0BkSZuXOj',
  payPalEnvironment: 'live',
  payPalCurrency: 'USD',
  // Google OAuth Web client id (shared with the Criolla apps).
  googleClientId: '43814212963-b58clomro65csioapdhhi8sva6rapjvs.apps.googleusercontent.com',
  // When the native app opens this site it appends `?from=app`; on a confirmed
  // subscription we redirect to this deep link so the app returns and refreshes.
  appReturnParam: 'app',
  appDeepLink: 'criollamusic://subscribed'
};
