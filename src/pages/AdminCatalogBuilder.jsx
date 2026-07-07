import { useCallback, useMemo, useState } from "react";
import CardGrid from "../components/CardGrid";
import RegionCityFilter from "../components/RegionCityFilter";
import Section from "../components/Section";
import AdminLoadingState from "../components/admin/AdminLoadingState";
import AdminShell from "../components/admin/AdminShell";
import CatalogSelectionBar from "../components/catalog/CatalogSelectionBar";
import SelectablePropertyCard from "../components/catalog/SelectablePropertyCard";
import { getAdminUser } from "../services/adminAuth";
import { createPropertyCatalog } from "../services/propertyCatalogService";
import { searchSiteInventory } from "../services/propertySearchService";
import {
    buildCatalogShareMessage,
    buildCatalogUrl,
    MAX_CATALOG_PROPERTIES,
} from "../utils/propertyCatalog";
import styles from "./AdminCatalogBuilder.module.css";

export default function AdminCatalogBuilder() {
    const adminUser = getAdminUser();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedMap, setSelectedMap] = useState({});
    const [clientName, setClientName] = useState("");
    const [generating, setGenerating] = useState(false);
    const [generatedUrl, setGeneratedUrl] = useState("");
    const [shareMessage, setShareMessage] = useState("");

    const selectedProperties = useMemo(
        () => Object.values(selectedMap),
        [selectedMap]
    );

    const handleSearch = useCallback(async ({ cityIds = [], zones = [] }) => {
        setLoading(true);
        setError("");
        setGeneratedUrl("");
        setShareMessage("");
        try {
            const items = await searchSiteInventory({ cityIds, zones });
            setProperties(items);
        } catch (err) {
            setError(err?.message || "No se pudieron cargar las propiedades.");
            setProperties([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const toggleProperty = useCallback((property) => {
        const key = String(property.id);
        setSelectedMap((prev) => {
            const next = { ...prev };
            if (next[key]) {
                delete next[key];
                return next;
            }
            if (Object.keys(next).length >= MAX_CATALOG_PROPERTIES) {
                setError(`Puedes seleccionar hasta ${MAX_CATALOG_PROPERTIES} inmuebles por catálogo.`);
                return prev;
            }
            setError("");
            next[key] = property;
            return next;
        });
        setGeneratedUrl("");
        setShareMessage("");
    }, []);

    const handleGenerate = async () => {
        setGenerating(true);
        setError("");
        try {
            const { slug } = await createPropertyCatalog({
                clientName,
                properties: selectedProperties,
                createdBy: adminUser?.usuario || "admin",
            });
            const url = buildCatalogUrl(slug);
            const message = buildCatalogShareMessage({ clientName, catalogUrl: url });
            setGeneratedUrl(url);
            setShareMessage(message);
        } catch (err) {
            setError(err?.message || "No se pudo generar el catálogo.");
        } finally {
            setGenerating(false);
        }
    };

    const clearSelection = () => {
        setSelectedMap({});
        setGeneratedUrl("");
        setShareMessage("");
        setError("");
    };

    return (
        <AdminShell
            title="Catálogos personalizados"
            subtitle="Selecciona inmuebles y genera un enlace para enviar al cliente"
            error={error}
        >
            <div className={styles.page}>
                <div className={styles.intro}>
                    <p>
                        Busca igual que en el sitio, selecciona varias propiedades con un clic
                        y comparte un catálogo privado con mensaje de bienvenida, visitas y propuestas.
                    </p>
                </div>

                <div className={styles.searchWrap}>
                    <RegionCityFilter
                        compact
                        photoLayout
                        onApply={({ cityIds, zones }) => {
                            handleSearch({ cityIds, zones });
                        }}
                    />
                </div>

                <div className={styles.results}>
                    {loading ? (
                        <AdminLoadingState label="Cargando inventario del sitio…" />
                    ) : properties.length === 0 ? (
                        <p className={styles.emptyState}>
                            Elige una zona y pulsa Buscar para ver inmuebles disponibles.
                        </p>
                    ) : (
                        <Section title="Inventario" subtitle={`${properties.length} inmuebles visibles`}>
                            <CardGrid
                                items={properties}
                                render={(property) => (
                                    <SelectablePropertyCard
                                        key={property.id || property.title}
                                        property={property}
                                        selected={Boolean(selectedMap[String(property.id)])}
                                        onToggle={toggleProperty}
                                    />
                                )}
                            />
                        </Section>
                    )}
                </div>

                {selectedProperties.length > 0 && (
                    <CatalogSelectionBar
                        selectedCount={selectedProperties.length}
                        clientName={clientName}
                        onClientNameChange={setClientName}
                        onGenerate={handleGenerate}
                        generating={generating}
                        generatedUrl={generatedUrl}
                        shareMessage={shareMessage}
                        onClearSelection={clearSelection}
                    />
                )}
            </div>
        </AdminShell>
    );
}
