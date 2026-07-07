import { buildPublicSiteUrl } from "../config/site";
import { ALL_CREDIT_SEARCH_KEYS } from "../constants/searchZones";
import { formatCOP } from "./housingCreditCalculator";
import { parsePriceFromLabel } from "./eventMetadata";

const VALID_TYPES = new Set(["VIS", "NO_VIS"]);
const VALID_MODES = new Set(["by_property", "by_payment"]);
const VALID_MODALITIES = new Set(["PESOS", "UVR"]);

/** Margen superior: incluye propiedades hasta +10% sobre el valor simulado */
export const CREDIT_PRICE_BUFFER = 0.10;

/** Límites sanos para filtro (COP) */
export const MIN_SANE_PROPERTY_VALUE = 30_000_000;
export const MAX_SANE_PROPERTY_VALUE = 3_000_000_000;

export const CREDIT_SESSION_KEY = "monica_credit_simulation_v1";

export function sanitizePropertyValue(value) {
    const n = Math.max(0, Number(value) || 0);
    if (!Number.isFinite(n) || n < MIN_SANE_PROPERTY_VALUE) return 0;
    if (n > MAX_SANE_PROPERTY_VALUE) return MAX_SANE_PROPERTY_VALUE;
    return Math.round(n);
}

export function formatCreditFilterMessage(filter) {
    if (!filter?.maxPropertyPrice) return "";
    return `Mostrando propiedades hasta ${formatCOP(filter.maxPropertyPrice)}`;
}

export function buildWhatsAppCreditMessage(filter, session) {
    const max = filter?.maxPropertyPrice;
    const base = filter?.basePrice;
    const rate = session?.results?.annualRateEa;
    const lines = [
        "Hola Mónica, realicé una simulación de crédito hipotecario en tu página.",
        base ? `Valor de vivienda simulado: ${formatCOP(base)}.` : null,
        max ? `Busco propiedades hasta ${formatCOP(max)}.` : null,
        rate ? `Tasa referencial: ${(rate * 100).toFixed(2)}% EA.` : null,
        "¿Me puedes ayudar a encontrar opciones disponibles?",
    ].filter(Boolean);
    return lines.join(" ");
}

export function buildCreditSimulatorShareUrl(results, searchSelection = null) {
    const propertyValue = sanitizePropertyValue(results.propertyValue);
    if (!propertyValue) return buildPublicSiteUrl("/");

    const propertyType = VALID_TYPES.has(results.propertyType) ? results.propertyType : "NO_VIS";
    const annualRateEa = Number(results.annualRateEa) || 0;
    const monthlyPayment = Math.max(0, Number(results.totalMonthly || results.monthlyPayment) || 0);

    const url = new URL(buildPublicSiteUrl("/"));
    url.searchParams.set("simcredito", "1");
    url.searchParams.set("valor", String(propertyValue));
    url.searchParams.set("tasa", String(Number((annualRateEa * 100).toFixed(2))));
    if (monthlyPayment > 0) url.searchParams.set("cuota", String(Math.round(monthlyPayment)));
    url.searchParams.set("tipo", propertyType);
    url.searchParams.set("buscar", "1");

    if (searchSelection?.allZones) {
        url.searchParams.set("todas", "1");
    } else if (searchSelection?.groupKeys?.length) {
        url.searchParams.set("zonas", searchSelection.groupKeys.join(","));
    }

    return url.toString();
}

