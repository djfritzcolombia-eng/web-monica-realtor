import styles from "./AdminHouseMark.module.css";
import {
    HOUSE_DOOR_KNOB,
    HOUSE_LINE_PATHS,
    HOUSE_LINE_VIEWBOX,
} from "../houseLinePaths";

export default function AdminHouseMark({ className = "", title = "Mónica Fritz Realtor" }) {
    return (
        <svg
            className={`${styles.mark} ${className}`.trim()}
            viewBox={HOUSE_LINE_VIEWBOX}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden
            role="img"
        >
            <title>{title}</title>
            {HOUSE_LINE_PATHS.map((d, i) => (
                <path key={i} className={styles.stroke} d={d} pathLength="1" />
            ))}
            <circle
                className={styles.stroke}
                cx={HOUSE_DOOR_KNOB.cx}
                cy={HOUSE_DOOR_KNOB.cy}
                r={HOUSE_DOOR_KNOB.r}
                pathLength="1"
            />
        </svg>
    );
}
