import { useEffect, useRef, useState } from "react";
import { CREDIT_SEARCH_ZONES } from "../constants/searchZones";
import { fetchOrienteAntioquenoCities } from "../services/wasiLocationService";
import styles from "./ZoneSearchPicker.module.css";

const MAIN_ZONES = CREDIT_SEARCH_ZONES.filter((zone) => zone.key !== "oriente");

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
    const [orienteCities, setOrienteCities] = useState([]);
    const [orienteLoading, setOrienteLoading] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        onOpenChange?.(open);
    }, [open, onOpenChange]);

    useEffect(() => {
        function handleClick(event) {
            if (ref.current && !ref.current.contains(event.target)) {
                setOpen(false);
            }
        }
        if (open) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    useEffect(() => {
        if (!open || orienteCities.length > 0) return;
        let cancelled = false;
        setOrienteLoading(true);
        fetchOrienteAntioquenoCities()
            .then((cities) => {
                if (!cancelled) setOrienteCities(cities);
            })
            .finally(() => {
                if (!cancelled) setOrienteLoading(false);
            });
        return () => { cancelled = true; };
    }, [open, orienteCities.length]);

    const selectedMain = MAIN_ZONES.find((zone) => zone.label === value);
    const orienteLabels = orienteCities
        .filter((city) => orienteCityIds.includes(city.id_city))
        .map((city) => city.label);

    const displayLabel = orienteCityIds.length > 0
        ? `Oriente Antioqueño (${orienteCityIds.length})`
        : (selectedMain?.label || value || "");

    const handleMainSelect = (label) => {
        onOrienteChange?.([]);
        onChange?.(label);
        setOpen(false);
    };

    const toggleOrienteCity = (id_city) => {
        const id = String(id_city);
        const next = orienteCityIds.includes(id)
            ? orienteCityIds.filter((item) => item !== id)
            : [...orienteCityIds, id];
        if (next.length > 0) onChange?.("");
        onOrienteChange?.(next);
    };

    return (
        <div className={styles.wrap} ref={ref}>
            <button
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

            {open && (
                <ul className={styles.menu} role="listbox">
                    {MAIN_ZONES.map((zone) => (
                        <li
                            key={zone.key}
                            className={`${styles.option} ${value === zone.label && orienteCityIds.length === 0 ? styles.optionSelected : ""}`}
                            role="option"
                            aria-selected={value === zone.label && orienteCityIds.length === 0}
                            onClick={() => handleMainSelect(zone.label)}
                        >
                            {zone.label}
                        </li>
                    ))}

                    <li className={styles.orienteGroup}>
                        <div className={styles.orienteHeader}>
                            <span>Oriente Antioqueño</span>
                            <button
                                type="button"
                                className={styles.orienteExpand}
                                onClick={() => setOrienteOpen((prev) => !prev)}
                            >
                                {orienteOpen ? "Ocultar" : "Elegir municipios"}
                            </button>
                        </div>
                        {orienteLabels.length > 0 && !orienteOpen && (
                            <p className={styles.orienteHint}>
                                {orienteLabels.join(" · ")}
                            </p>
                        )}
                        {orienteOpen && (
                            <>
                                {orienteLoading && (
                                    <p className={styles.orienteLoading}>Cargando municipios…</p>
                                )}
                                {!orienteLoading && (
                                    <div className={styles.orienteList}>
                                        {orienteCities.map((city) => (
                                            <label
                                                key={city.id_city}
                                                className={styles.orienteItem}
                                            >
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
                            </>
                        )}
                    </li>
                </ul>
            )}
        </div>
    );
}