export function parseCreditSimulatorFromSearch(search = window.location.search) {
    const params = new URLSearchParams(search);
    if (params.get("simcredito") !== "1") return null;

    const propertyValue = sanitizePropertyValue(Number(params.get("valor")));
    if (!propertyValue) return null;

    const monthlyPayment = Number(params.get("cuota") || 0);
    const requiredIncome = Number(params.get("ingreso") || 0);
    const propertyType = params.get("tipo")?.toUpperCase() || "NO_VIS";
    const termYears = Number(params.get("plazo") || 15);
    const annualRatePct = Number(params.get("tasa") || 0);
    const mode = params.get("modo") || "by_property";
    const modality = params.get("modalidad")?.toUpperCase() || "PESOS";
    const loanAmount = Number(params.get("credito") || 0);

    if (!Number.isFinite(annualRatePct) || annualRatePct <= 0) return null;
    if (!VALID_TYPES.has(propertyType)) return null;

    const annualRateEa = annualRatePct / 100;
    const resolvedLoan = loanAmount > 0 && loanAmount <= propertyValue
        ? loanAmount
        : Math.round(propertyValue * 0.7);
    const loanPercent = propertyValue > 0 ? Math.round((resolvedLoan / propertyValue) * 100) : 70;
    const resolvedPayment = monthlyPayment > 0
        ? monthlyPayment
        : Math.round(requiredIncome > 0 ? requiredIncome * 0.3 : 0);
    const resolvedIncome = requiredIncome > 0
        ? requiredIncome
        : resolvedPayment > 0
            ? Math.round(resolvedPayment / 0.3)
            : 0;

    const results = {
        mode: VALID_MODES.has(mode) ? mode : "by_property",
        propertyValue,
        loanAmount: resolvedLoan,
        loanPercent,
        propertyType,
        modality: VALID_MODALITIES.has(modality) ? modality : "PESOS",
        termYears: Number.isFinite(termYears) && termYears > 0 ? termYears : 15,
        birthDate: null,
        annualRateEa,
        monthlyRate: Math.pow(1 + annualRateEa, 1 / 12) - 1,
        monthlyPayment: resolvedPayment,
        totalMonthly: resolvedPayment,
        lifeInsurance: 0,
        fireInsurance: 0,
        totalInterest: 0,
        months: (Number.isFinite(termYears) && termYears > 0 ? termYears : 15) * 12,
        downPayment: Math.max(0, propertyValue - resolvedLoan),
        requiredIncome: resolvedIncome,
    };

    const autoSearchPick = params.get("buscar") === "1";
    const showResults = params.get("resultados") === "1" && !autoSearchPick;

    let searchSelection = null;
    if (params.get("todas") === "1") {
        searchSelection = { allZones: true, groupKeys: ALL_CREDIT_SEARCH_KEYS };
    } else if (params.get("zonas")) {
        const groupKeys = params.get("zonas")
            .split(",")
            .map((z) => z.trim().toLowerCase())
            .filter(Boolean);
        if (groupKeys.length) searchSelection = { allZones: false, groupKeys };
    }

    return {
        showResults,
        autoSearchPick,
        searchSelection,
        results,
        filter: buildCreditBudgetFilter(results),
    };
}

export function buildCreditBudgetFilter(results) {
    const basePrice = sanitizePropertyValue(results?.propertyValue);
    if (!basePrice) return null;

    return {
        basePrice,
        minPropertyPrice: null,
        maxPropertyPrice: Math.round(basePrice * (1 + CREDIT_PRICE_BUFFER)),
        maxMonthlyPayment: Math.max(0, Number(results?.totalMonthly || results?.monthlyPayment) || 0),
        requiredIncome: Math.max(0, Number(results?.requiredIncome) || 0),
        priceBuffer: CREDIT_PRICE_BUFFER,
        annualRateEa: Number(results?.annualRateEa) || 0,
        mode: results?.mode || "by_property",
        propertyType: results?.propertyType || "NO_VIS",
    };
}

export function saveCreditSession({ results, filter, searchSelection }) {
    try {
        const safeResults = results
            ? { ...results, propertyValue: sanitizePropertyValue(results.propertyValue) }
            : null;
        sessionStorage.setItem(
            CREDIT_SESSION_KEY,
            JSON.stringify({
                results: safeResults,
                filter: safeResults ? buildCreditBudgetFilter(safeResults) : filter,
                searchSelection,
                savedAt: Date.now(),
            })
        );
    } catch {
        // ignore
    }
}

export function loadCreditSession() {
    try {
        const raw = sessionStorage.getItem(CREDIT_SESSION_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (data?.results?.propertyValue) {
            data.results.propertyValue = sanitizePropertyValue(data.results.propertyValue);
        }
        if (data?.results) {
            data.filter = buildCreditBudgetFilter(data.results) || data.filter;
        }
        return data;
    } catch {
        return null;
    }
}

export function getPropertyListPrice(item) {
    return Number(item?.salePrice) || parsePriceFromLabel(item?.priceLabel) || 0;
}

export function filterPropertiesByCreditBudget(properties, filter) {
    if (!filter?.maxPropertyPrice) return properties;

    const maxPrice = Number(filter.maxPropertyPrice);
    if (!Number.isFinite(maxPrice) || maxPrice <= 0) return properties;

    return properties.filter((item) => {
        const price = getPropertyListPrice(item);
        return price > 0 && price <= maxPrice;
    });
}

async function copyTextToClipboard(text) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (!copied) throw new Error("clipboard_unavailable");
}

export async function shareCreditSimulatorLink(url) {
    const shareData = {
        title: "Propiedades acordes a tu presupuesto — Mónica Fritz",
        text: "Te comparto una simulación de crédito. Encuentra propiedades en tu rango de precio.",
        url,
    };

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile && navigator.share) {
        try {
            if (!navigator.canShare || navigator.canShare(shareData)) {
                await navigator.share(shareData);
                return "shared";
            }
        } catch (err) {
            if (err?.name === "AbortError") throw err;
        }
    }

    await copyTextToClipboard(url);
    return "copied";
}
