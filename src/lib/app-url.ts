export function getAppUrl(requestOrigin?: string) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;

  const publicOrigin =
    requestOrigin && /^https:\/\//i.test(requestOrigin) ? requestOrigin.replace(/\/$/, "") : undefined;
  if (publicOrigin) return publicOrigin;

  if (configuredUrl && !/^https?:\/\/localhost(?::\d+)?$/i.test(configuredUrl)) return configuredUrl;
  if (vercelUrl) return vercelUrl;
  if (configuredUrl) return configuredUrl;
  return "http://localhost:3000";
}
