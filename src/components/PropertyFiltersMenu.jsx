import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CustomDropdown from "./CustomDropdown";
import {
    COUNT_OPTIONS,
    EMPTY_ADVANCED_FILTER,
    buildAdvancedFilterChips,
    parseAdvancedFilterDraft,
    parsePriceInput,
    PROPERTY_TYPE_OPTIONS,
} from "../utils/propertyAdvancedFilters";
import { formatSellCurrencyInput } from "../utils/sellListingCurrency";
import styles from "./PropertyFiltersMenu.module.css";

function FiltersIcon() {
    return (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden className={styles.icon}>
            <path d="M3 5h14M5 10h10M8 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="6" cy="5" r="1.5" fill="currentColor" />
            <circle cx="12" cy="10" r="1.5" fill="currentColor" />
            <circle cx="10" cy="15" r="1.5" fill="currentColor" />
        </svg>
    );
}

function PriceInput({ label, value, onChange }) {
    const display = value ? formatSellCurrencyInput(value, "COP") : "";

    return (
        <label className={styles.priceField}>
            <span className={styles.fieldLabel}>{label}</span>
            <input
                type="text"
                inputMode="numeric"
                className={styles.textInput}
                value={display}
                onChange={(e) => onChange(parsePriceInput(e.target.value))}
                placeholder="$0"
            />
        </label>
    );
}

