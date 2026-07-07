import { jsPDF } from "jspdf";
import { formatCOP, formatPercent } from "./housingCreditCalculator";
import { getApplicantFullName } from "./creditApplicationForm";

const BRAND = "Mónica Fritz Realtor";
const FORM_TITLE = "Consulta de viabilidad de crédito hipotecario";

function line(doc, y, text, opts = {}) {
    const { size = 10, bold = false, indent = 14 } = opts;
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.text(text, indent, y);
    return y + (size * 0.45) + 4;
}

function sectionTitle(doc, y, title) {
    doc.setFillColor(58, 51, 44);
    doc.rect(14, y - 5, 182, 8, "F");
    doc.setTextColor(255, 255, 255);
    y = line(doc, y + 1, title, { size: 9, bold: true, indent: 16 });
    doc.setTextColor(58, 51, 44);
    return y + 4;
}

function fieldRow(doc, y, label, value) {
    if (y > 270) {
        doc.addPage();
        y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`${label}:`, 14, y);
    doc.setFont("helvetica", "normal");
    const wrapped = doc.splitTextToSize(String(value || "—"), 115);
    doc.text(wrapped, 72, y);
    return y + Math.max(5, wrapped.length * 4.5) + 2;
}

function buildSimulationBlock(results) {
    if (!results) return [];
    const isByProperty = results.mode === "by_property";
    return [
        ["Modo de simulación", isByProperty ? "Según valor de vivienda" : "Según cuota mensual"],
        ["Tipo vivienda", results.propertyType === "VIS" ? "VIS" : "No VIS"],
        ["Modalidad", results.modality === "UVR" ? "UVR" : "Pesos"],
        ["Valor comercial vivienda", formatCOP(results.propertyValue)],
        ["Monto del crédito", formatCOP(results.loanAmount)],
        ["Porcentaje financiación", `${results.loanPercent}%`],
        ["Cuota inicial estimada", formatCOP(results.downPayment)],
        ["Plazo", `${results.termYears} años`],
        ["Tasa referencial", `${formatPercent(results.annualRateEa * 100)} EA`],
        ["Cuota mensual estimada (crédito + seguros)", formatCOP(results.totalMonthly || results.monthlyPayment)],
        ["Ingreso mensual sugerido", formatCOP(results.requiredIncome)],
    ];
}

function isLegacyForm(form) {
    return !form.fullName && (form.primerNombre || form.primerApellido);
}

function renderLegacyApplicantSection(doc, y, form, fullName) {
    y = sectionTitle(doc, y, "1. DATOS DEL SOLICITANTE");
    y = fieldRow(doc, y, "Nombres y apellidos", fullName);
    y = fieldRow(doc, y, "Tipo documento", form.docType);
    y = fieldRow(doc, y, "Número documento", form.docNumber);
    y = fieldRow(doc, y, "Fecha nacimiento", form.birthDate);
    y = fieldRow(doc, y, "Estado civil", form.maritalStatus);
    y = fieldRow(doc, y, "Personas a cargo", form.dependents);
    y = fieldRow(doc, y, "Correo electrónico", form.email);
    y = fieldRow(doc, y, "Celular", form.phone);
    y = fieldRow(doc, y, "Dirección residencia", `${form.addressResidence || ""}, ${form.cityResidence || ""}`.trim());
    y = fieldRow(doc, y, "Estrato", form.stratum);
    return y;
}

function renderLegacyFinancialSection(doc, y, form) {
    y = sectionTitle(doc, y, "2. OCUPACIÓN E INFORMACIÓN FINANCIERA");
    y = fieldRow(doc, y, "Ocupación", form.occupation);
    y = fieldRow(doc, y, "Empresa / actividad", form.companyName);
    y = fieldRow(doc, y, "Cargo", form.jobTitle);
    y = fieldRow(doc, y, "Tipo de contrato", form.contractType);
    y = fieldRow(doc, y, "Fecha vinculación", form.startDate);
    y = fieldRow(doc, y, "Ingresos fijos mensuales", formatCOP(Number(form.monthlyFixedIncome) || 0));
    y = fieldRow(doc, y, "Otros ingresos", formatCOP(Number(form.otherIncome) || 0));
    y = fieldRow(doc, y, "Gastos familiares", formatCOP(Number(form.monthlyExpenses) || 0));
    y = fieldRow(doc, y, "Arriendo actual", formatCOP(Number(form.rentExpense) || 0));
    y = fieldRow(doc, y, "Declara renta", form.declaresTax);
    return y;
}

