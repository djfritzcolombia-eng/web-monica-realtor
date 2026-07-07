import {
    buildCatalogProposalMessage,
    buildCatalogVisitMessage,
    hydrateCatalogPropertyForCard,
} from "../../utils/propertyCatalog";
import { buildWhatsAppUrl } from "../../utils/sellListingLinks";
import WasiPropertyCard from "../cards/WasiPropertyCard";
import styles from "./CatalogClientPropertyCard.module.css";

export default function CatalogClientPropertyCard({ property, catalogSlug }) {
    const displayProperty = hydrateCatalogPropertyForCard(property);
    const visitMessage = buildCatalogVisitMessage(displayProperty, catalogSlug);
    const proposalMessage = buildCatalogProposalMessage(displayProperty, catalogSlug);

    return (
        <div className={styles.wrap}>
            <WasiPropertyCard {...displayProperty} />
            <div className={styles.actions}>
                <a
                    href={buildWhatsAppUrl(visitMessage)}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.visitBtn}
                >
                    Organizar visita
                </a>
                <a
                    href={buildWhatsAppUrl(proposalMessage)}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.proposalBtn}
                >
                    Hacer propuesta
                </a>
            </div>
        </div>
    );
}
