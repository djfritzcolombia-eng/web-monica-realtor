import { formatCOP, parseCurrencyInput, formatCurrencyInput } from "./notaryFeesCalculator";

export { formatCOP, parseCurrencyInput, formatCurrencyInput };

/** Tasa efectiva anual referencial para crédito de vivienda en pesos. */
export const DEFAULT_ANNUAL_RATE_EA = 0.1615;

export const LOAN_PERCENT_OPTIONS = [
    { label: "70%", value: 70, maxFor: "NO_VIS" },
    { label: "80%", value: 80, maxFor: "VIS" },
    { label: "Otro", value: "custom" },
];

export const TERM_LIMITS = {
    PESOS: { min: 5, max: 20 },
    UVR: { min: 5, max: 30 },
};

const MIN_AGE = 18;
const MAX_AGE = 75;
const INCOME_RATIO = 0.30;

export function eaToMonthlyRate(ea) {
    return Math.pow(1 + ea, 1 / 12) - 1;
}

export function getMaxLoanPercent(propertyType = "NO_VIS") {
    return propertyType === "VIS" ? 80 : 70;
}

export function calcLoanFromProperty(propertyValue, percent) {
    const value = Math.max(0, Number(propertyValue) || 0);
    const pct = Math.max(0, Math.min(100, Number(percent) || 0));
    return Math.round(value * (pct / 100));
}

export function calcAgeFromBirthDate(birthDate) {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age -= 1;
    }
    return age;
}

export function validateBirthDate(birthDate, rawInput = "") {
    if (!birthDate && rawInput.trim()) {
        return "Usa el formato dd/mm/aaaa. Ejemplo: 08/03/1987.";
    }
    const age = calcAgeFromBirthDate(birthDate);
    if (age == null) return "Ingresa una fecha de nacimiento válida.";
    if (age < MIN_AGE || age > MAX_AGE) {
        return `Te prestamos si tu edad está entre los ${MIN_AGE} y los ${MAX_AGE} años.`;
    }
    return null;
}

export function validateAnnualRate(annualRateEa) {
    if (!Number.isFinite(annualRateEa) || annualRateEa <= 0) {
        return "Ingresa una tasa de interés válida (% EA).";
    }
    if (annualRateEa > 0.5) {
        return "La tasa parece muy alta. Verifica el valor en % EA.";
    }
    return null;
}

export function validateTermYears(termYears, modality = "PESOS") {
    const term = Number(termYears);
    const limits = TERM_LIMITS[modality] || TERM_LIMITS.PESOS;
    if (!Number.isFinite(term) || term < limits.min || term > limits.max) {
        return `El plazo debe estar entre ${limits.min} y ${limits.max} años (${modality === "UVR" ? "UVR" : "pesos"}).`;
    }
    return null;
}

export function collectSimulationErrors({
    birthDate,
    birthDateRaw = "",
    termYears,
    modality = "PESOS",
    annualRateEa,
    extraChecks = [],
}) {
    const errors = [];
    const termError = validateTermYears(termYears, modality);
    if (termError) errors.push(termError);
    const birthError = validateBirthDate(birthDate, birthDateRaw);
    if (birthError) errors.push(birthError);
    const rateError = validateAnnualRate(annualRateEa);
    if (rateError) errors.push(rateError);
    for (const check of extraChecks) {
        if (check) errors.push(check);
    }
    return errors;
}

/** Cuota fija (sistema francés). */
export function calcMonthlyPayment(principal, annualRateEa, termYears) {
    const amount = Math.max(0, Number(principal) || 0);
    const months = Math.max(1, Math.round(Number(termYears) || 0) * 12);
    if (amount <= 0) return 0;

    const monthlyRate = eaToMonthlyRate(annualRateEa);
    if (monthlyRate === 0) return Math.round(amount / months);

    const factor = Math.pow(1 + monthlyRate, months);
    return Math.round((amount * monthlyRate * factor) / (factor - 1));
}

