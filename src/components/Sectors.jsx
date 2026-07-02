// Sectors.jsx
import Section from "./Section";
import { styles } from "../styles/styles";
import { sectors as defaultSectors } from "../data/mockData";

/**
 * Props:
 * - sectors: [{ slug, name }]
 * - selected: array<string> (slugs activos)
 * - onToggle: (slug: string) => void
 * - onClear: () => void
 * - onApply?: () => void   // opcional, para disparar búsqueda
 */
export default function Sectors({
    sectors = defaultSectors,
    selected = [],
    onToggle = () => { },
    onClear = () => { },
    onApply,
}) {
    const isActive = (slug) => selected.includes(slug);

    const chipBase = {
        ...styles.chip,
        cursor: "pointer",
        userSelect: "none",
        transition: "all .2s ease",
    };

    const chipActive = {
        ...chipBase,
        background: "#d8a48f", // terracota
        color: "#fff",
        borderColor: "#d8a48f",
        boxShadow: "0 2px 10px rgba(0,0,0,.06)",
    };

    return (
        <Section title={<>¿En qué sector <em style={styles.em}>deseas vivir?</em></>}>
            <div style={{ ...styles.chipsWrap, gap: 1 }}>
                {sectors.map((s) => (
                    <button
                        key={s.slug}
                        type="button"
                        aria-pressed={isActive(s.slug)}
                        onClick={() => onToggle(s.slug)}
                        style={isActive(s.slug) ? chipActive : chipBase}
                        title={isActive(s.slug) ? "Quitar filtro" : "Agregar filtro"}
                    >
                        {s.name}
                    </button>
                ))}

                {/* Acciones */}
                <button
                    type="button"
                    onClick={onClear}
                    style={{ ...styles.chip, ...styles.chipOutline }}
                    title="Limpiar selección"
                >
                    Limpiar
                </button>

                {onApply && (
                    <button
                        type="button"
                        onClick={onApply}
                        style={{ ...styles.chip, borderColor: "#1976d2", color: "#1976d2" }}
                        title="Aplicar filtros"
                    >
                        Aplicar
                    </button>
                )}

                {/* Navegación a todos los sectores (opcional) */}
                <a href="#/sectores" style={{ ...styles.chip, ...styles.chipOutline }}>
                    Ver más
                </a>
            </div>
        </Section>
    );
}
