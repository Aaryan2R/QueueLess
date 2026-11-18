export function getAppUrl(requestOrigin?: string) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;

  if (configuredUrl && !/^https?:\/\/localhost(?::\d+)?$/i.test(configuredUrl)) {
    return configuredUrl;
  }

  return vercelUrl ?? requestOrigin ?? configuredUrl ?? "http://localhost:3000";
}
