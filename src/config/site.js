export const PUBLIC_SITE_ORIGIN = "https://www.monicafritzrealtor.com";

/** Correo donde llegan solicitudes de crédito hipotecario (PDF adjunto). */
export const MONICA_CREDIT_EMAIL = import.meta.env.VITE_MONICA_CREDIT_EMAIL || "monicafritzrealtor@gmail.com";

export function buildPublicSiteUrl(pathname = "/") {
    const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
    return `${PUBLIC_SITE_ORIGIN}${path}`;
}
