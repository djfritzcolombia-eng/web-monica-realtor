export const DOC_TYPES = ["Cédula de ciudadanía", "Cédula de extranjería", "Pasaporte"];

export const OCCUPATIONS = ["Asalariado", "Pensionado", "Independiente"];

export const CREDIT_APP_STATUSES = {
    pending: "pending",
    in_review: "in_review",
    closed: "closed",
};

export const CREDIT_APP_STATUS_LABELS = {
    [CREDIT_APP_STATUSES.pending]: "Pendiente",
    [CREDIT_APP_STATUSES.in_review]: "En seguimiento",
    [CREDIT_APP_STATUSES.closed]: "Cerrada",
};

export function getApplicantFullName(form = {}) {
    if (form.fullName?.trim()) return form.fullName.trim();
    return [
        form.primerNombre,
        form.segundoNombre,
        form.primerApellido,
        form.segundoApellido,
    ].filter(Boolean).join(" ").trim();
}

export function buildInitialCreditForm(simulation) {
    const base = {
        fullName: "",
        birthDate: "",
        phone: "",
        docType: "Cédula de ciudadanía",
        docNumber: "",
        email: "",
        occupation: "Asalariado",
        monthlyIncome: "",
        extraIncome: "",
        declaresTax: "No",
        workCity: "",
        loanAmount: "",
        downPayment: "",
        authorizeCreditBureaus: false,
        authorizeDataTreatment: false,
        declaresTruth: false,
        notes: "",
    };

    if (!simulation) return base;

    return {
        ...base,
        loanAmount: simulation.loanAmount ? String(simulation.loanAmount) : "",
        downPayment: simulation.downPayment ? String(simulation.downPayment) : "",
        monthlyIncome: simulation.requiredIncome
            ? String(Math.round(simulation.requiredIncome))
            : "",
    };
}

export function validateCreditForm(form) {
    if (!getApplicantFullName(form)) {
        return "Ingresa tu nombre completo.";
    }
    if (!form.docNumber?.trim()) return "Ingresa tu número de documento.";
    if (!form.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        return "Ingresa un correo electrónico válido.";
    }
    if (!form.phone?.trim() || form.phone.replace(/\D/g, "").length < 10) {
        return "Ingresa un celular válido (mínimo 10 dígitos).";
    }
    if (!form.birthDate?.trim()) return "Ingresa tu fecha de nacimiento.";
    if (!form.workCity?.trim()) return "Indica la ciudad donde trabajas.";
    if (!form.monthlyIncome || Number(form.monthlyIncome) <= 0) {
        return "Indica tus ingresos mensuales.";
    }
    if (!form.loanAmount || Number(form.loanAmount) <= 0) {
        return "Indica el monto que deseas solicitar.";
    }
    if (!form.authorizeCreditBureaus || !form.authorizeDataTreatment || !form.declaresTruth) {
        return "Debes aceptar las autorizaciones y declaraciones para continuar.";
    }
    return "";
}

export function formatCreditApplicationDate(value) {
    if (!value) return "—";
    if (typeof value?.toDate === "function") {
        return value.toDate().toLocaleString("es-CO");
    }
    return String(value);
}
