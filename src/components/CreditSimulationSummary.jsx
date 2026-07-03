import { formatCOP, formatPercent } from "../utils/housingCreditCalculator";
import { formatCreditFilterMessage } from "../utils/creditSimulatorDeepLink";
import styles from "./HousingCreditSimulator.module.css";

export default function CreditSimulationSummary({
    results,
    filter,
    compact = false,
    showFilterBanner = true,
    showTable = true,
    showDisclaimer = true,
    showActions = false,
    onBack,
    onShare,
    onApplyBudget,
    onApplyCredit,
    onClose,
    shareFeedback,
}) {
    if (!results || !filter) return null;

    const isByProperty = results.mode === "by_property";

    return (
        <>
            <div className={styles.resultsHero}>
                <p className={styles.resultsLabel}>
                    {isByProperty
                        ? "Cuota mensual estimada (crédito + seguros)"
                        : "Monto máximo que te podrían prestar"}
                </p>
                <p className={styles.resultsAmount}>
                    {formatCOP(isByProperty ? results.totalMonthly : results.loanAmount)}
                </p>
                <p className={styles.resultsSub}>
                    {isByProperty
                        ? `A ${results.termYears} años · Tasa ${formatPercent(results.annualRateEa * 100)} EA`
                        : `Vivienda hasta ${formatCOP(results.propertyValue)} (${results.loanPercent}% financiación)`}
                </p>
            </div>

            {showFilterBanner && (
                <div className={styles.budgetBanner}>
                    {formatCreditFilterMessage(filter)}
                </div>
            )}

            {showTable && !compact && (
                <table className={styles.summaryTable}>
                    <tbody>
                        {isByProperty ? (
                            <>
                                <tr>
                                    <td>Valor comercial de la vivienda</td>
                                    <td>{formatCOP(results.propertyValue)}</td>
                                </tr>
                                <tr>
                                    <td>Monto del crédito ({results.loanPercent}%)</td>
                                    <td>{formatCOP(results.loanAmount)}</td>
                                </tr>
                                <tr>
                                    <td>Cuota inicial estimada</td>
                                    <td>{formatCOP(results.downPayment)}</td>
                                </tr>
                                <tr>
                                    <td>Cuota crédito (capital + interés)</td>
                                    <td>{formatCOP(results.monthlyPayment)}</td>
                                </tr>
                                <tr>
                                    <td>Seguro de vida deudor</td>
                                    <td>{formatCOP(results.lifeInsurance)}</td>
                                </tr>
                                <tr>
                                    <td>Seguro incendio / terremoto</td>
                                    <td>{formatCOP(results.fireInsurance)}</td>
                                </tr>
                                <tr>
                                    <td>Total intereses del crédito</td>
                                    <td>{formatCOP(results.totalInterest)}</td>
                                </tr>
                            </>
                        ) : (
                            <>
                                <tr>
                                    <td>Cuota mensual que indicaste</td>
                                    <td>{formatCOP(results.monthlyPayment)}</td>
                                </tr>
                                <tr>
                                    <td>Monto del crédito</td>
                                    <td>{formatCOP(results.loanAmount)}</td>
                                </tr>
                                <tr>
                                    <td>Valor máximo de vivienda</td>
                                    <td>{formatCOP(results.propertyValue)}</td>
                                </tr>
                                <tr>
                                    <td>Cuota inicial estimada</td>
                                    <td>{formatCOP(results.downPayment)}</td>
                                </tr>
                            </>
                        )}
                        <tr>
                            <td>Ingreso mensual sugerido (30% endeudamiento)</td>
                            <td>{formatCOP(results.requiredIncome)}</td>
                        </tr>
                        <tr>
                            <td>Tasa de interés utilizada</td>
                            <td>{formatPercent(results.annualRateEa * 100)} EA</td>
                        </tr>
                        <tr>
                            <td>Modalidad</td>
                            <td>{results.modality === "UVR" ? "UVR" : "Pesos"}</td>
                        </tr>
                        <tr>
                            <td>Plazo</td>
                            <td>{results.termYears} años ({results.months} meses)</td>
                        </tr>
                    </tbody>
                </table>
            )}

            {showDisclaimer && !compact && (
                <div className={styles.disclaimer}>
                    <span className={styles.disclaimerIcon}>i</span>
                    <p>
                        Simulación referencial. Tasa de interés utilizada{" "}
                        <strong>{formatPercent(results.annualRateEa * 100)} EA</strong>.
                        {" "}Los valores reales dependen de tu perfil crediticio, la entidad financiera y los seguros contratados.
                        Esta herramienta no constituye una oferta de crédito.
                    </p>
                </div>
            )}

            {shareFeedback && <p className={styles.shareFeedback}>{shareFeedback}</p>}

            {showActions && (
                <div className={styles.actions}>
                    {onBack && (
                        <button type="button" className={styles.btnSecondary} onClick={onBack}>
                            ← Modificar datos
                        </button>
                    )}
                    {onShare && (
                        <button type="button" className={styles.btnShare} onClick={onShare}>
                            Compartir enlace
                        </button>
                    )}
                    {onApplyCredit && (
                        <button
                            type="button"
                            className={styles.btnCreditApply}
                            onClick={onApplyCredit}
                        >
                            Formulario crédito hipotecario
                        </button>
                    )}
                    {onApplyBudget && (
                        <button
                            type="button"
                            className={styles.simulateBtn}
                            style={{ margin: 0 }}
                            onClick={onApplyBudget}
                        >
                            Buscar propiedades acordes
                        </button>
                    )}
                    {onClose && (
                        <button type="button" className={styles.btnSecondary} onClick={onClose}>
                            Cerrar
                        </button>
                    )}
                </div>
            )}
        </>
    );
}
