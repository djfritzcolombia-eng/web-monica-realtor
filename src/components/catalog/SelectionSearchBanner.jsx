import styles from "./SelectionSearchBanner.module.css";

export default function SelectionSearchBanner({
    selectedCount,
    onClearAndSearch,
    onKeepAndSearch,
}) {
    return (
        <div className={styles.banner} role="status">
            <p className={styles.text}>
                Tienes <strong>{selectedCount}</strong>
                {selectedCount === 1 ? " inmueble seleccionado" : " inmuebles seleccionados"}
                {" "}de otra búsqueda. ¿Qué deseas hacer con la nueva búsqueda?
            </p>
            <div className={styles.actions}>
                <button type="button" className={styles.primaryBtn} onClick={onClearAndSearch}>
                    Limpiar y buscar
                </button>
                <button type="button" className={styles.secondaryBtn} onClick={onKeepAndSearch}>
                    Mantener selección
                </button>
            </div>
        </div>
    );
}
