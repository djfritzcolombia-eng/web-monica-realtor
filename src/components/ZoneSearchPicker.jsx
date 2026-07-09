import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ORIENTE_ANTIOQUENO_CITIES } from "../constants/orienteAntioqueno";
import { CREDIT_SEARCH_ZONES } from "../constants/searchZones";
import { fetchOrienteAntioquenoCities } from "../services/wasiLocationService";
import styles from "./ZoneSearchPicker.module.css";

const MAIN_ZONES = CREDIT_SEARCH_ZONES.filter((zone) => zone.key !== "oriente");
const ORIENTE_LABEL = "Oriente";

function useMenuPosition(open, anchorRef) {
    const [style, setStyle] = useState(null);

    useEffect(() => {
        if (!open || !anchorRef.current) {
            setStyle(null);
            return undefined;
        }

        const update = () => {
            const rect = anchorRef.current.getBoundingClientRect();
            const maxHeight = Math.min(420, window.innerHeight - rect.bottom - 16);
            setStyle({
                position: "fixed",
                top: rect.bottom + 6,
                left: rect.left,
                width: rect.width,
                maxHeight: Math.max(180, maxHeight),
                zIndex: 10000,
            });
        };

        update();
        window.addEventListener("resize", update);
        window.addEventListener("scroll", update, true);
        return () => {
            window.removeEventListener("resize", update);
            window.removeEventListener("scroll", update, true);
        };
    }, [open, anchorRef]);

    return style;
}

export default function ZoneSearchPicker({
    value = "",
    orienteCityIds = [],
    onChange,
    onOrienteChange,
    onOpenChange,
    placeholder = "Zona...",
    height = 44,
    compact = false,
}) {
    const [open, setOpen] = useState(false);
    const [orienteOpen, setOrienteOpen] = useState(false);
    const [orienteCities, setOrienteCities] = useState(ORIENTE_ANTIOQUENO_CITIES);
    const wrapRef = useRef(null);
    const toggleRef = useRef(null);
    const menuStyle = useMenuPosition(open, toggleRef);

    useEffect(() => {
        onOpenChange?.(open);
    }, [open, onOpenChange]);

    useEffect(() => {
        function handleClick(event) {
            const inWrap = wrapRef.current?.contains(event.target);
            const inMenu = event.target.closest?.(`[data-zone-menu="true"]`);
            if (!inWrap && !inMenu) setOpen(false);
        }
        if (open) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    useEffect(() => {
        let cancelled = false;
        fetchOrienteAntioquenoCities()
            .then((cities) => {
                if (!cancelled && cities.length > 0) setOrienteCities(cities);
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, []);

    const hasOrienteSelection = orienteCityIds.length > 0;
    const orienteLabels = orienteCities
        .filter((city) => orienteCityIds.includes(city.id_city))
        .map((city) => city.label);

    const displayLabel = hasOrienteSelection
        ? `${ORIENTE_LABEL} (${orienteCityIds.length})`
        : (MAIN_ZONES.find((zone) => zone.label === value)?.label || value || "");

    const handleMainSelect = (label) => {
        onOrienteChange?.([]);
        onChange?.(label);
        setOrienteOpen(false);
        setOpen(false);
    };

    const handleOrienteToggle = () => {
        setOrienteOpen((prev) => !prev);
    };

    const toggleOrienteCity = (id_city) => {
        const id = String(id_city);
        const next = orienteCityIds.includes(id)
            ? orienteCityIds.filter((item) => item !== id)
            : [...orienteCityIds, id];
        if (next.length > 0) onChange?.("");
        onOrienteChange?.(next);
    };

    const menu = open && menuStyle ? (
        <ul
            className={styles.menu}
            style={menuStyle}
            role="listbox"
            data-zone-menu="true"
        >
            {MAIN_ZONES.map((zone) => (
                <li
                    key={zone.key}
                    className={`${styles.option} ${value === zone.label && !hasOrienteSelection ? styles.optionSelected : ""}`}
                    role="option"
                    aria-selected={value === zone.label && !hasOrienteSelection}
                    onClick={() => handleMainSelect(zone.label)}
                >
                    {zone.label}
                </li>
            ))}

            <li className={styles.orienteBlock}>
                <button
                    type="button"
                    className={`${styles.option} ${styles.orienteOption} ${hasOrienteSelection ? styles.optionSelected : ""}`}
                    onClick={handleOrienteToggle}
                    aria-expanded={orienteOpen}
                >
                    <span>{ORIENTE_LABEL}</span>
                    <span className={styles.orienteChevron}>{orienteOpen ? "▴" : "▾"}</span>
                </button>

                {hasOrienteSelection && !orienteOpen && (
                    <p className={styles.orienteHint}>{orienteLabels.join(" · ")}</p>
                )}

                {orienteOpen && (
                    <div className={styles.orienteList}>
                        {orienteCities.map((city) => (
                            <label key={city.id_city} className={styles.orienteItem}>
                                <input
                                    type="checkbox"
                                    checked={orienteCityIds.includes(city.id_city)}
                                    onChange={() => toggleOrienteCity(city.id_city)}
                                />
                                <span>{city.label}</span>
                            </label>
                        ))}
                    </div>
                )}
            </li>
        </ul>
    ) : null;

    return (
        <div className={styles.wrap} ref={wrapRef}>
            <button
                ref={toggleRef}
                type="button"
                className={styles.toggle}
                style={{ height, minHeight: height, fontSize: compact ? 13 : 14 }}
                onClick={() => setOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span>{displayLabel || placeholder}</span>
                <svg className={styles.arrow} viewBox="0 0 20 20" aria-hidden>
                    <path d="M6 8l4 4 4-4" stroke="#d8a48f" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
            </button>

            {menu && createPortal(menu, document.body)}
        </div>
    );
}
