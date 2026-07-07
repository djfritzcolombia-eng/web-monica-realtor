import { Link } from "react-router-dom";
import HouseLineLoader from "../HouseLineLoader";
import styles from "./CatalogClientHero.module.css";

export default function CatalogClientHero({ clientName, propertyCount }) {
    const greeting = clientName?.trim()
        ? `Hola ${clientName.trim()},`
        : "Hola,";

    return (
        <section className={styles.hero}>
            <div className={styles.heroInner}>
                <HouseLineLoader label="Selección personalizada" compact className={styles.heroLoader} />
                <p className={styles.eyebrow}>Mónica Fritz Realtor</p>
                <h1 className={styles.title}>Propiedades elegidas para ti</h1>
                <div className={styles.message}>
                    <p>{greeting}</p>
                    <p>
                        Quería compartirte la búsqueda que armé especialmente para ti.
                        Desde aquí puedes ver las propiedades que te comparto, así como también
                        {" "}<strong>organizar una visita</strong> o realizar una <strong>propuesta</strong>.
                    </p>
                    <p>
                        También puedes acceder a propiedades recomendadas en caso que las ofrecidas
                        no sean de tu agrado.
                    </p>
                </div>
                <p className={styles.count}>
                    {propertyCount} {propertyCount === 1 ? "opción disponible" : "opciones disponibles"}
                </p>
                <Link to="/" className={styles.recommendedLink}>
                    Ver más propiedades recomendadas
                </Link>
            </div>
        </section>
    );
}
