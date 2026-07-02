export const PUBLIC_SITE_ORIGIN = "https://www.monicafritzrealtor.com";

export function buildPublicSiteUrl(pathname = "/") {
    const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
    return `${PUBLIC_SITE_ORIGIN}${path}`;
}
