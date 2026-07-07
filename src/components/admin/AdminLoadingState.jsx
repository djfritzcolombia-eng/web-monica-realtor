import HouseLineLoader from "../HouseLineLoader";
import styles from "./AdminLoadingState.module.css";

export default function AdminLoadingState({ label = "Cargando…" }) {
    return (
        <div className={styles.wrap}>
            <HouseLineLoader label={label} compact />
        </div>
    );
}
