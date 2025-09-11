export const ALLOW_ADS_PATHS = ["/"];

export function isAdsAllowed(pathname) {
  return ALLOW_ADS_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}
