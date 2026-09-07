export const environment = {
  production: true,
  // Replace with the Render service URL after the first backend deploy,
  // e.g. https://fitros-api.onrender.com — no trailing slash.
  apiBaseUrl: 'https://fitros-api.onrender.com',
  // OAuth 2.0 Web client ID from Google Cloud Console. Filled in before deploy;
  // while empty the "Continue with Google" button reports it is not configured.
  googleClientId: ''
};
