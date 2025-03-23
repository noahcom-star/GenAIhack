export function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Server-side
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

export function getAuthRedirectUrl() {
  return `${getBaseUrl()}/auth/callback`;
}

export function getCookieDomain() {
  if (process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN) {
    return process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN;
  }
  if (typeof window !== 'undefined') {
    return window.location.hostname;
  }
  if (process.env.VERCEL_URL) {
    return process.env.VERCEL_URL;
  }
  return 'localhost';
} 