/** Monto máximo prestable dado una cuota mensual. */
export function calcMaxLoanFromPayment(monthlyPayment, annualRateEa, termYears) {
    const payment = Math.max(0, Number(monthlyPayment) || 0);
    const months = Math.max(1, Math.round(Number(termYears) || 0) * 12);
    if (payment <= 0) return 0;

    const monthlyRate = eaToMonthlyRate(annualRateEa);
    if (monthlyRate === 0) return Math.round(payment * months);

    const factor = Math.pow(1 + monthlyRate, months);
    return Math.round((payment * (factor - 1)) / (monthlyRate * factor));
}

function calcLifeInsuranceMonthly(balance) {
    return Math.round(Math.max(0, balance) * 0.00058);
}

function calcFireInsuranceMonthly(propertyValue) {
    return Math.round(Math.max(0, propertyValue) * 0.00025 / 12);
}

function buildAmortizationSummary(principal, annualRateEa, termYears) {
    const months = Math.max(1, Math.round(Number(termYears) || 0) * 12);
    const monthlyRate = eaToMonthlyRate(annualRateEa);
    const monthlyPayment = calcMonthlyPayment(principal, annualRateEa, termYears);
    let balance = principal;
    let totalInterest = 0;

    for (let i = 0; i < months; i += 1) {
        const interest = Math.round(balance * monthlyRate);
        const capital = Math.max(0, monthlyPayment - interest);
        totalInterest += interest;
        balance = Math.max(0, balance - capital);
    }

    return { monthlyPayment, totalInterest, months };
}

export function simulateByPropertyValue({
    propertyValue,
    loanAmount,
    loanPercent,
    propertyType = "NO_VIS",
    modality = "PESOS",
    termYears,
    birthDate,
    birthDateRaw = "",
    annualRateEa = DEFAULT_ANNUAL_RATE_EA,
}) {
    const value = Math.max(0, Number(propertyValue) || 0);
    const maxPercent = getMaxLoanPercent(propertyType);
    const loan = Math.max(0, Math.min(Number(loanAmount) || 0, value));
    const percent = value > 0 ? Math.round((loan / value) * 100) : Number(loanPercent) || 0;

    const errors = collectSimulationErrors({
        birthDate,
        birthDateRaw,
        termYears,
        modality,
        annualRateEa,
        extraChecks: [
            value <= 0 ? "Ingresa el valor comercial de la vivienda." : null,
            loan <= 0 ? "Ingresa el monto del crédito que necesitas." : null,
            percent > maxPercent
                ? `Para vivienda ${propertyType === "VIS" ? "VIS" : "No VIS"} el financiamiento máximo es del ${maxPercent}%.`
                : null,
        ],
    });
    if (errors.length) return { error: errors[0], errors };

    const { monthlyPayment, totalInterest, months } = buildAmortizationSummary(loan, annualRateEa, termYears);
    const lifeInsurance = calcLifeInsuranceMonthly(loan);
    const fireInsurance = calcFireInsuranceMonthly(value);
    const totalMonthly = monthlyPayment + lifeInsurance + fireInsurance;
    const downPayment = value - loan;
    const requiredIncome = Math.round(totalMonthly / INCOME_RATIO);

    return {
        mode: "by_property",
        propertyValue: value,
        loanAmount: loan,
        loanPercent: percent,
        propertyType,
        modality,
        termYears: Number(termYears),
        birthDate,
        annualRateEa,
        monthlyRate: eaToMonthlyRate(annualRateEa),
        monthlyPayment,
        lifeInsurance,
        fireInsurance,
        totalMonthly,
        totalInterest,
        months,
        downPayment,
        requiredIncome,
    };
}

