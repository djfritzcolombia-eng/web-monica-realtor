export const SELL_CURRENCIES = {
    COP: {
        code: "COP",
        label: "Pesos (COP)",
        example: "$760.000.000",
    },
    USD: {
        code: "USD",
        label: "Dólares (USD)",
        example: "$420.000",
    },
};

function formatThousands(value) {
    const amount = Math.max(0, Math.round(Number(value) || 0));
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function parseSellCurrencyInput(raw) {
    if (!raw && raw !== 0) return 0;
    const digits = String(raw).replace(/[^\d]/g, "");
    return digits ? Number(digits) : 0;
}

export function formatSellCurrencyDisplay(amount, currency = "COP") {
    const formatted = formatThousands(amount);
    if (!formatted || formatted === "0") return "";
    return `$${formatted}`;
}

export function formatSellCurrencyInput(amount, currency = "COP") {
    return formatSellCurrencyDisplay(amount, currency);
}
