import { useMemo, useState } from "react";
import { formatCOP } from "../utils/housingCreditCalculator";
import {
    buildInitialCreditForm,
    DOC_TYPES,
    OCCUPATIONS,
    validateCreditForm,
} from "../utils/creditApplicationForm";
import { downloadCreditApplicationPdf } from "../utils/creditApplicationPdf";
import { submitCreditApplication } from "../services/creditApplicationService";
import styles from "./CreditApplicationForm.module.css";

export default function CreditApplicationForm({
    simulation,
    onBack,
    onSuccess,
}) {
    const [form, setForm] = useState(() => buildInitialCreditForm(simulation));
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(null);

    const simulationHint = useMemo(() => {
        if (!simulation) return null;
        return simulation.mode === "by_property"
            ? `Cuota estimada: ${formatCOP(simulation.totalMonthly)} · Ingreso sugerido: ${formatCOP(simulation.requiredIncome)}`
            : `Monto estimado: ${formatCOP(simulation.loanAmount)} · Vivienda hasta ${formatCOP(simulation.propertyValue)}`;
    }, [simulation]);

    const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

    const handleDownloadPreview = () => {
        const validation = validateCreditForm(form);
        if (validation) {
            setError(validation);
            return;
        }
        setError("");
        downloadCreditApplicationPdf({ form, simulation });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const validation = validateCreditForm(form);
        if (validation) {
            setError(validation);
            return;
        }

        setSubmitting(true);
        setError("");
        try {
            const result = await submitCreditApplication({ form, simulation });
            setSuccess(result);
            onSuccess?.(result);
        } catch (err) {
            setError(err?.message || "No se pudo enviar la solicitud.");
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className={styles.successBox}>
                <h2 className={styles.heading}>Consulta enviada</h2>
                <p>
                    Recibimos tu consulta de viabilidad de crédito. Mónica Fritz revisará tu información
                    y te contactará para orientarte sobre el trámite de financiación.
                </p>
                <p className={styles.hint}>Se envió un PDF al correo de la agencia con todos los datos del formulario.</p>
                {onBack && (
                    <button type="button" className={styles.primaryBtn} onClick={onBack}>
                        Volver al simulador
                    </button>
                )}
            </div>
        );
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <h1 className={styles.heading}>Consulta de viabilidad de crédito</h1>
            <p className={styles.lead}>
                Con tus datos básicos evaluamos tu perfil financiero antes de iniciar el trámite formal
                de crédito hipotecario. La simulación del simulador se incluye en el PDF.
            </p>
            {simulationHint && (
                <p className={styles.simHint}>{simulationHint}</p>
            )}

            <fieldset className={styles.fieldset}>
                <legend>1. Sobre ti</legend>
                <div className={styles.grid}>
                    <label className={`${styles.field} ${styles.fieldFull}`}>
                        <span>Nombre completo *</span>
                        <input required value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
                    </label>
                    <label className={styles.field}>
                        <span>Fecha de nacimiento *</span>
                        <input placeholder="dd/mm/aaaa" value={form.birthDate} onChange={(e) => update("birthDate", e.target.value)} />
                    </label>
                    <label className={styles.field}>
                        <span>Celular *</span>
                        <input required value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                    </label>
                    <label className={styles.field}>
                        <span>Tipo de documento *</span>
                        <select value={form.docType} onChange={(e) => update("docType", e.target.value)}>
                            {DOC_TYPES.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </label>
                    <label className={styles.field}>
                        <span>Número de documento *</span>
                        <input required value={form.docNumber} onChange={(e) => update("docNumber", e.target.value)} />
                    </label>
                    <label className={`${styles.field} ${styles.fieldFull}`}>
                        <span>Correo electrónico *</span>
                        <input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} />
                    </label>
                </div>
            </fieldset>

            <fieldset className={styles.fieldset}>
                <legend>2. Ocupación e ingresos</legend>
                <div className={styles.grid}>
                    <label className={styles.field}>
                        <span>Ocupación *</span>
                        <select value={form.occupation} onChange={(e) => update("occupation", e.target.value)}>
                            {OCCUPATIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </label>
                    <label className={styles.field}>
                        <span>Ingresos mensuales (COP) *</span>
                        <input type="number" min="1" required value={form.monthlyIncome} onChange={(e) => update("monthlyIncome", e.target.value)} />
                    </label>
                    <label className={styles.field}>
                        <span>Ingresos extra (COP)</span>
                        <input type="number" min="0" value={form.extraIncome} onChange={(e) => update("extraIncome", e.target.value)} />
                    </label>
                    <label className={styles.field}>
                        <span>¿Declaras renta?</span>
                        <select value={form.declaresTax} onChange={(e) => update("declaresTax", e.target.value)}>
                            <option value="Sí">Sí</option>
                            <option value="No">No</option>
                        </select>
                    </label>
                    <label className={styles.field}>
                        <span>Ciudad donde trabajas *</span>
                        <input required value={form.workCity} onChange={(e) => update("workCity", e.target.value)} />
                    </label>
                </div>
            </fieldset>

            <fieldset className={styles.fieldset}>
                <legend>3. Monto solicitado</legend>
                <div className={styles.grid}>
                    <label className={styles.field}>
                        <span>Monto a solicitar (COP) *</span>
                        <input type="number" min="1" required value={form.loanAmount} onChange={(e) => update("loanAmount", e.target.value)} />
                    </label>
                    <label className={styles.field}>
                        <span>Valor disponible cuota inicial (COP)</span>
                        <input type="number" min="0" value={form.downPayment} onChange={(e) => update("downPayment", e.target.value)} />
                    </label>
                </div>
            </fieldset>

            <fieldset className={styles.fieldset}>
                <legend>4. Autorizaciones</legend>
                <label className={styles.checkRow}>
                    <input
                        type="checkbox"
                        checked={form.authorizeCreditBureaus}
                        onChange={(e) => update("authorizeCreditBureaus", e.target.checked)}
                    />
                    <span>
                        Autorizo la consulta y reporte en centrales de riesgo (Datacrédito, CIFIN u otras)
                        para estudio de crédito hipotecario.
                    </span>
                </label>
                <label className={styles.checkRow}>
                    <input
                        type="checkbox"
                        checked={form.authorizeDataTreatment}
                        onChange={(e) => update("authorizeDataTreatment", e.target.checked)}
                    />
                    <span>
                        Autorizo el tratamiento de mis datos personales por Mónica Fritz Realtor
                        para gestión de la solicitud de crédito hipotecario.
                    </span>
                </label>
                <label className={styles.checkRow}>
                    <input
                        type="checkbox"
                        checked={form.declaresTruth}
                        onChange={(e) => update("declaresTruth", e.target.checked)}
                    />
                    <span>
                        Declaro que la información es veraz. Entiendo que documentos soporte
                        (cédula, certificados laborales, extractos) se solicitarán al radicar el crédito.
                    </span>
                </label>
                <label className={`${styles.field} ${styles.fieldFull}`}>
                    <span>Observaciones adicionales</span>
                    <textarea rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
                </label>
            </fieldset>

            {error && <p className={styles.error} role="alert">{error}</p>}

            <div className={styles.actions}>
                {onBack && (
                    <button type="button" className={styles.secondaryBtn} onClick={onBack}>
                        ← Volver
                    </button>
                )}
                <button type="button" className={styles.secondaryBtn} onClick={handleDownloadPreview}>
                    Vista previa PDF
                </button>
                <button type="submit" className={styles.primaryBtn} disabled={submitting}>
                    {submitting ? "Enviando consulta…" : "Enviar consulta a Mónica"}
                </button>
            </div>
        </form>
    );
}
