import { formatCOP } from "../utils/housingCreditCalculator";
import {
    CREDIT_APP_STATUS_LABELS,
    CREDIT_APP_STATUSES,
    formatCreditApplicationDate,
    getApplicantFullName,
} from "../utils/creditApplicationForm";
import reviewStyles from "./AdminSellReview.module.css";
import styles from "./CreditApplicationForm.module.css";

function ReadField({ label, value, full }) {
    return (
        <div className={`${styles.field} ${full ? styles.fieldFull : ""}`}>
            <span>{label}</span>
            <div className={reviewStyles.readValue}>{value || "—"}</div>
        </div>
    );
}

function isLegacyApplication(application) {
    return !application.fullName && (application.primerNombre || application.primerApellido);
}

function LegacyApplicationFields({ application }) {
    const fullName = getApplicantFullName(application);
    return (
        <>
            <fieldset className={styles.fieldset}>
                <legend>1. Sobre el solicitante</legend>
                <div className={styles.grid}>
                    <ReadField label="Nombres y apellidos" value={fullName} full />
                    <ReadField label="Tipo documento" value={application.docType} />
                    <ReadField label="Número documento" value={application.docNumber} />
                    <ReadField label="Fecha nacimiento" value={application.birthDate} />
                    <ReadField label="Estado civil" value={application.maritalStatus} />
                    <ReadField label="Personas a cargo" value={application.dependents} />
                    <ReadField label="Correo" value={application.email} />
                    <ReadField label="Celular" value={application.phone} />
                    <ReadField label="Ciudad residencia" value={application.cityResidence} />
                    <ReadField label="Dirección" value={application.addressResidence} full />
                    <ReadField label="Estrato" value={application.stratum} />
                </div>
            </fieldset>
            <fieldset className={styles.fieldset}>
                <legend>2. Ocupación e ingresos</legend>
                <div className={styles.grid}>
                    <ReadField label="Ocupación" value={application.occupation} />
                    <ReadField label="Empresa" value={application.companyName} />
                    <ReadField label="Cargo" value={application.jobTitle} />
                    <ReadField label="Contrato" value={application.contractType} />
                    <ReadField label="Ingresos fijos" value={formatCOP(Number(application.monthlyFixedIncome) || 0)} />
                    <ReadField label="Otros ingresos" value={formatCOP(Number(application.otherIncome) || 0)} />
                    <ReadField label="Declara renta" value={application.declaresTax} />
                </div>
            </fieldset>
            <fieldset className={styles.fieldset}>
                <legend>3. Inmueble y préstamo</legend>
                <div className={styles.grid}>
                    <ReadField label="Producto" value={application.creditProduct} />
                    <ReadField label="Ciudad inmueble" value={application.propertyCity} />
                    <ReadField label="Valor inmueble" value={formatCOP(Number(application.propertyValue) || 0)} />
                    <ReadField label="Monto crédito" value={formatCOP(Number(application.loanAmount) || 0)} />
                    <ReadField label="Cuota inicial" value={formatCOP(Number(application.downPayment) || 0)} />
                    <ReadField label="Plazo" value={application.termYears ? `${application.termYears} años` : "—"} />
                </div>
            </fieldset>
        </>
    );
}

function CurrentApplicationFields({ application }) {
    return (
        <>
            <fieldset className={styles.fieldset}>
                <legend>1. Sobre el solicitante</legend>
                <div className={styles.grid}>
                    <ReadField label="Nombre completo" value={application.fullName} full />
                    <ReadField label="Fecha nacimiento" value={application.birthDate} />
                    <ReadField label="Celular" value={application.phone} />
                    <ReadField label="Tipo documento" value={application.docType} />
                    <ReadField label="Número documento" value={application.docNumber} />
                    <ReadField label="Correo" value={application.email} full />
                </div>
            </fieldset>
            <fieldset className={styles.fieldset}>
                <legend>2. Ocupación e ingresos</legend>
                <div className={styles.grid}>
                    <ReadField label="Ocupación" value={application.occupation} />
                    <ReadField label="Ingresos mensuales" value={formatCOP(Number(application.monthlyIncome) || 0)} />
                    <ReadField label="Ingresos extra" value={formatCOP(Number(application.extraIncome) || 0)} />
                    <ReadField label="Declara renta" value={application.declaresTax} />
                    <ReadField label="Ciudad donde trabaja" value={application.workCity} />
                </div>
            </fieldset>
            <fieldset className={styles.fieldset}>
                <legend>3. Monto solicitado</legend>
                <div className={styles.grid}>
                    <ReadField label="Monto a solicitar" value={formatCOP(Number(application.loanAmount) || 0)} />
                    <ReadField label="Cuota inicial disponible" value={formatCOP(Number(application.downPayment) || 0)} />
                </div>
            </fieldset>
        </>
    );
}

function SimulationBlock({ simulation }) {
    if (!simulation) return null;
    return (
        <fieldset className={styles.fieldset}>
            <legend>Simulación del simulador</legend>
            <div className={styles.grid}>
                <ReadField
                    label="Modo"
                    value={simulation.mode === "by_property" ? "Según valor de vivienda" : "Según cuota mensual"}
                />
                <ReadField label="Valor vivienda" value={formatCOP(Number(simulation.propertyValue) || 0)} />
                <ReadField label="Monto crédito" value={formatCOP(Number(simulation.loanAmount) || 0)} />
                <ReadField label="Cuota mensual ref." value={formatCOP(Number(simulation.totalMonthly || simulation.monthlyPayment) || 0)} />
                <ReadField label="Ingreso sugerido" value={formatCOP(Number(simulation.requiredIncome) || 0)} />
                <ReadField label="Plazo" value={simulation.termYears ? `${simulation.termYears} años` : "—"} />
            </div>
        </fieldset>
    );
}

export default function CreditApplicationReview({ application }) {
    const legacy = isLegacyApplication(application);
    const fullName = getApplicantFullName(application);

    return (
        <div className={reviewStyles.reviewShell}>
            <div className={reviewStyles.reviewHeader}>
                <div>
                    <h2 className={reviewStyles.reviewTitle}>{fullName || "Solicitud sin nombre"}</h2>
                    <p className={reviewStyles.reviewMeta}>
                        {application.docType} {application.docNumber}
                        {" · "}
                        {formatCreditApplicationDate(application.createdAt)}
                    </p>
                </div>
                <span className={reviewStyles.statusPill}>
                    {CREDIT_APP_STATUS_LABELS[application.adminStatus] || CREDIT_APP_STATUS_LABELS[CREDIT_APP_STATUSES.pending]}
                </span>
            </div>

            {legacy ? (
                <LegacyApplicationFields application={application} />
            ) : (
                <CurrentApplicationFields application={application} />
            )}

            <SimulationBlock simulation={application.simulationSummary} />

            <fieldset className={styles.fieldset}>
                <legend>Autorizaciones</legend>
                <div className={styles.grid}>
                    <ReadField label="Centrales de riesgo" value={application.authorizeCreditBureaus ? "Autorizado" : "No"} />
                    <ReadField label="Tratamiento de datos" value={application.authorizeDataTreatment ? "Autorizado" : "No"} />
                    <ReadField label="Veracidad" value={application.declaresTruth ? "Declarada" : "No"} />
                    {application.notes && <ReadField label="Observaciones del solicitante" value={application.notes} full />}
                </div>
            </fieldset>
        </div>
    );
}
