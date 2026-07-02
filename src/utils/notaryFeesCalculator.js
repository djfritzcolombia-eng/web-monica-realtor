const formatCOP = (value) =>
    new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(value);

function calcNotarySaleFee(value) {
    if (value <= 50_000_000) return 250_000;
    if (value <= 100_000_000) return 320_000;
    if (value <= 200_000_000) return 400_000;
    if (value <= 500_000_000) return 650_000;
    return Math.round(value * 0.0013);
}

function calcMortgageNotaryFee(mortgage) {
    if (mortgage <= 0) return 0;
    if (mortgage <= 50_000_000) return Math.round(mortgage * 0.0045);
    if (mortgage <= 100_000_000) return Math.round(mortgage * 0.004165);
    return Math.round(mortgage * 0.0038);
}

export function parseCurrencyInput(raw) {
    if (!raw && raw !== 0) return 0;
    const digits = String(raw).replace(/\D/g, "");
    return digits ? Number(digits) : 0;
}

export function formatCurrencyInput(value) {
    if (!value) return "";
    return formatCOP(value).replace(/\s/g, " ");
}

export function calculateNotaryFees({ propertyValue, mortgageBalance, propertyType = "NO_VIS" }) {
    const value = Math.max(0, Number(propertyValue) || 0);
    const mortgage = Math.max(0, Math.min(Number(mortgageBalance) || 0, value));
    const isVis = propertyType === "VIS";

    const notarySaleFee = calcNotarySaleFee(value);
    const iva = Math.round(notarySaleFee * 0.19);
    const papeleria = 175_000;

    const buyerItems = [
        { label: "Gastos notariales compraventa", amount: notarySaleFee },
        { label: "IVA de 19%", amount: iva },
        { label: "Papelería (folios, copias, etc.)", amount: papeleria },
    ];

    if (mortgage > 0) {
        buyerItems.push(
            { label: "Constitución de hipoteca", amount: calcMortgageNotaryFee(mortgage) },
        );
    }

    const beneficencia = isVis || value <= 117_000_000 ? 0 : Math.round(value * 0.01);
    if (beneficencia > 0) {
        buyerItems.push({ label: "Impuesto beneficencia", amount: beneficencia });
    }

    const registroCompra = Math.round(value * 0.00829);
    buyerItems.push({ label: "Registro de compra", amount: registroCompra });
    buyerItems.push({ label: "Conservación documental registro", amount: Math.round(registroCompra * 0.02) });

    if (mortgage > 0) {
        const registroHipoteca = Math.round(mortgage * 0.01);
        buyerItems.push({ label: "Registro de hipoteca", amount: registroHipoteca });
        buyerItems.push({ label: "Conservación documental hipoteca", amount: Math.round(registroHipoteca * 0.02) });
    }

    buyerItems.push(
        { label: "Boleta fiscal", amount: Math.round(value * 0.000127) },
        { label: "Certificado tradición y libertad", amount: 23_000 },
    );

    const sellerItems = [
        { label: "Gastos notariales compraventa", amount: notarySaleFee },
    ];

    const retencion = isVis ? 0 : Math.round(value * 0.01);
    if (retencion > 0) {
        sellerItems.push({ label: "Retención en la Fuente", amount: retencion });
    }

    sellerItems.push(
        { label: "IVA de 19%", amount: iva },
        { label: "Papelería (folios, copias, etc.)", amount: papeleria },
    );

    const buyerTotal = buyerItems.reduce((sum, item) => sum + item.amount, 0);
    const sellerTotal = sellerItems.reduce((sum, item) => sum + item.amount, 0);

    return {
        propertyValue: value,
        mortgageBalance: mortgage,
        propertyType,
        buyer: { items: buyerItems, total: buyerTotal },
        seller: { items: sellerItems, total: sellerTotal },
    };
}

export { formatCOP };
