/* src/components/CustomDropdown.jsx */
import React, { useRef, useState, useEffect } from "react";
import styles from "./CustomDropdown.module.css";

export default function CustomDropdown({
    options,
    value,
    onChange,
    placeholder = "Selecciona una zona...",
    height = 52,
    compact = false,
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef();

    useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        if (open) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    const selectedLabel = options.find(opt => opt.value === value)?.label || "";

    return (
        <div className={styles.dropdown} ref={ref}>
            <button
                type="button"
                className={styles.toggle}
                style={{
                    height,
                    minHeight: height,
                    padding: compact ? "0 32px 0 14px" : "0 40px 0 18px",
                    borderRadius: 999,
                    fontSize: compact ? 13 : 14,
                }}
                onClick={() => setOpen(v => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span>{selectedLabel || placeholder}</span>
                <svg className={styles.arrow} viewBox="0 0 20 20"><path d="M6 8l4 4 4-4" stroke="#d8a48f" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
            </button>
            {open && (
                <ul className={styles.menu} role="listbox">
                    {options.map(opt => (
                        <li
                            key={opt.value}
                            className={opt.value === value ? styles.selected : undefined}
                            role="option"
                            aria-selected={opt.value === value}
                            onClick={() => { onChange(opt.value); setOpen(false); }}
                        >
                            {opt.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
