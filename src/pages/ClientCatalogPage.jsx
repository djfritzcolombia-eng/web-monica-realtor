import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CardGrid from "../components/CardGrid";
import HouseLineLoader from "../components/HouseLineLoader";
import CatalogClientHero from "../components/catalog/CatalogClientHero";
import CatalogClientPropertyCard from "../components/catalog/CatalogClientPropertyCard";
import SiteTopBar from "../components/SiteTopBar";
import { fetchCatalogBySlug } from "../services/propertyCatalogService";
import styles from "./ClientCatalogPage.module.css";

export default function ClientCatalogPage() {
    const { slug } = useParams();
    const [catalog, setCatalog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        const load = async () => {
            setLoading(true);
            setError("");
            try {
                const data = await fetchCatalogBySlug(slug);
                if (!active) return;
                if (!data || data.status === "inactive") {
                    setError("Este catálogo no está disponible.");
                    setCatalog(null);
                } else {
                    setCatalog(data);
                }
            } catch (err) {
                if (!active) return;
                setError(err?.message || "No se pudo cargar el catálogo.");
            } finally {
                if (active) setLoading(false);
            }
        };
        load();
        return () => {
            active = false;
        };
    }, [slug]);

    const properties = Array.isArray(catalog?.properties) ? catalog.properties : [];

    return (
        <div className={styles.page}>
            <SiteTopBar />
            <main className={styles.main}>
                {loading ? (
                    <HouseLineLoader label="Cargando tu selección personalizada…" />
                ) : error ? (
                    <div className={styles.errorBox}>
                        <p>{error}</p>
                        <Link to="/" className={styles.homeLink}>Volver al sitio</Link>
                    </div>
                ) : (
                    <>
                        <CatalogClientHero
                            clientName={catalog?.clientName}
                            propertyCount={properties.length}
                        />
                        <div className={styles.gridWrap}>
                            <CardGrid
                                items={properties}
                                render={(property) => (
                                    <CatalogClientPropertyCard
                                        key={property.id || property.title}
                                        property={property}
                                        catalogSlug={catalog?.slug}
                                    />
                                )}
                            />
                        </div>
                        <div className={styles.footerCta}>
                            <p>¿Ninguna opción encaja del todo?</p>
                            <Link to="/" className={styles.footerLink}>
                                Explorar más propiedades recomendadas
                            </Link>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
