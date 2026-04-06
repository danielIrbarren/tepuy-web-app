export const DEFAULT_PUBLIC_APP_URL = "https://tepuy-web-app.vercel.app";

export function getPublicAppUrl(rawValue = process.env.NEXT_PUBLIC_APP_URL) {
  const normalized = rawValue?.trim();
  return normalized || DEFAULT_PUBLIC_APP_URL;
}
