import WasiPropertyCard from "../cards/WasiPropertyCard";
import styles from "./SelectablePropertyCard.module.css";

export default function SelectablePropertyCard({
    property,
    selected = false,
    onToggle,
    inBudget = false,
}) {
    const handleToggle = (event) => {
        event.stopPropagation();
        onToggle?.(property);
    };

    return (
        <div className={`${styles.shell} ${selected ? styles.shellSelected : ""}`}>
            <div className={styles.selectionRail}>
                <button
                    type="button"
                    className={`${styles.selectBtn} ${selected ? styles.selectBtnActive : ""}`}
                    onClick={handleToggle}
                    aria-pressed={selected}
                    aria-label={selected ? "Quitar de la selección" : "Agregar a la selección"}
                >
                    {selected ? (
                        <>
                            <span className={styles.labelSelected}>Seleccionado</span>
                            <span className={styles.labelRemove} aria-hidden>Quitar</span>
                        </>
                    ) : (
                        <span>Seleccionar</span>
                    )}
                </button>
            </div>

            <div className={styles.cardFrame}>
                <WasiPropertyCard {...property} inBudget={inBudget} />
            </div>
        </div>
    );
}
