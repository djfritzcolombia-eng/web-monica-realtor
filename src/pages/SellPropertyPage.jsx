import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import GlobalReset from "../components/GlobalReset";
import SiteTopBar from "../components/SiteTopBar";
import AppVersion from "../components/AppVersion";
import FloatingSocial from "../components/FloatingSocial";
import {
    fetchSellListingById,
    resubmitSellListing,
    SELL_LISTING_STATUSES,
    SELL_STATUS_LABELS,
    submitSellListing,
} from "../services/sellListingService";
import { styles } from "../styles/styles";
import stylesLocal from "./SellPropertyPage.module.css";

const PROPERTY_TYPES = [
    "Apartamento",
    "Casa",
    "Apartaestudio",
    "Local comercial",
    "Lote",
    "Bodega",
    "Oficina",
];

const AMENITY_OPTIONS = [
    "Admite mascotas",
    "Baño auxiliar",
    "Clósets",
    "Transporte público cercano",
    "Parqueadero visitantes",
    "Piscina",
    "Gimnasio",
    "Balcon",
];

const EMPTY_FORM = {
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    propertyType: "Apartamento",
    title: "",
    description: "",
    address: "",
    city: "",
    neighborhood: "",
    price: "",
    adminFee: "",
    bedrooms: "",
    bathrooms: "",
    garages: "",
    area: "",
    stratum: "",
    floor: "",
    year: "",
    amenities: [],
};

function listingToForm(listing) {
    return {
        ownerName: listing.ownerName || "",
        ownerEmail: listing.ownerEmail || "",
        ownerPhone: listing.ownerPhone || "",
        propertyType: listing.propertyType || "Apartamento",
        title: listing.title || "",
        description: listing.description || "",
        address: listing.address || "",
        city: listing.city || "",
        neighborhood: listing.neighborhood || "",
        price: listing.price ? String(listing.price) : "",
        adminFee: listing.adminFee ? String(listing.adminFee) : "",
        bedrooms: listing.bedrooms ? String(listing.bedrooms) : "",
        bathrooms: listing.bathrooms ? String(listing.bathrooms) : "",
        garages: listing.garages ? String(listing.garages) : "",
        area: listing.area ? String(listing.area) : "",
        stratum: listing.stratum ? String(listing.stratum) : "",
        floor: listing.floor ? String(listing.floor) : "",
        year: listing.year ? String(listing.year) : "",
        amenities: listing.amenities || [],
    };
}

