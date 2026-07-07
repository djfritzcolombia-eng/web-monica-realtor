import { useMemo, useState } from "react";
import WasiPropertyCard from "./cards/WasiPropertyCard";
import {
    AMENITY_OPTIONS,
    formatListingCurrency,
    getSellListingGaps,
    isFieldMissing,
    listingToForm,
} from "../utils/sellListingForm";
import { mapSellListingToProperty } from "../utils/sellListingInventory";
import formStyles from "../pages/SellPropertyPage.module.css";
import adminStyles from "./AdminSellReview.module.css";

function ReadField({ label, value, missing, warning, full }) {
    const fieldClass = [
        formStyles.field,
        full ? formStyles.fieldFull : "",
        missing ? adminStyles.fieldMissing : "",
        warning ? adminStyles.fieldWarning : "",
    ].filter(Boolean).join(" ");

    return (
        <div className={fieldClass}>
            <span>
                {label}
                {missing ? " · Falta" : warning ? " · Revisar" : ""}
            </span>
            <div className={`${adminStyles.readValue} ${!value ? adminStyles.readValueMuted : ""}`}>
                {value || "—"}
            </div>
        </div>
    );
}

export default function SellListingSubmissionReview({ listing }) {
    const [viewMode, setViewMode] = useState("form");
    const form = useMemo(() => listingToForm(listing), [listing]);
    const gaps = useMemo(() => getSellListingGaps(listing), [listing]);
    const criticalGaps = gaps.filter((gap) => !gap.warning);
    const previewProperty = useMemo(() => mapSellListingToProperty(listing), [listing]);
    const photos = listing.photos || [];

    const gapFor = (field) => gaps.find((gap) => gap.field === field);

    return (
        <div className={adminStyles.reviewShell}>
            <div className={adminStyles.viewToggle}>
                <button
                    type="button"
                    className={`${adminStyles.viewToggleBtn} ${viewMode === "form" ? adminStyles.viewToggleBtnActive : ""}`}
                    onClick={() => setViewMode("form")}
                >
                    Formulario del solicitante
                </button>
                <button
                    type="button"
                    className={`${adminStyles.viewToggleBtn} ${viewMode === "preview" ? adminStyles.viewToggleBtnActive : ""}`}
                    onClick={() => setViewMode("preview")}
                >
                    Vista publicación
                </button>
            </div>

            {criticalGaps.length > 0 && viewMode === "form" && (
                <div className={adminStyles.gapsBanner}>
                    <strong>Campos por completar o revisar ({criticalGaps.length})</strong>
                    <ul>
                        {gaps.map((gap) => (
                            <li key={`${gap.field}-${gap.label}`}>{gap.label}</li>
                        ))}
                    </ul>
                </div>
            )}

            {viewMode === "preview" ? (
                <div className={adminStyles.previewWrap}>
                    <p className={adminStyles.previewTitle}>Así se verá la tarjeta en la búsqueda</p>
                    <WasiPropertyCard {...previewProperty} />
                </div>
            ) : (
                <div className={adminStyles.readForm}>
                    <fieldset className={formStyles.fieldset}>
                        <legend>Datos de contacto</legend>
                        <div className={formStyles.grid}>
                            <ReadField
                                label="Nombre completo"
                                value={form.ownerName}
                                missing={isFieldMissing("ownerName", gaps)}
                            />
                            <ReadField
                                label="Correo electrónico"
                                value={form.ownerEmail}
                                missing={isFieldMissing("ownerEmail", gaps)}
                            />
                            <ReadField
                                label="Teléfono / WhatsApp"
                                value={form.ownerPhone}
                                missing={isFieldMissing("ownerPhone", gaps)}
                            />
                        </div>
                    </fieldset>

                    <fieldset className={formStyles.fieldset}>
                        <legend>Información del inmueble</legend>
                        <div className={formStyles.grid}>
                            <ReadField label="Tipo de inmueble" value={form.propertyType} />
                            <ReadField
                                label="Título del aviso"
                                value={form.title}
                                missing={isFieldMissing("title", gaps)}
                            />
                            <ReadField
                                label="Descripción"
                                value={form.description}
                                missing={isFieldMissing("description", gaps)}
                                warning={Boolean(gapFor("description")?.warning)}
                                full
                            />
                            <ReadField
                                label="Dirección"
                                value={form.address}
                                missing={isFieldMissing("address", gaps)}
                            />
                            <ReadField
                                label="Barrio"
                                value={form.neighborhood}
                                missing={isFieldMissing("neighborhood", gaps)}
                            />
                            <ReadField
                                label="Ciudad"
                                value={form.city}
                                missing={isFieldMissing("city", gaps)}
                            />
                            <ReadField
                                label="Precio de venta"
                                value={formatListingCurrency(form.price, form.priceCurrency)}
                                missing={isFieldMissing("price", gaps)}
                            />
                            <ReadField
                                label="Administración"
                                value={form.adminFee
                                    ? formatListingCurrency(form.adminFee, form.adminFeeCurrency)
                                    : "—"}
                            />
                            <ReadField label="Habitaciones" value={form.bedrooms || "—"} />
                            <ReadField label="Baños" value={form.bathrooms || "—"} />
                            <ReadField label="Garajes" value={form.garages || "—"} />
                            <ReadField label="Área (m²)" value={form.area || "—"} />
                            <ReadField label="Estrato" value={form.stratum || "—"} />
                            <ReadField label="Piso" value={form.floor || "—"} />
                            <ReadField label="Año construcción" value={form.year || "—"} />
                        </div>
                    </fieldset>

                    <fieldset className={formStyles.fieldset}>
                        <legend>Amenidades</legend>
                        <div className={formStyles.amenities}>
                            {AMENITY_OPTIONS.map((amenity) => {
                                const selected = form.amenities.includes(amenity);
                                return (
                                    <span
                                        key={amenity}
                                        className={`${formStyles.amenityChip} ${selected ? adminStyles.amenityOn : adminStyles.amenityOff}`}
                                    >
                                        {selected ? "✓" : "○"} {amenity}
                                    </span>
                                );
                            })}
                        </div>
                    </fieldset>

                    <fieldset className={`${formStyles.fieldset} ${isFieldMissing("photos", gaps) || gapFor("photos")?.warning ? adminStyles.fieldMissing : ""}`}>
                        <legend>Fotografías</legend>
                        <p className={formStyles.help}>
                            {photos.length}/12 fotos enviadas
                            {gapFor("photos") ? ` · ${gapFor("photos").label}` : ""}
                        </p>
                        {photos.length > 0 ? (
                            <div className={formStyles.photoGrid}>
                                {photos.map((photo, index) => (
                                    <figure key={photo.storagePath || photo.url || index} className={formStyles.photoCard}>
                                        <a href={photo.url} target="_blank" rel="noreferrer">
                                            <img src={photo.url} alt={photo.name || `Foto ${index + 1}`} />
                                        </a>
                                        <figcaption>Foto {index + 1}</figcaption>
                                    </figure>
                                ))}
                            </div>
                        ) : (
                            <div className={adminStyles.readValue}>Sin fotografías</div>
                        )}
                    </fieldset>
                </div>
            )}
        </div>
    );
}