export default function PropertyFiltersMenu({
    appliedFilter = EMPTY_ADVANCED_FILTER,
    onApply = () => {},
    compact = false,
    controlHeight = 44,
}) {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState({ ...EMPTY_ADVANCED_FILTER, ...appliedFilter });
    const [isMobileSheet, setIsMobileSheet] = useState(false);

    useEffect(() => {
        const mql = window.matchMedia("(max-width: 700px)");
        const update = () => setIsMobileSheet(mql.matches);
        update();
        mql.addEventListener("change", update);
        return () => mql.removeEventListener("change", update);
    }, []);

    useEffect(() => {
        if (!open) {
            setDraft({ ...EMPTY_ADVANCED_FILTER, ...appliedFilter });
        }
    }, [appliedFilter, open]);

    useEffect(() => {
        if (!open) return undefined;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev || "";
        };
    }, [open]);

    useEffect(() => {
        if (!open) return undefined;
        const onKey = (event) => {
            if (event.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    const activeCount = buildAdvancedFilterChips(appliedFilter).length;

    const updateDraft = (patch) => setDraft((prev) => ({ ...prev, ...patch }));

    const closeMenu = () => setOpen(false);

    const handleApply = () => {
        onApply(parseAdvancedFilterDraft(draft));
        closeMenu();
    };

    const handleClear = () => {
        setDraft({ ...EMPTY_ADVANCED_FILTER });
        onApply({ ...EMPTY_ADVANCED_FILTER });
        closeMenu();
    };

    const dropdownH = compact ? 38 : controlHeight;

    const panelFields = (
        <>
            <div className={styles.priceRow}>
                <PriceInput
                    label="Precio desde"
                    value={draft.priceMin || 0}
                    onChange={(v) => updateDraft({ priceMin: v || null })}
                />
                <PriceInput
                    label="Precio hasta"
                    value={draft.priceMax || 0}
                    onChange={(v) => updateDraft({ priceMax: v || null })}
                />
            </div>

            <div className={styles.grid}>
                <div className={styles.field}>
                    <span className={styles.fieldLabel}>Tipo de inmueble</span>
                    <CustomDropdown
                        options={PROPERTY_TYPE_OPTIONS}
                        value={draft.propertyType}
                        onChange={(v) => updateDraft({ propertyType: v })}
                        placeholder="Cualquiera"
                        height={dropdownH}
                        compact
                    />
                </div>
                <div className={styles.field}>
                    <span className={styles.fieldLabel}>Alcobas</span>
                    <CustomDropdown
                        options={COUNT_OPTIONS}
                        value={draft.bedrooms}
                        onChange={(v) => updateDraft({ bedrooms: v })}
                        placeholder="Cualquiera"
                        height={dropdownH}
                        compact
                    />
                </div>
                <div className={styles.field}>
                    <span className={styles.fieldLabel}>Baños</span>
                    <CustomDropdown
                        options={COUNT_OPTIONS}
                        value={draft.bathrooms}
                        onChange={(v) => updateDraft({ bathrooms: v })}
                        placeholder="Cualquiera"
                        height={dropdownH}
                        compact
                    />
                </div>
                <div className={styles.field}>
                    <span className={styles.fieldLabel}>Garaje</span>
                    <CustomDropdown
                        options={COUNT_OPTIONS}
                        value={draft.garages}
                        onChange={(v) => updateDraft({ garages: v })}
                        placeholder="Cualquiera"
                        height={dropdownH}
                        compact
                    />
                </div>
            </div>

            <div className={styles.priceRow}>
                <label className={styles.priceField}>
                    <span className={styles.fieldLabel}>Área desde (m²)</span>
                    <input
                        type="number"
                        min="0"
                        className={styles.textInput}
                        value={draft.areaMin ?? ""}
                        onChange={(e) => updateDraft({
                            areaMin: e.target.value ? Number(e.target.value) : null,
                        })}
                        placeholder="0"
                    />
                </label>
                <label className={styles.priceField}>
                    <span className={styles.fieldLabel}>Área hasta (m²)</span>
                    <input
                        type="number"
                        min="0"
                        className={styles.textInput}
                        value={draft.areaMax ?? ""}
                        onChange={(e) => updateDraft({
                            areaMax: e.target.value ? Number(e.target.value) : null,
                        })}
                        placeholder="0"
                    />
                </label>
            </div>

            <div className={styles.grid}>
                <label className={styles.priceField}>
                    <span className={styles.fieldLabel}>Construido desde</span>
                    <input
                        type="text"
                        inputMode="numeric"
                        className={styles.textInput}
                        value={draft.builtFrom}
                        onChange={(e) => updateDraft({ builtFrom: e.target.value })}
                        placeholder="Año"
                    />
                </label>
                <label className={styles.priceField}>
                    <span className={styles.fieldLabel}>Código Wasi</span>
                    <input
                        type="text"
                        className={styles.textInput}
                        value={draft.wasiCode}
                        onChange={(e) => updateDraft({ wasiCode: e.target.value })}
                        placeholder="Ej. 12345"
                    />
                </label>
            </div>

            <label className={styles.fullField}>
                <span className={styles.fieldLabel}>Texto inmueble</span>
                <input
                    type="text"
                    className={styles.textInput}
                    value={draft.text}
                    onChange={(e) => updateDraft({ text: e.target.value })}
                    placeholder="Título, descripción o dirección"
                />
            </label>
        </>
    );

    const panelPortal = open ? createPortal(
        <>
            <button
                type="button"
                className={`${styles.backdrop} ${isMobileSheet ? styles.backdropMobile : styles.backdropDesktop}`}
                aria-label="Cerrar filtros"
                onClick={closeMenu}
            />
            <div
                className={`${styles.panel} ${isMobileSheet ? styles.panelSheet : styles.panelDialog}`}
                role="dialog"
                aria-modal="true"
                aria-label="Filtros de búsqueda"
            >
                <div className={styles.panelHeader}>
                    <p className={styles.panelTitle}>Filtros</p>
                    <button
                        type="button"
                        className={styles.panelClose}
                        onClick={closeMenu}
                        aria-label="Cerrar"
                    >
                        ×
                    </button>
                </div>
                <div className={styles.panelBody}>
                    {panelFields}
                </div>
                <div className={styles.actions}>
                    <button type="button" className="pillPrimary" onClick={handleApply}>
                        Aplicar
                    </button>
                    <button type="button" className="pillGhost" onClick={handleClear}>
                        Limpiar
                    </button>
                </div>
            </div>
        </>,
        document.body,
    ) : null;

    return (
        <div className={styles.wrap}>
            <button
                type="button"
                className={`pillGhost ${styles.toggle} ${open ? styles.toggleOpen : ""}`}
                style={{ height: controlHeight, minHeight: controlHeight }}
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                aria-haspopup="dialog"
            >
                <FiltersIcon />
                <span className={styles.toggleLabel}>
                    Filtros{activeCount > 0 ? ` (${activeCount})` : ""}
                </span>
            </button>
            {panelPortal}
        </div>
    );
}