export default function SellPropertyPage() {
    const [searchParams] = useSearchParams();
    const editId = searchParams.get("id");
    const [form, setForm] = useState(EMPTY_FORM);
    const [photos, setPhotos] = useState([]);
    const [existingPhotos, setExistingPhotos] = useState([]);
    const [loadingListing, setLoadingListing] = useState(Boolean(editId));
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(null);
    const [listingStatus, setListingStatus] = useState(null);
    const [revisionNotes, setRevisionNotes] = useState("");

    const isRevisionMode = listingStatus === SELL_LISTING_STATUSES.needs_revision;
    const isLockedReview = Boolean(editId) && listingStatus && !isRevisionMode;

    useEffect(() => {
        if (!editId) return;

        let active = true;
        (async () => {
            setLoadingListing(true);
            setError("");
            try {
                const listing = await fetchSellListingById(editId);
                if (!active) return;
                if (!listing) {
                    setError("No encontramos la solicitud indicada.");
                    return;
                }
                setForm(listingToForm(listing));
                setExistingPhotos(listing.photos || []);
                setListingStatus(listing.status);
                setRevisionNotes(listing.revisionNotes || "");
            } catch (err) {
                if (active) {
                    setError(err?.message || "No se pudo cargar la solicitud.");
                }
            } finally {
                if (active) setLoadingListing(false);
            }
        })();

        return () => {
            active = false;
        };
    }, [editId]);

    const photoPreviewUrls = useMemo(
        () => photos.map((file) => URL.createObjectURL(file)),
        [photos]
    );

    useEffect(() => () => {
        photoPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    }, [photoPreviewUrls]);

    const updateField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const toggleAmenity = (amenity) => {
        setForm((prev) => {
            const has = prev.amenities.includes(amenity);
            return {
                ...prev,
                amenities: has
                    ? prev.amenities.filter((item) => item !== amenity)
                    : [...prev.amenities, amenity],
            };
        });
    };

    const handlePhotoChange = (event) => {
        const files = Array.from(event.target.files || []);
        setPhotos((prev) => [...prev, ...files].slice(0, 12));
        event.target.value = "";
    };

    const removeNewPhoto = (index) => {
        setPhotos((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError("");
        setSuccess(null);

        try {
            const payload = {
                ...form,
                price: Number(form.price),
                adminFee: Number(form.adminFee || 0),
                bedrooms: Number(form.bedrooms || 0),
                bathrooms: Number(form.bathrooms || 0),
                garages: Number(form.garages || 0),
                area: Number(form.area || 0),
                stratum: Number(form.stratum || 0),
                floor: Number(form.floor || 0),
                year: Number(form.year || 0),
            };

            if (editId && isRevisionMode) {
                await resubmitSellListing(editId, payload, photos, existingPhotos);
                setSuccess({
                    title: "Correcciones enviadas",
                    message: "Recibimos tu actualización. Mónica revisará nuevamente tu inmueble antes de publicarlo.",
                    id: editId,
                });
            } else {
                const result = await submitSellListing(payload, photos);
                localStorage.setItem("mf_last_sell_listing_id", result.id);
                setSuccess({
                    title: "Solicitud recibida",
                    message: "Tu inmueble entró en revisión. Te contactaremos si necesitamos ajustes antes de publicarlo.",
                    id: result.id,
                });
                setForm(EMPTY_FORM);
                setPhotos([]);
            }
        } catch (err) {
            setError(err?.message || "No se pudo enviar la solicitud.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <GlobalReset />
            <div style={styles.page}>
                <SiteTopBar showNav />
                <main className={stylesLocal.main}>
                    <section className={stylesLocal.hero}>
                        <p className={stylesLocal.eyebrow}>Monica Fritz Realtor · Vender</p>
                        <h1 className={stylesLocal.title}>
                            Publica tu inmueble con <em>revisión profesional</em>
                        </h1>
                        <p className={stylesLocal.lead}>
                            Completa el formulario con fotos y datos. Cada solicitud pasa por revisión de Mónica Fritz
                            antes de aprobarse y publicarse.
                        </p>
                    </section>

                    {loadingListing && (
                        <p className={stylesLocal.notice}>Cargando solicitud…</p>
                    )}

                    {revisionNotes && isRevisionMode && (
                        <div className={stylesLocal.revisionBox}>
                            <strong>Observaciones de revisión</strong>
                            <p>{revisionNotes}</p>
                        </div>
                    )}

                    {success ? (
                        <div className={stylesLocal.successBox}>
                            <h2>{success.title}</h2>
                            <p>{success.message}</p>
                            <p className={stylesLocal.reference}>Referencia: {success.id}</p>
                            <div className={stylesLocal.successActions}>
                                <Link to="/" className={stylesLocal.secondaryBtn}>Volver a buscar</Link>
                                {!isRevisionMode && (
                                    <button
                                        type="button"
                                        className={stylesLocal.primaryBtn}
                                        onClick={() => setSuccess(null)}
                                    >
                                        Enviar otro inmueble
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : isLockedReview ? (
                        <div className={stylesLocal.successBox}>
                            <h2>Solicitud en revisión</h2>
                            <p>
                                Tu inmueble está en estado{" "}
                                <strong>{SELL_STATUS_LABELS[listingStatus] || listingStatus}</strong>.
                                Si Mónica solicita correcciones, podrás editarlo desde el enlace que te compartamos.
                            </p>
                            <p className={stylesLocal.reference}>Referencia: {editId}</p>
                            <div className={stylesLocal.successActions}>
                                <Link to="/" className={stylesLocal.secondaryBtn}>Volver a buscar</Link>
                            </div>
                        </div>
                    ) : (
                        <form className={stylesLocal.form} onSubmit={handleSubmit}>
                            <fieldset className={stylesLocal.fieldset}>
                                <legend>Datos de contacto</legend>
                                <div className={stylesLocal.grid}>
                                    <label className={stylesLocal.field}>
                                        <span>Nombre completo *</span>
                                        <input
                                            required
                                            value={form.ownerName}
                                            onChange={(e) => updateField("ownerName", e.target.value)}
                                        />
                                    </label>
                                    <label className={stylesLocal.field}>
                                        <span>Correo electrónico *</span>
                                        <input
                                            required
                                            type="email"
                                            value={form.ownerEmail}
                                            onChange={(e) => updateField("ownerEmail", e.target.value)}
                                        />
                                    </label>
                                    <label className={stylesLocal.field}>
                                        <span>Teléfono / WhatsApp *</span>
                                        <input
                                            required
                                            value={form.ownerPhone}
                                            onChange={(e) => updateField("ownerPhone", e.target.value)}
                                        />
                                    </label>
                                </div>
                            </fieldset>

                            <fieldset className={stylesLocal.fieldset}>
                                <legend>Información del inmueble</legend>
                                <div className={stylesLocal.grid}>
                                    <label className={stylesLocal.field}>
                                        <span>Tipo de inmueble *</span>
                                        <select
                                            value={form.propertyType}
                                            onChange={(e) => updateField("propertyType", e.target.value)}
                                        >
                                            {PROPERTY_TYPES.map((type) => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className={stylesLocal.field}>
                                        <span>Título del aviso *</span>
                                        <input
                                            required
                                            value={form.title}
                                            onChange={(e) => updateField("title", e.target.value)}
                                            placeholder="Ej. Apartamento en El Poblado"
                                        />
                                    </label>
                                    <label className={`${stylesLocal.field} ${stylesLocal.fieldFull}`}>
                                        <span>Descripción *</span>
                                        <textarea
                                            required
                                            rows={5}
                                            value={form.description}
                                            onChange={(e) => updateField("description", e.target.value)}
                                            placeholder="Describe el inmueble, estado, entorno y condiciones de venta."
                                        />
                                    </label>
                                    <label className={stylesLocal.field}>
                                        <span>Dirección *</span>
                                        <input
                                            required
                                            value={form.address}
                                            onChange={(e) => updateField("address", e.target.value)}
                                        />
                                    </label>
                                    <label className={stylesLocal.field}>
                                        <span>Barrio *</span>
                                        <input
                                            required
                                            value={form.neighborhood}
                                            onChange={(e) => updateField("neighborhood", e.target.value)}
                                        />
                                    </label>
                                    <label className={stylesLocal.field}>
                                        <span>Ciudad *</span>
                                        <input
                                            required
                                            value={form.city}
                                            onChange={(e) => updateField("city", e.target.value)}
                                        />
                                    </label>
                                    <label className={stylesLocal.field}>
                                        <span>Precio de venta (COP) *</span>
                                        <input
                                            required
                                            type="number"
                                            min="1"
                                            value={form.price}
                                            onChange={(e) => updateField("price", e.target.value)}
                                        />
                                    </label>
                                    <label className={stylesLocal.field}>
                                        <span>Administración (COP)</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={form.adminFee}
                                            onChange={(e) => updateField("adminFee", e.target.value)}
                                        />
                                    </label>
                                    <label className={stylesLocal.field}>
                                        <span>Habitaciones</span>
                                        <input type="number" min="0" value={form.bedrooms} onChange={(e) => updateField("bedrooms", e.target.value)} />
                                    </label>
                                    <label className={stylesLocal.field}>
                                        <span>Baños</span>
                                        <input type="number" min="0" value={form.bathrooms} onChange={(e) => updateField("bathrooms", e.target.value)} />
                                    </label>
                                    <label className={stylesLocal.field}>
                                        <span>Garajes</span>
                                        <input type="number" min="0" value={form.garages} onChange={(e) => updateField("garages", e.target.value)} />
                                    </label>
                                    <label className={stylesLocal.field}>
                                        <span>Área (m²)</span>
                                        <input type="number" min="0" value={form.area} onChange={(e) => updateField("area", e.target.value)} />
                                    </label>
                                    <label className={stylesLocal.field}>
                                        <span>Estrato</span>
                                        <input type="number" min="1" max="6" value={form.stratum} onChange={(e) => updateField("stratum", e.target.value)} />
                                    </label>
                                    <label className={stylesLocal.field}>
                                        <span>Piso</span>
                                        <input type="number" value={form.floor} onChange={(e) => updateField("floor", e.target.value)} />
                                    </label>
                                    <label className={stylesLocal.field}>
                                        <span>Año construcción</span>
                                        <input type="number" min="1900" max="2100" value={form.year} onChange={(e) => updateField("year", e.target.value)} />
                                    </label>
                                </div>
                            </fieldset>

                            <fieldset className={stylesLocal.fieldset}>
                                <legend>Amenidades</legend>
                                <div className={stylesLocal.amenities}>
                                    {AMENITY_OPTIONS.map((amenity) => (
                                        <label key={amenity} className={stylesLocal.amenityChip}>
                                            <input
                                                type="checkbox"
                                                checked={form.amenities.includes(amenity)}
                                                onChange={() => toggleAmenity(amenity)}
                                            />
                                            <span>{amenity}</span>
                                        </label>
                                    ))}
                                </div>
                            </fieldset>

                            <fieldset className={stylesLocal.fieldset}>
                                <legend>Fotografías *</legend>
                                <p className={stylesLocal.help}>
                                    Sube hasta 12 fotos. Formatos JPG o PNG. Mínimo 1 foto.
                                </p>

                                {existingPhotos.length > 0 && (
                                    <div className={stylesLocal.photoGrid}>
                                        {existingPhotos.map((photo) => (
                                            <figure key={photo.storagePath || photo.url} className={stylesLocal.photoCard}>
                                                <img src={photo.url} alt={photo.name || "Foto del inmueble"} />
                                                <figcaption>Foto enviada</figcaption>
                                            </figure>
                                        ))}
                                    </div>
                                )}

                                <label className={stylesLocal.uploadBox}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handlePhotoChange}
                                    />
                                    <span>Seleccionar fotos</span>
                                </label>

                                {photoPreviewUrls.length > 0 && (
                                    <div className={stylesLocal.photoGrid}>
                                        {photoPreviewUrls.map((url, index) => (
                                            <figure key={url} className={stylesLocal.photoCard}>
                                                <img src={url} alt={`Nueva foto ${index + 1}`} />
                                                <button
                                                    type="button"
                                                    className={stylesLocal.removePhoto}
                                                    onClick={() => removeNewPhoto(index)}
                                                >
                                                    Quitar
                                                </button>
                                            </figure>
                                        ))}
                                    </div>
                                )}
                            </fieldset>

                            {listingStatus && !isRevisionMode && editId && (
                                <p className={stylesLocal.notice}>
                                    Estado actual: {SELL_STATUS_LABELS[listingStatus] || listingStatus}
                                </p>
                            )}

                            {error && <p className={stylesLocal.error}>{error}</p>}

                            <button
                                type="submit"
                                className={stylesLocal.primaryBtn}
                                disabled={submitting || loadingListing}
                            >
                                {submitting
                                    ? "Enviando…"
                                    : isRevisionMode
                                        ? "Reenviar para revisión"
                                        : "Enviar inmueble para revisión"}
                            </button>
                        </form>
                    )}
                </main>
                <AppVersion />
                <FloatingSocial phone="573212080985" placement="bottom" />
            </div>
        </>
    );
}
