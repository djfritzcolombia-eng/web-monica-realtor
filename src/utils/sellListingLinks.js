import { SELL_STATUS_LABELS } from "../services/sellListingService";
import { getRevisionLabels } from "../constants/sellListingRevision";

const WHATSAPP_PHONE = "573212080985";

export function normalizeOwnerPhone(phone) {
    const digits = String(phone || "").replace(/\D/g, "");
    if (!digits) return null;
    if (digits.length === 10 && digits.startsWith("3")) return `57${digits}`;
    return digits;
}

export function buildSellListingUrl(listingId) {
    if (typeof window === "undefined") {
        return `/vender?id=${listingId}`;
    }
    return `${window.location.origin}/vender?id=${listingId}`;
}

export function buildWhatsAppUrl(message, phone = WHATSAPP_PHONE) {
    const normalized = normalizeOwnerPhone(phone) || WHATSAPP_PHONE;
    return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function buildOwnerStatusMessage(listing) {
    const url = buildSellListingUrl(listing.id);
    const status = SELL_STATUS_LABELS[listing.status] || listing.status;
    const checklistLabels = getRevisionLabels(listing.revisionChecklist || []);
    const lines = [
        `Hola ${listing.ownerName || ""},`.trim(),
        "",
        `Tu solicitud de venta en Mónica Fritz Realtor está en estado: ${status}.`,
        `Referencia: ${listing.id}`,
    ];

    if (listing.accessCode) {
        lines.push(`Código de acceso: ${listing.accessCode}`);
    }

    const hasRevisionFeedback = listing.status === "needs_revision"
        || checklistLabels.length > 0
        || String(listing.revisionNotes || "").trim();

    if (hasRevisionFeedback) {
        if (checklistLabels.length > 0) {
            lines.push("", "Ajustes solicitados:");
            checklistLabels.forEach((label) => lines.push(`- ${label}`));
        }
        if (String(listing.revisionNotes || "").trim()) {
            lines.push("", "Observaciones:", listing.revisionNotes.trim());
        }
        lines.push("", `Puedes corregir y reenviar aquí: ${url}`);
    } else if (listing.status === "approved") {
        lines.push("", "Tu inmueble fue aprobado. Pronto te contactaremos para los siguientes pasos.");
        lines.push("", `Consulta tu solicitud aquí: ${url}`);
    } else if (listing.status === "published") {
        lines.push("", "Tu inmueble ya fue publicado en nuestro inventario.");
        lines.push("", `Consulta tu solicitud aquí: ${url}`);
    } else if (listing.status === "withdrawn") {
        lines.push("", "Tu inmueble fue retirado del inventario público. Si tienes dudas, contáctanos.");
        lines.push("", `Referencia de seguimiento: ${url}`);
    } else if (listing.status === "rejected") {
        lines.push("", "En este momento no podemos continuar con esta solicitud. Si tienes dudas, contáctanos.");
        lines.push("", `Referencia de seguimiento: ${url}`);
    } else {
        lines.push("", `Consulta tu solicitud aquí: ${url}`);
    }

    return lines.join("\n");
}

export function buildOwnerRevisionDraftMessage(listing, revisionNotes, revisionChecklist = []) {
    return buildOwnerStatusMessage({
        ...listing,
        status: "needs_revision",
        revisionNotes,
        revisionChecklist,
    });
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
    const body = (listing.status === "needs_revision"
        || listing.status === "rejected"
        || listing.revisionChecklist?.length
        || String(listing.revisionNotes || "").trim())
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
