import WasiPropertyCard from "../cards/WasiPropertyCard";
import styles from "./SelectablePropertyCard.module.css";

export default function SelectablePropertyCard({
    property,
    selected = false,
    onToggle,
}) {
    const handleToggle = (event) => {
        event.stopPropagation();
        onToggle?.(property);
    };

    return (
        <div className={`${styles.shell} ${selected ? styles.shellSelected : ""}`}>
            {selected && (
                <span className={styles.cornerBadge} aria-hidden>
                    ✓
                </span>
            )}

            <div className={styles.selectionRail}>
                <button
                    type="button"
                    className={styles.selectBtn}
                    onClick={handleToggle}
                    aria-pressed={selected}
                    aria-label={selected ? "Quitar de la selección" : "Agregar a la selección"}
                >
                    {selected ? "Quitar" : "Seleccionar"}
                </button>
            </div>

            <div className={styles.cardFrame}>
                <WasiPropertyCard {...property} />
            </div>
        </div>
    );
}
