import { useMemo, useState } from "react";
import { formatCOP } from "../utils/housingCreditCalculator";
import { downloadCreditApplicationPdf } from "../utils/creditApplicationPdf";
import { submitCreditApplication } from "../services/creditApplicationService";
import styles from "./CreditApplicationForm.module.css";

const DOC_TYPES = ["Cédula de ciudadanía", "Cédula de extranjería", "Pasaporte"];
const MARITAL = ["Soltero(a)", "Casado(a)", "Unión libre", "Separado(a)", "Viudo(a)"];
const OCCUPATIONS = [
    "Empleado",
    "Independiente",
    "Pensionado",
    "Comerciante",
    "Profesional independiente",
    "Rentista de capital",
    "Otro",
];
const CONTRACT_TYPES = ["Término indefinido", "Término fijo", "Prestación de servicios", "Otro"];
const CREDIT_PRODUCTS = [
    "Crédito adquisición de vivienda",
    "Crédito remodelación de vivienda",
    "Crédito compra de cartera vivienda",
    "Leasing habitacional",
];
const PROPERTY_KINDS = ["Apartamento", "Casa", "Apartaestudio", "Lote", "Otro"];
const PAYMENT_PLANS = [
    "Cuota constante en pesos",
    "Cuota constante en UVR",
    "Capital constante en UVR",
];
const SUBSIDY_OPTIONS = ["Sin subsidio", "Mi Casa Ya", "Otro subsidio"];

function buildInitialForm(simulation) {
    const base = {
        primerNombre: "",
        segundoNombre: "",
        primerApellido: "",
        segundoApellido: "",
        docType: "Cédula de ciudadanía",
        docNumber: "",
        birthDate: "",
        maritalStatus: "Soltero(a)",
        dependents: "0",
        email: "",
        phone: "",
        addressResidence: "",
        cityResidence: "",
        stratum: "",
        occupation: "Empleado",
        companyName: "",
        jobTitle: "",
        contractType: "Término indefinido",
        startDate: "",
        monthlyFixedIncome: "",
        otherIncome: "",
        monthlyExpenses: "",
        rentExpense: "",
        declaresTax: "No",
        creditProduct: "Crédito adquisición de vivienda",
        propertyChosen: "No",
        propertyKind: "Apartamento",
        propertyState: "Usado",
        propertyCity: "",
        propertyAddress: "",
        propertyValue: "",
        loanAmount: "",
        downPayment: "",
        termYears: "15",
        paymentPlan: "Cuota constante en pesos",
        preferredBank: "",
        subsidy: "Sin subsidio",
        authorizeCreditBureaus: false,
        authorizeDataTreatment: false,
        declaresTruth: false,
        notes: "",
    };

    if (!simulation) return base;

    return {
        ...base,
        propertyValue: simulation.propertyValue ? String(simulation.propertyValue) : "",
        loanAmount: simulation.loanAmount ? String(simulation.loanAmount) : "",
        downPayment: simulation.downPayment ? String(simulation.downPayment) : "",
        termYears: simulation.termYears ? String(simulation.termYears) : "15",
        paymentPlan: simulation.modality === "UVR"
            ? "Cuota constante en UVR"
            : "Cuota constante en pesos",
        propertyKind: simulation.propertyType === "VIS" ? "Apartamento" : "Apartamento",
        monthlyFixedIncome: simulation.requiredIncome
            ? String(Math.round(simulation.requiredIncome))
            : "",
    };
}

function validateForm(form) {
    if (!form.primerNombre.trim() || !form.primerApellido.trim()) {
        return "Ingresa tu nombre y apellido.";
    }
    if (!form.docNumber.trim()) return "Ingresa tu número de documento.";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        return "Ingresa un correo electrónico válido.";
    }
    if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 10) {
        return "Ingresa un celular válido (mínimo 10 dígitos).";
    }
    if (!form.birthDate.trim()) return "Ingresa tu fecha de nacimiento.";
    if (!form.addressResidence.trim() || !form.cityResidence.trim()) {
        return "Ingresa tu dirección y ciudad de residencia.";
    }
    if (!form.companyName.trim() && form.occupation === "Empleado") {
        return "Indica el nombre de la empresa donde trabajas.";
    }
    if (!form.monthlyFixedIncome || Number(form.monthlyFixedIncome) <= 0) {
        return "Indica tus ingresos fijos mensuales.";
    }
    if (!form.propertyCity.trim()) return "Indica la ciudad del inmueble.";
    if (!form.propertyValue || Number(form.propertyValue) <= 0) {
        return "Indica el valor del inmueble.";
    }
    if (!form.loanAmount || Number(form.loanAmount) <= 0) {
        return "Indica el monto del crédito solicitado.";
    }
    if (!form.authorizeCreditBureaus || !form.authorizeDataTreatment || !form.declaresTruth) {
        return "Debes aceptar las autorizaciones y declaraciones para continuar.";
    }
    return "";
}

