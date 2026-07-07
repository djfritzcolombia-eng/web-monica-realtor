import { buildAdvancedFilterChips } from "../utils/propertyAdvancedFilters";
import styles from "./PropertyFilterChips.module.css";

export default function PropertyFilterChips({ filter, onRemove }) {
    const chips = buildAdvancedFilterChips(filter);
    if (!chips.length) return null;

    return (
        <div className={styles.wrap} aria-label="Filtros activos">
            {chips.map((chip) => (
                <button
                    key={chip.key}
                    type="button"
                    className={styles.chip}
                    onClick={() => onRemove(chip.key)}
                    aria-label={`Quitar filtro ${chip.label}`}
                >
                    <span>{chip.label}</span>
                    <span className={styles.remove} aria-hidden>×</span>
                </button>
            ))}
        </div>
    );
}
