export async function copyToClipboard(text) {
    const value = String(text || "");
    if (!value) return false;

    try {
        if (navigator.clipboard?.writeText && window.isSecureContext) {
            await navigator.clipboard.writeText(value);
            return true;
        }
    } catch {
        // Continúa con el fallback clásico.
    }

    try {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.top = "0";
        textarea.style.left = "0";
        textarea.style.opacity = "0";
        textarea.style.pointerEvents = "none";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        textarea.setSelectionRange(0, value.length);
        const copied = document.execCommand("copy");
        document.body.removeChild(textarea);
        return copied;
    } catch {
        return false;
    }
}
