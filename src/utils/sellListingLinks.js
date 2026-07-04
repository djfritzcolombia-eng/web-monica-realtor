import { SELL_STATUS_LABELS } from "../services/sellListingService";

const WHATSAPP_PHONE = "573212080985";

export function buildSellListingUrl(listingId) {
    if (typeof window === "undefined") {
        return `/vender?id=${listingId}`;
    }
    return `${window.location.origin}/vender?id=${listingId}`;
}

export function buildWhatsAppUrl(message, phone = WHATSAPP_PHONE) {
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function buildOwnerStatusMessage(listing) {
    const url = buildSellListingUrl(listing.id);
    const status = SELL_STATUS_LABELS[listing.status] || listing.status;
    const lines = [
        `Hola ${listing.ownerName || ""},`.trim(),
        "",
        `Tu solicitud de venta en Mónica Fritz Realtor está en estado: ${status}.`,
        `Referencia: ${listing.id}`,
    ];

    if (listing.accessCode) {
        lines.push(`Código de acceso: ${listing.accessCode}`);
    }

    if (listing.status === "needs_revision") {
        lines.push("", "Mónica solicitó estos ajustes:", listing.revisionNotes || "Revisa las observaciones en el enlace.");
        lines.push("", `Puedes corregir y reenviar aquí: ${url}`);
    } else {
        lines.push("", `Consulta tu solicitud aquí: ${url}`);
    }

    return lines.join("\n");
}

export function buildOwnerSubmissionMessage(listing) {
    const url = buildSellListingUrl(listing.id);
    return [
        `Hola ${listing.ownerName || ""},`.trim(),
        "",
        "Recibimos tu inmueble en Mónica Fritz Realtor.",
        `Referencia: ${listing.id}`,
        listing.accessCode ? `Código de acceso: ${listing.accessCode}` : "",
        "",
        "Guarda estos datos para consultar o corregir tu solicitud.",
        `Enlace de seguimiento: ${url}`,
    ].filter(Boolean).join("\n");
}

export function buildOwnerMailto(listing, subjectPrefix = "Tu solicitud de venta") {
    const subject = `${subjectPrefix} · ${listing.id}`;
    const body = listing.status === "needs_revision"
        ? buildOwnerStatusMessage(listing)
        : buildOwnerSubmissionMessage(listing);
    return `mailto:${encodeURIComponent(listing.ownerEmail || "")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export async function copyText(text) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
}