export function simulateByMonthlyPayment({
    monthlyPayment,
    propertyType = "NO_VIS",
    modality = "PESOS",
    termYears,
    birthDate,
    birthDateRaw = "",
    annualRateEa = DEFAULT_ANNUAL_RATE_EA,
}) {
    const payment = Math.max(0, Number(monthlyPayment) || 0);

    const errors = collectSimulationErrors({
        birthDate,
        birthDateRaw,
        termYears,
        modality,
        annualRateEa,
        extraChecks: [
            payment <= 0 ? "Ingresa la cuota mensual que puedes pagar." : null,
        ],
    });
    if (errors.length) return { error: errors[0], errors };

    const maxPercent = getMaxLoanPercent(propertyType);
    const loanAmount = calcMaxLoanFromPayment(payment, annualRateEa, termYears);
    const propertyValue = Math.round(loanAmount / (maxPercent / 100));
    const downPayment = Math.max(0, propertyValue - loanAmount);

    const lifeInsurance = calcLifeInsuranceMonthly(loanAmount);
    const fireInsurance = calcFireInsuranceMonthly(propertyValue);
    const creditOnly = Math.max(0, payment - lifeInsurance - fireInsurance);
    const { totalInterest, months } = buildAmortizationSummary(loanAmount, annualRateEa, termYears);

    return {
        mode: "by_payment",
        monthlyPayment: payment,
        propertyType,
        modality,
        termYears: Number(termYears),
        birthDate,
        annualRateEa,
        monthlyRate: eaToMonthlyRate(annualRateEa),
        loanAmount,
        propertyValue,
        loanPercent: maxPercent,
        lifeInsurance,
        fireInsurance,
        creditOnly,
        totalInterest,
        months,
        downPayment,
        requiredIncome: Math.round(payment / INCOME_RATIO),
    };
}

export function formatPercent(value) {
    return `${Number(value).toFixed(2)}%`;
}

export function parseAnnualRateInput(raw, fallback = DEFAULT_ANNUAL_RATE_EA) {
    if (raw == null || raw === "") return fallback;
    const normalized = String(raw).replace(",", ".").replace(/[^\d.]/g, "");
    const pct = Number(normalized);
    if (!Number.isFinite(pct) || pct <= 0) return null;
    return pct / 100;
}

export function formatAnnualRateInput(rateEa) {
    if (!Number.isFinite(rateEa) || rateEa <= 0) return "";
    return String(Number((rateEa * 100).toFixed(2))).replace(".", ",");
}

function isValidCalendarDate(dd, mm, yyyy) {
    const date = new Date(`${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}T12:00:00`);
    if (Number.isNaN(date.getTime())) return false;
    return date.getUTCFullYear() === Number(yyyy)
        && date.getUTCMonth() + 1 === Number(mm)
        && date.getUTCDate() === Number(dd);
}

function toIsoDate(dd, mm, yyyy) {
    return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

export function parseBirthDateInput(raw) {
    const trimmed = String(raw ?? "").trim();
    if (!trimmed) return null;

    // Valor nativo del input type="date"
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        const [, yyyy, mm, dd] = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/) || [];
        return isValidCalendarDate(Number(dd), Number(mm), Number(yyyy)) ? trimmed : null;
    }

    const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) return null;

    let dd = Number(match[1]);
    let mm = Number(match[2]);
    const yyyy = Number(match[3]);

    // Si el "mes" supera 12, probablemente ingresaron MM/DD (p. ej. 04/20/1992).
    if (mm > 12 && dd <= 12) {
        [dd, mm] = [mm, dd];
    }

    if (dd < 1 || dd > 31 || mm < 1 || mm > 12) return null;
    if (!isValidCalendarDate(dd, mm, yyyy)) return null;
    return toIsoDate(dd, mm, yyyy);
}

export function formatBirthDateForDisplay(isoDate) {
    if (!isoDate) return "";
    const match = String(isoDate).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return isoDate;
    const [, yyyy, mm, dd] = match;
    return `${dd}/${mm}/${yyyy}`;
}

export function formatBirthDateInput(value) {
    const digits = String(value).replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}