export default function CreditApplicationForm({
    simulation,
    onBack,
    onSuccess,
}) {
    const [form, setForm] = useState(() => buildInitialForm(simulation));
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
        const validation = validateForm(form);
        if (validation) {
            setError(validation);
            return;
        }
        setError("");
        downloadCreditApplicationPdf({ form, simulation });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const validation = validateForm(form);
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
                <h2 className={styles.heading}>Solicitud enviada</h2>
                <p>
                    Recibimos tu solicitud de crédito hipotecario. Mónica Fritz revisará tu información
                    y te contactará para adelantar el trámite con la entidad financiera.
                </p>
                <p className={styles.hint}>Se envió un PDF al correo de la agencia con todos los datos.</p>
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
            <h1 className={styles.heading}>Solicitud de crédito hipotecario</h1>
            <p className={styles.lead}>
                Formato basado en solicitudes estándar de financiación de vivienda en Colombia
                (Bancolombia F-3112, FNA y sector bancario). Los datos de tu simulación se incluyen en el PDF.
            </p>
            {simulationHint && (
                <p className={styles.simHint}>{simulationHint}</p>
            )}

            <fieldset className={styles.fieldset}>
                <legend>1. Sobre ti</legend>
                <div className={styles.grid}>
                    <label className={styles.field}>
                        <span>Primer nombre *</span>
                        <input required value={form.primerNombre} onChange={(e) => update("primerNombre", e.target.value)} />
                    </label>
                    <label className={styles.field}>
                        <span>Segundo nombre</span>
                        <input value={form.segundoNombre} onChange={(e) => update("segundoNombre", e.target.value)} />
                    </label>
                    <label className={styles.field}>
                        <span>Primer apellido *</span>
                        <input required value={form.primerApellido} onChange={(e) => update("primerApellido", e.target.value)} />
                    </label>
                    <label className={styles.field}>
                        <span>Segundo apellido</span>
                        <input value={form.segundoApellido} onChange={(e) => update("segundoApellido", e.target.value)} />
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
                    <label className={styles.field}>
                        <span>Fecha de nacimiento *</span>
                        <input placeholder="dd/mm/aaaa" value={form.birthDate} onChange={(e) => update("birthDate", e.target.value)} />
                    </label>
                    <label className={styles.field}>
                        <span>Estado civil</span>
                        <select value={form.maritalStatus} onChange={(e) => update("maritalStatus", e.target.value)}>
                            {MARITAL.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </label>
                    <label className={styles.field}>
                        <span>Personas a cargo</span>
                        <input type="number" min="0" value={form.dependents} onChange={(e) => update("dependents", e.target.value)} />
                    </label>
                    <label className={styles.field}>
                        <span>Correo electrónico *</span>
                        <input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} />
                    </label>
                    <label className={styles.field}>
                        <span>Celular *</span>
                        <input required value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                    </label>
                    <label className={styles.field}>
                        <span>Ciudad de residencia *</span>
                        <input required value={form.cityResidence} onChange={(e) => update("cityResidence", e.target.value)} />
                    </label>
                    <label className={`${styles.field} ${styles.fieldFull}`}>
                        <span>Dirección de residencia *</span>
                        <input required value={form.addressResidence} onChange={(e) => update("addressResidence", e.target.value)} />
                    </label>
                    <label className={styles.field}>
                        <span>Estrato</span>
                        <input type="number" min="1" max="6" value={form.stratum} onChange={(e) => update("stratum", e.target.value)} />
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
                        <span>Empresa / actividad *</span>
                        <input value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />
                    </label>
                    <label className={styles.field}>
                        <span>Cargo</span>
                        <input value={form.jobTitle} onChange={(e) => update("jobTitle", e.target.value)} />
                    </label>
                    <label className={styles.field}>
                        <span>Tipo de contrato</span>
                        <select value={form.contractType} onChange={(e) => update("contractType", e.target.value)}>
                            {CONTRACT_TYPES.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </label>
                    <label className={styles.field}>
                        <span>Fecha de vinculación</span>
                        <input placeholder="mm/aaaa" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} />
                    </label>
                    <label className={styles.field}>
                        <span>Ingresos fijos mensuales (COP) *</span>
                        <input type="number" min="1" required value={form.monthlyFixedIncome} onChange={(e) => update("monthlyFixedIncome", e.target.value)} />
                    </label>
                    <label className={styles.field}>
                        <span>Otros ingresos (COP)</span>
                        <input type="number" min="0" value={form.otherIncome} onChange={(e) => update("otherIncome", e.target.value)} />
                    </label>
                    <label className={styles.field}>
                        <span>Gastos familiares (COP)</span>
                        <input type="number" min="0" value={form.monthlyExpenses} onChange={(e) => update("monthlyExpenses", e.target.value)} />
                    </label>
                    <label className={styles.field}>
                        <span>Arriendo actual (COP)</span>
                        <input type="number" min="0" value={form.rentExpense} onChange={(e) => update("rentExpense", e.target.value)} />
                    </label>
                    <label className={styles.field}>
                        <span>¿Declara renta?</span>
                        <select value={form.declaresTax} onChange={(e) => update("declaresTax", e.target.value)}>
                            <option value="Sí">Sí</option>
                            <option value="No">No</option>
                        </select>
                    </label>
                </div>
            </fieldset>

            <fieldset className={styles.fieldset}>
                <legend>3. Inmueble y préstamo</legend>
                <div className={styles.grid}>
                    <label className={styles.field}>
                        <span>Producto a solicitar</span>
                        <select value={form.creditProduct} onChange={(e) => update("creditProduct", e.target.value)}>
                            {CREDIT_PRODUCTS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </label>
                    <label className={styles.field}>
                        <span>¿Ya eligió el inmueble?</span>
                        <select value={form.propertyChosen} onChange={(e) => update("propertyChosen", e.target.value)}>
                            <option value="Sí">Sí</option>
                            <option value="No">No</option>
                        </select>
                    </label>
                    <label className={styles.field}>
                        <span>Tipo de inmueble</span>
                        <select value={form.propertyKind} onChange={(e) => update("propertyKind", e.target.value)}>
                            {PROPERTY_KINDS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </label>
                    <label className={styles.field}>
                        <span>Estado del inmueble</span>
                        <select value={form.propertyState} onChange={(e) => update("propertyState", e.target.value)}>
                            <option value="Nuevo">Nuevo</option>
                            <option value="Usado">Usado</option>
                        </select>
                    </label>
                    <label className={styles.field}>
                        <span>Ciudad del inmueble *</span>
                        <input required value={form.propertyCity} onChange={(e) => update("propertyCity", e.target.value)} />
                    </label>
                    <label className={`${styles.field} ${styles.fieldFull}`}>
                        <span>Dirección / barrio del inmueble</span>
                        <input value={form.propertyAddress} onChange={(e) => update("propertyAddress", e.target.value)} />
                    </label>
                    <label className={styles.field}>
                        <span>Valor del inmueble (COP) *</span>
                        <input type="number" min="1" required value={form.propertyValue} onChange={(e) => update("propertyValue", e.target.value)} />
                    </label>
                    <label className={styles.field}>
                        <span>Monto del crédito (COP) *</span>
                        <input type="number" min="1" required value={form.loanAmount} onChange={(e) => update("loanAmount", e.target.value)} />
                    </label>
                    <label className={styles.field}>
                        <span>Cuota inicial (COP)</span>
                        <input type="number" min="0" value={form.downPayment} onChange={(e) => update("downPayment", e.target.value)} />
                    </label>
                    <label className={styles.field}>
                        <span>Plazo (años)</span>
                        <input type="number" min="5" max="30" value={form.termYears} onChange={(e) => update("termYears", e.target.value)} />
                    </label>
                    <label className={styles.field}>
                        <span>Plan de pagos</span>
                        <select value={form.paymentPlan} onChange={(e) => update("paymentPlan", e.target.value)}>
                            {PAYMENT_PLANS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </label>
                    <label className={styles.field}>
                        <span>Entidad de preferencia</span>
                        <input placeholder="Bancolombia, Davivienda, FNA…" value={form.preferredBank} onChange={(e) => update("preferredBank", e.target.value)} />
                    </label>
                    <label className={styles.field}>
                        <span>Subsidio</span>
                        <select value={form.subsidy} onChange={(e) => update("subsidy", e.target.value)}>
                            {SUBSIDY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
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
                        y entidades financieras aliadas para gestión de la solicitud.
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
                        (cédula, certificados laborales, extractos) se solicitarán en radicación bancaria.
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
                    {submitting ? "Enviando solicitud…" : "Enviar solicitud a Mónica"}
                </button>
            </div>
        </form>
    );
}
