const VALID_TYPES = new Set(["VIS", "NO_VIS"]);

export function buildSimulatorShareUrl({ propertyValue, mortgageBalance, propertyType }) {
    const value = Math.max(0, Number(propertyValue) || 0);
    const mortgage = Math.max(0, Math.min(Number(mortgageBalance) || 0, value));
    const type = VALID_TYPES.has(propertyType) ? propertyType : "NO_VIS";

    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("sim", "1");
    url.searchParams.set("valor", String(value));
    if (mortgage > 0) url.searchParams.set("hipoteca", String(mortgage));
    url.searchParams.set("tipo", type);
    return url.toString();
}

export function parseSimulatorFromSearch(search = window.location.search) {
    const params = new URLSearchParams(search);
    if (params.get("sim") !== "1") return null;

    const propertyValue = Number(params.get("valor"));
    const mortgageBalance = Number(params.get("hipoteca") || 0);
    const propertyType = params.get("tipo")?.toUpperCase();

    if (!Number.isFinite(propertyValue) || propertyValue <= 0) return null;
    if (!Number.isFinite(mortgageBalance) || mortgageBalance < 0) return null;
    if (mortgageBalance > propertyValue) return null;
    if (!VALID_TYPES.has(propertyType)) return null;

    return {
        propertyValue,
        mortgageBalance,
        propertyType,
        showResults: true,
    };
}

export async function shareSimulatorLink(url) {
    const shareData = {
        title: "Simulador de gastos notariales — Mónica Fritz",
        text: "Te comparto una simulación de gastos notariales para una propiedad.",
        url,
    };

    if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        await navigator.share(shareData);
        return "shared";
    }

    await navigator.clipboard.writeText(url);
    return "copied";
}
