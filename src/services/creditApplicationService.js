import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { MONICA_CREDIT_EMAIL } from "../config/site";
import { db } from "../config/firebase";
import { buildCreditApplicationPdf } from "../utils/creditApplicationPdf";

export async function submitCreditApplication({ form, simulation }) {
    const { blob, fileName, fullName } = buildCreditApplicationPdf({ form, simulation });

    const summaryLines = [
        `Solicitante: ${fullName}`,
        `Documento: ${form.docType} ${form.docNumber}`,
        `Correo: ${form.email}`,
        `Celular: ${form.phone}`,
        `Producto: ${form.creditProduct}`,
        `Valor inmueble: ${form.propertyValue}`,
        `Monto crédito: ${form.loanAmount}`,
        `Plazo: ${form.termYears} años`,
        simulation?.propertyValue
            ? `Simulación: cuota ref. ${simulation.totalMonthly || simulation.monthlyPayment}`
            : null,
    ].filter(Boolean);

    const formData = new FormData();
    formData.append("_subject", `Solicitud crédito hipotecario — ${fullName}`);
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
                    requiredIncome: simulation.requiredIncome,
                }
                : null,
            applicantName: fullName,
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
