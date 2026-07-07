import { useEffect, useState } from "react";
import {
    formatSellCurrencyDisplay,
    formatSellCurrencyInput,
    parseSellCurrencyInput,
    SELL_CURRENCIES,
} from "../utils/sellListingCurrency";
import styles from "./CurrencyAmountField.module.css";

export default function CurrencyAmountField({
    label,
    value = 0,
    currency = "COP",
    onValueChange,
    onCurrencyChange,
    required = false,
    highlight = false,
}) {
    const [display, setDisplay] = useState(() => formatSellCurrencyInput(value, currency));

    useEffect(() => {
        setDisplay(formatSellCurrencyInput(value, currency));
    }, [value, currency]);

    const handleInputChange = (event) => {
        const raw = event.target.value;
        const parsed = parseSellCurrencyInput(raw);
        onValueChange(parsed);
        setDisplay(formatSellCurrencyInput(parsed, currency));
    };

    const preview = value > 0 ? formatSellCurrencyDisplay(value, currency) : SELL_CURRENCIES[currency]?.example;

    return (
        <label className={`${styles.field}${highlight ? ` ${styles.fieldHighlight}` : ""}`}>
            <span>{label}</span>
            <div className={styles.row}>
                <select
                    className={styles.currencySelect}
                    value={currency}
                    onChange={(event) => onCurrencyChange(event.target.value)}
                    aria-label={`Moneda para ${label}`}
                >
                    {Object.values(SELL_CURRENCIES).map((item) => (
                        <option key={item.code} value={item.code}>{item.label}</option>
                    ))}
                </select>
                <input
                    className={styles.amountInput}
                    required={required}
                    inputMode="numeric"
                    value={display}
                    onChange={handleInputChange}
                    placeholder={SELL_CURRENCIES[currency]?.example}
                />
            </div>
            <small className={styles.preview}>{preview}</small>
        </label>
    );
}
