import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { MONICA_CREDIT_EMAIL } from "../config/site";
import { db } from "../config/firebase";
import { CREDIT_APP_STATUSES } from "../utils/creditApplicationForm";
import { buildCreditApplicationPdf } from "../utils/creditApplicationPdf";
import { formatCOP } from "../utils/housingCreditCalculator";

export async function submitCreditApplication({ form, simulation }) {
    const { blob, fileName, fullName } = buildCreditApplicationPdf({ form, simulation });

    const summaryLines = [
        `Consulta de viabilidad de crédito — ${fullName}`,
        `Documento: ${form.docType} ${form.docNumber}`,
        `Correo: ${form.email}`,
        `Celular: ${form.phone}`,
        `Ocupación: ${form.occupation}`,
        `Ciudad donde trabaja: ${form.workCity}`,
        `Ingresos mensuales: ${formatCOP(Number(form.monthlyIncome) || 0)}`,
        `Monto a solicitar: ${formatCOP(Number(form.loanAmount) || 0)}`,
        `Cuota inicial disponible: ${formatCOP(Number(form.downPayment) || 0)}`,
        simulation?.totalMonthly || simulation?.monthlyPayment
            ? `Simulación: cuota ref. ${formatCOP(simulation.totalMonthly || simulation.monthlyPayment)}`
            : null,
        "",
        "El PDF adjunto contiene el formulario completo con autorizaciones y resumen de simulación.",
    ].filter((line) => line !== null);

    const formData = new FormData();
    formData.append("_subject", `Consulta viabilidad crédito — ${fullName}`);
    formData.append("_template", "table");
    formData.append("_captcha", "false");
    formData.append("name", fullName);
    formData.append("email", form.email);
    formData.append("_replyto", form.email);
    formData.append("message", summaryLines.join("\n"));
    formData.append("attachment", blob, fileName);

    const emailResponse = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(MONICA_CREDIT_EMAIL)}`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
    });

    if (!emailResponse.ok) {
        throw new Error("No se pudo enviar el correo. Intenta de nuevo o descarga el PDF.");
    }

    const emailResult = await emailResponse.json().catch(() => ({}));
    if (emailResult.success === false) {
        throw new Error(emailResult.message || "El servicio de correo rechazó el envío.");
    }

    let firestoreId = null;
    try {
        const docRef = await addDoc(collection(db, "credit_applications"), {
            ...form,
            simulationSummary: simulation
                ? {
                    mode: simulation.mode,
                    propertyValue: simulation.propertyValue,
                    loanAmount: simulation.loanAmount,
                    loanPercent: simulation.loanPercent,
                    termYears: simulation.termYears,
                    modality: simulation.modality,
                    annualRateEa: simulation.annualRateEa,
                    totalMonthly: simulation.totalMonthly,
                    monthlyPayment: simulation.monthlyPayment,
                    requiredIncome: simulation.requiredIncome,
                    downPayment: simulation.downPayment,
                }
                : null,
            applicantName: fullName,
            adminStatus: CREDIT_APP_STATUSES.pending,
            adminNotes: "",
            pdfFileName: fileName,
            emailSentTo: MONICA_CREDIT_EMAIL,
            createdAt: serverTimestamp(),
        });
        firestoreId = docRef.id;
    } catch {
        // El correo ya salió; el respaldo en Firestore es opcional.
    }

    return { fileName, firestoreId };
}
