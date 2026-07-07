import { useEffect, useState } from "react";
import styles from "./HouseLineLoader.module.css";
import {
    HOUSE_DOOR_KNOB,
    HOUSE_LINE_PATHS,
    HOUSE_LINE_VIEWBOX,
} from "./houseLinePaths";

const DRAW_MS = 4200;

function strokeClass(phase, stylesRef) {
    return phase === "draw" ? stylesRef.strokeDraw : stylesRef.strokeLoop;
}

export default function HouseLineLoader({ label = "Cargando propiedades…", compact = false, className = "" }) {
    const [phase, setPhase] = useState("draw");

    useEffect(() => {
        const timer = window.setTimeout(() => setPhase("loop"), DRAW_MS);
        return () => window.clearTimeout(timer);
    }, []);

    const stroke = strokeClass(phase, styles);

    return (
        <div
            className={`${styles.wrap} ${compact ? styles.wrapCompact : ""} ${className}`.trim()}
            role="status"
            aria-live="polite"
            aria-label={label}
        >
            <svg
                className={styles.svg}
                viewBox={HOUSE_LINE_VIEWBOX}
                preserveAspectRatio="xMidYMid meet"
                aria-hidden
            >
                {HOUSE_LINE_PATHS.map((d, i) => (
                    <path key={i} className={stroke} d={d} pathLength="1" />
                ))}
                <circle
                    className={stroke}
                    cx={HOUSE_DOOR_KNOB.cx}
                    cy={HOUSE_DOOR_KNOB.cy}
                    r={HOUSE_DOOR_KNOB.r}
                    pathLength="1"
                />
            </svg>
            {label ? <p className={styles.label}>{label}</p> : null}
        </div>
    );
}
