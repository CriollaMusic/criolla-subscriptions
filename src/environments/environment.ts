export const environment = {
  production: true,
  // Criolla UserService API (handles auth + subscriptions). Trailing slash required.
  userApi: 'https://api.criollamusic.com/UserService/',
  // PayPal checkout is kept in the codebase but hidden until this is true.
  paypalEnabled: false,
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