function renderLegacyLoanSection(doc, y, form) {
    y = sectionTitle(doc, y, "3. INMUEBLE Y PRÉSTAMO SOLICITADO");
    y = fieldRow(doc, y, "Producto", form.creditProduct);
    y = fieldRow(doc, y, "¿Ya eligió inmueble?", form.propertyChosen);
    y = fieldRow(doc, y, "Tipo inmueble", form.propertyKind);
    y = fieldRow(doc, y, "Estado inmueble", form.propertyState);
    y = fieldRow(doc, y, "Ciudad de interés", form.propertyCity);
    y = fieldRow(doc, y, "Dirección / barrio", form.propertyAddress);
    y = fieldRow(doc, y, "Valor del inmueble", formatCOP(Number(form.propertyValue) || 0));
    y = fieldRow(doc, y, "Monto del crédito", formatCOP(Number(form.loanAmount) || 0));
    y = fieldRow(doc, y, "Cuota inicial", formatCOP(Number(form.downPayment) || 0));
    y = fieldRow(doc, y, "Plazo solicitado", `${form.termYears} años`);
    y = fieldRow(doc, y, "Plan de pagos", form.paymentPlan);
    y = fieldRow(doc, y, "Subsidio", form.subsidy);
    return y;
}

export function buildCreditApplicationPdf({ form, simulation, submittedAt: submittedAtOverride }) {
    const doc = new jsPDF({ unit: "mm", format: "letter" });
    const submittedAt = submittedAtOverride || new Date().toLocaleString("es-CO");
    const fullName = getApplicantFullName(form);
    const legacy = isLegacyForm(form);

    let y = 18;
    doc.setTextColor(58, 51, 44);
    y = line(doc, y, BRAND, { size: 11, bold: true, indent: 14 });
    y = line(doc, y, FORM_TITLE, { size: 13, bold: true, indent: 14 });
    y = line(doc, y, `Radicado: ${submittedAt}`, { size: 8, indent: 14 });
    y += 4;

    if (legacy) {
        y = renderLegacyApplicantSection(doc, y, form, fullName);
        y = renderLegacyFinancialSection(doc, y, form);
        y = renderLegacyLoanSection(doc, y, form);
    } else {
        y = sectionTitle(doc, y, "1. SOBRE EL SOLICITANTE");
        y = fieldRow(doc, y, "Nombre completo", fullName);
        y = fieldRow(doc, y, "Fecha de nacimiento", form.birthDate);
        y = fieldRow(doc, y, "Celular", form.phone);
        y = fieldRow(doc, y, "Tipo documento", form.docType);
        y = fieldRow(doc, y, "Número documento", form.docNumber);
        y = fieldRow(doc, y, "Correo electrónico", form.email);

        y = sectionTitle(doc, y, "2. OCUPACIÓN E INGRESOS");
        y = fieldRow(doc, y, "Ocupación", form.occupation);
        y = fieldRow(doc, y, "Ingresos mensuales", formatCOP(Number(form.monthlyIncome) || 0));
        y = fieldRow(doc, y, "Ingresos extra", formatCOP(Number(form.extraIncome) || 0));
        y = fieldRow(doc, y, "Declara renta", form.declaresTax);
        y = fieldRow(doc, y, "Ciudad donde trabajas", form.workCity);

        y = sectionTitle(doc, y, "3. MONTO SOLICITADO");
        y = fieldRow(doc, y, "Monto a solicitar", formatCOP(Number(form.loanAmount) || 0));
        y = fieldRow(doc, y, "Cuota inicial disponible", formatCOP(Number(form.downPayment) || 0));
    }

    if (simulation) {
        y = sectionTitle(doc, y, `${legacy ? "4" : "4"}. RESUMEN DE SIMULACIÓN (MÓNICA FRITZ REALTOR)`);
        for (const [label, value] of buildSimulationBlock(simulation)) {
            y = fieldRow(doc, y, label, value);
        }
    }

    if (y > 230) {
        doc.addPage();
        y = 20;
    }

    y = sectionTitle(doc, y, `${legacy ? "5" : simulation ? "5" : "4"}. AUTORIZACIONES Y DECLARACIONES`);
    y = fieldRow(doc, y, "Centrales de riesgo", form.authorizeCreditBureaus ? "Autorizado" : "No autorizado");
    y = fieldRow(doc, y, "Tratamiento de datos", form.authorizeDataTreatment ? "Autorizado" : "No autorizado");
    y = fieldRow(doc, y, "Veracidad de la información", form.declaresTruth ? "Declara bajo gravedad de juramento" : "—");
    if (form.notes) {
        y = fieldRow(doc, y, "Observaciones", form.notes);
    }

    y += 6;
    doc.setFontSize(8);
    doc.setTextColor(110, 98, 89);
    const disclaimer = doc.splitTextToSize(
        "Documento generado desde monicafritzrealtor.com. Esta consulta es un formato de recolección de información "
        + "para evaluar viabilidad y gestionar el trámite de crédito hipotecario. No constituye aprobación de crédito. "
        + "La firma física y documentación soporte se solicitará en etapa de radicación del crédito.",
        180
    );
    doc.text(disclaimer, 14, y);

    const fileName = `consulta-viabilidad-credito-${form.docNumber || "hipotecario"}-${Date.now()}.pdf`;
    return { doc, fileName, blob: doc.output("blob"), fullName };
}

export function downloadCreditApplicationPdf(payload) {
    const { doc, fileName } = buildCreditApplicationPdf(payload);
    doc.save(fileName);
}
