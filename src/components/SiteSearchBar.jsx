import { useEffect, useRef, useState } from "react";
import { useSiteSearch } from "../context/SiteSearchContext";
import { describeSiteSearchResult, parseSiteSearch } from "../utils/siteSearchEngine";
import styles from "./SiteSearchBar.module.css";

function SearchIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
                d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                stroke="currentColor"
                strokeWidth="1.8"
            />
            <path
                d="M16.2 16.2 21 21"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
        </svg>
    );
}

export default function SiteSearchBar({ initialQuery = "" }) {
    const { executeSearch } = useSiteSearch();
    const [value, setValue] = useState(initialQuery);
    const [hint, setHint] = useState("");
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    const hintTimerRef = useRef(null);
    const inputRef = useRef(null);

    const expanded = hovered || focused || Boolean(value.trim());

    useEffect(() => {
        setValue(initialQuery || "");
    }, [initialQuery]);

    useEffect(() => () => {
        if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    }, []);

    const showHint = (text) => {
        setHint(text);
        if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
        hintTimerRef.current = setTimeout(() => setHint(""), 3200);
    };

    const submit = (event) => {
        event?.preventDefault();
        const query = value.trim();
        if (!query) {
            inputRef.current?.focus();
            return;
        }
        const parsed = parseSiteSearch(query);
        showHint(describeSiteSearchResult(parsed));
        executeSearch(query);
    };

    const openSearch = () => {
        setHovered(true);
        requestAnimationFrame(() => inputRef.current?.focus());
    };

    const handleBlur = () => {
        setFocused(false);
        if (!value.trim()) {
            setHovered(false);
        }
    };

    return (
        <div
            className={`${styles.wrap} ${expanded ? styles.expanded : ""}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => {
                if (!focused && !value.trim()) setHovered(false);
            }}
        >
            <form className={styles.form} role="search" onSubmit={submit}>
                <button
                    type="button"
                    className={styles.collapsedBtn}
                    onClick={openSearch}
                    aria-label="Abrir búsqueda"
                    tabIndex={expanded ? -1 : 0}
                >
                    <span className={styles.collapsedLabel}>Buscar</span>
                    <span className={styles.collapsedIcon} aria-hidden>
                        <SearchIcon />
                    </span>
                </button>
                <input
                    ref={inputRef}
                    type="search"
                    className={styles.input}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onFocus={() => {
                        setFocused(true);
                        setHovered(true);
                    }}
                    onBlur={handleBlur}
                    placeholder="Itagüí, 3 habitaciones, crédito…"
                    aria-label="Búsqueda en el sitio"
                    enterKeyHint="search"
                    autoComplete="off"
                    tabIndex={expanded ? 0 : -1}
                />
                <button
                    type="submit"
                    className={styles.submit}
                    aria-label="Buscar"
                    tabIndex={expanded ? 0 : -1}
                >
                    <SearchIcon />
                </button>
            </form>
            {hint && <p className={styles.feedback} role="status">{hint}</p>}
        </div>
    );
}
