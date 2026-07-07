import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import GlobalReset from "../components/GlobalReset";
import SiteTopBar from "../components/SiteTopBar";
import ProfileHeader from "../components/ProfileHeader";
import SellListingAccessGate from "../components/SellListingAccessGate";
import SellListingSuccessPanel from "../components/SellListingSuccessPanel";
import CurrencyAmountField from "../components/CurrencyAmountField";
import AppVersion from "../components/AppVersion";
import FloatingSocial from "../components/FloatingSocial";
import {
    fetchSellListingById,
    resubmitSellListing,
    SELL_LISTING_STATUSES,
    SELL_STATUS_LABELS,
    submitSellListing,
    formatSellListingError,
} from "../services/sellListingService";
import {
    fieldNeedsHighlight,
    fieldsetNeedsHighlight,
    getHighlightedFields,
    getRevisionLabels,
} from "../constants/sellListingRevision";
import { buildSellListingUrl } from "../utils/sellListingLinks";
import { normalizePhotoFiles } from "../utils/normalizePhotoFiles";
import {
    isListingVerified,
    readSellListingTracking,
    saveSellListingTracking,
} from "../utils/sellListingTracking";
import { MONICA_REALTOR_STORE } from "../constants/monicaRealtorStore";
import { AMENITY_OPTIONS, PROPERTY_TYPES, listingToForm } from "../utils/sellListingForm";
import { styles } from "../styles/styles";
import uxStyles from "../components/SellListingUx.module.css";
import stylesLocal from "./SellPropertyPage.module.css";

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
    priceCurrency: "COP",
    adminFee: "",
    adminFeeCurrency: "COP",
    bedrooms: "",
    bathrooms: "",
    garages: "",
    area: "",
    stratum: "",
    floor: "",
    year: "",
    amenities: [],
};

function applyListingState(listing, setters) {
    setters.setForm(listingToForm(listing));
    setters.setExistingPhotos(listing.photos || []);
    setters.setListingStatus(listing.status);
    setters.setRevisionNotes(listing.revisionNotes || "");
    setters.setRevisionChecklist(listing.revisionChecklist || []);
    setters.setAccessCode(listing.accessCode || "");
}

export default function SellPropertyPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get("id");
    const initialView = searchParams.get("view") === "track" ? "track" : "new";

    const [pageView, setPageView] = useState(initialView);
    const [form, setForm] = useState(EMPTY_FORM);
    const [photos, setPhotos] = useState([]);
    const [existingPhotos, setExistingPhotos] = useState([]);
    const [loadingListing, setLoadingListing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(null);
    const [listingStatus, setListingStatus] = useState(null);
    const [revisionNotes, setRevisionNotes] = useState("");
    const [revisionChecklist, setRevisionChecklist] = useState([]);
    const [accessCode, setAccessCode] = useState("");
    const [accessGranted, setAccessGranted] = useState(false);
    const galleryInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    const isRevisionMode = listingStatus === SELL_LISTING_STATUSES.needs_revision;
    const isLockedReview = Boolean(editId) && listingStatus && !isRevisionMode && accessGranted;
    const highlightedFields = useMemo(
        () => getHighlightedFields(isRevisionMode ? revisionChecklist : []),
        [isRevisionMode, revisionChecklist]
    );
    const revisionLabels = useMemo(
        () => getRevisionLabels(revisionChecklist),
        [revisionChecklist]
    );

    const fieldClass = (fieldName) => (
        `${stylesLocal.field}${fieldNeedsHighlight(fieldName, highlightedFields) ? ` ${stylesLocal.fieldHighlight}` : ""}`
    );

    useEffect(() => {
        if (!editId) {
            setAccessGranted(true);
            return;
        }

        if (isListingVerified(editId)) {
            setAccessGranted(true);
        }
    }, [editId]);

    useEffect(() => {
        if (!editId || !accessGranted) return;

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
                applyListingState(listing, {
                    setForm,
                    setExistingPhotos,
                    setListingStatus,
                    setRevisionNotes,
                    setRevisionChecklist,
                    setAccessCode,
                });
                saveSellListingTracking({
                    id: listing.id,
                    accessCode: listing.accessCode || "",
                    email: listing.ownerEmail,
                    phone: listing.ownerPhone,
                    status: listing.status,
                    title: listing.title,
                });
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
    }, [editId, accessGranted]);

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

    const handlePhotoChange = async (event) => {
        try {
            const files = await normalizePhotoFiles(event.target.files);
            if (!files.length) {
                setError("No se pudieron leer las fotos seleccionadas. Prueba con JPG o PNG desde tu galería.");
                return;
            }
            setError("");
            setPhotos((prev) => [...prev, ...files].slice(0, 12));
        } catch {
            setError("No se pudieron procesar las fotos. Intenta con otra imagen.");
        } finally {
            event.target.value = "";
        }
    };

    const removeNewPhoto = (index) => {
        setPhotos((prev) => prev.filter((_, i) => i !== index));
    };

    const handleAccessVerified = (listing) => {
        applyListingState(listing, {
            setForm,
            setExistingPhotos,
            setListingStatus,
            setRevisionNotes,
            setRevisionChecklist,
            setAccessCode,
        });
        setAccessGranted(true);
        setLoadingListing(false);
        saveSellListingTracking({
            id: listing.id,
            accessCode: listing.accessCode || "",
            email: listing.ownerEmail,
            phone: listing.ownerPhone,
            status: listing.status,
            title: listing.title,
        });
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
                priceCurrency: form.priceCurrency,
                adminFee: Number(form.adminFee || 0),
                adminFeeCurrency: form.adminFeeCurrency,
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
                const listing = {
                    id: editId,
                    accessCode,
                    ownerEmail: form.ownerEmail,
                    ownerName: form.ownerName,
                    title: form.title,
                    status: SELL_LISTING_STATUSES.pending,
                };
                saveSellListingTracking({
                    id: editId,
                    accessCode,
                    email: form.ownerEmail,
                    phone: form.ownerPhone,
                    status: SELL_LISTING_STATUSES.pending,
                    title: form.title,
                });
                setSuccess({
                    title: "Correcciones enviadas",
                    message: "Recibimos tu actualización. Mónica revisará nuevamente tu inmueble antes de publicarlo.",
                    listing,
                });
            } else {
                const result = await submitSellListing(payload, photos);
                const listing = {
                    id: result.id,
                    accessCode: result.accessCode,
                    ownerEmail: form.ownerEmail,
                    ownerName: form.ownerName,
                    title: form.title,
                    status: SELL_LISTING_STATUSES.pending,
                };
                saveSellListingTracking({
                    id: result.id,
                    accessCode: result.accessCode,
                    email: form.ownerEmail,
                    phone: form.ownerPhone,
                    status: SELL_LISTING_STATUSES.pending,
                    title: form.title,
                });
                setSuccess({
                    title: "Solicitud recibida",
                    message: `Tu inmueble quedó guardado en ${MONICA_REALTOR_STORE.name}. Entró en revisión y te avisaremos si necesitamos ajustes.`,
                    listing,
                });
                setForm(EMPTY_FORM);
                setPhotos([]);
            }
        } catch (err) {
            setError(formatSellListingError(err));
        } finally {
            setSubmitting(false);
        }
    };

    const tracking = readSellListingTracking();
    const showTabs = !editId && !success;

    return (
        <>
            <GlobalReset />
            <div style={styles.page}>
                <SiteTopBar showNav />
                <main className={stylesLocal.main}>
                    <section className={stylesLocal.hero}>
                        <p className={stylesLocal.eyebrow}>Monica Fritz Realtor · Vender</p>
                        <h1 className={stylesLocal.title}>
                            ¿Quieres vender tu propiedad con una estrategia profesional?
                        </h1>
                        <p className={stylesLocal.lead}>
                            Completa el formulario con la información y fotografías de tu inmueble. Revisaré personalmente tu solicitud para brindarte una asesoría estratégica y definir el mejor plan de comercialización para lograr una venta exitosa.
                        </p>
                    </section>

                    {showTabs && (
                        <div className={uxStyles.pageTabs}>
                            <button
                                type="button"
                                className={pageView === "new" ? uxStyles.pageTabActive : uxStyles.pageTab}
                                onClick={() => setPageView("new")}
                            >
                                Publicar inmueble
                            </button>
                            <button
                                type="button"
                                className={pageView === "track" ? uxStyles.pageTabActive : uxStyles.pageTab}
                                onClick={() => setPageView("track")}
                            >
                                Consultar mi solicitud
                            </button>
                            {tracking?.id && (
                                <Link to={`/vender?id=${tracking.id}`} className={uxStyles.secondaryBtn}>
                                    Retomar última solicitud
                                </Link>
                            )}
                        </div>
                    )}

                    {loadingListing && (
                        <p className={stylesLocal.notice}>Cargando solicitud…</p>
                    )}

                    {editId && !accessGranted && !loadingListing && (
                        <SellListingAccessGate
                            listingId={editId}
                            onVerified={handleAccessVerified}
                            initialEmail={tracking?.email || ""}
                            initialPhone={tracking?.phone || ""}
                            initialAccessCode={tracking?.accessCode || ""}
                        />
                    )}

                    {!editId && pageView === "track" && !success && (
                        <SellListingTracker onStartNew={() => setPageView("new")} />
                    )}

                    {success?.listing && (
                        <SellListingSuccessPanel
                            title={success.title}
                            message={success.message}
                            listing={success.listing}
                            showSendAnother={!isRevisionMode}
                            onSendAnother={() => {
                                setSuccess(null);
                                setPageView("new");
                                navigate("/vender");
                            }}
                        />
                    )}

                    {editId && accessGranted && isRevisionMode && revisionNotes && (
                        <div className={stylesLocal.revisionBox}>
                            <strong>Mónica solicitó estos ajustes</strong>
                            <p>{revisionNotes}</p>
                            {revisionLabels.length > 0 && (
                                <ul className={stylesLocal.revisionChecklist}>
                                    {revisionLabels.map((label) => (
                                        <li key={label}>{label}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {!success && editId && accessGranted && isLockedReview && (
                        <div className={stylesLocal.successBox}>
                            <h2>Solicitud en seguimiento</h2>
                            <p>
                                Tu inmueble está en estado{" "}
                                <strong>{SELL_STATUS_LABELS[listingStatus] || listingStatus}</strong>.
                            </p>
                            <p className={stylesLocal.reference}>Referencia: {editId}</p>
                            <p className={stylesLocal.notice}>
                                Enlace de seguimiento: {buildSellListingUrl(editId)}
                            </p>
                            <div className={stylesLocal.successActions}>
                                <Link to="/" className={stylesLocal.secondaryBtn}>Volver a buscar</Link>
                                <Link to="/vender?view=track" className={stylesLocal.secondaryBtn}>Consultar otra solicitud</Link>
                            </div>
                        </div>
                    )}

                    {!success && accessGranted && (!editId ? pageView === "new" : isRevisionMode) && (
                        <form className={stylesLocal.form} onSubmit={handleSubmit}>
                            <fieldset className={`${stylesLocal.fieldset}${fieldsetNeedsHighlight(["ownerName", "ownerEmail", "ownerPhone"], highlightedFields) ? ` ${stylesLocal.fieldsetHighlight}` : ""}`}>
                                <legend>Datos de contacto</legend>
                                <div className={stylesLocal.grid}>
                                    <label className={fieldClass("ownerName")}>
                                        <span>Nombre completo *</span>
                                        <input
                                            required
                                            value={form.ownerName}
                                            onChange={(e) => updateField("ownerName", e.target.value)}
                                        />
                                    </label>
                                    <label className={fieldClass("ownerEmail")}>
                                        <span>Correo electrónico *</span>
                                        <input
                                            required
                                            type="email"
                                            value={form.ownerEmail}
                                            onChange={(e) => updateField("ownerEmail", e.target.value)}
                                        />
                                    </label>
                                    <label className={fieldClass("ownerPhone")}>
                                        <span>Teléfono / WhatsApp *</span>
                                        <input
                                            required
                                            value={form.ownerPhone}
                                            onChange={(e) => updateField("ownerPhone", e.target.value)}
                                        />
                                    </label>
                                </div>
                            </fieldset>

                            <fieldset className={`${stylesLocal.fieldset}${fieldsetNeedsHighlight(["propertyType", "title", "description", "address", "neighborhood", "city", "price", "adminFee", "bedrooms", "bathrooms", "garages", "area", "stratum", "floor", "year", "amenities"], highlightedFields) ? ` ${stylesLocal.fieldsetHighlight}` : ""}`}>
                                <legend>Información del inmueble</legend>
                                <div className={stylesLocal.grid}>
                                    <label className={fieldClass("propertyType")}>
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
                                    <label className={fieldClass("title")}>
                                        <span>Título del aviso *</span>
                                        <input
                                            required
                                            value={form.title}
                                            onChange={(e) => updateField("title", e.target.value)}
                                            placeholder="Ej. Apartamento en El Poblado"
                                        />
                                    </label>
                                    <label className={`${fieldClass("description")} ${stylesLocal.fieldFull}`}>
                                        <span>Descripción *</span>
                                        <textarea
                                            required
                                            rows={5}
                                            value={form.description}
                                            onChange={(e) => updateField("description", e.target.value)}
                                            placeholder="Describe el inmueble, estado, entorno y condiciones de venta."
                                        />
                                    </label>
                                    <label className={fieldClass("address")}>
                                        <span>Dirección *</span>
                                        <input
                                            required
                                            value={form.address}
                                            onChange={(e) => updateField("address", e.target.value)}
                                        />
                                    </label>
                                    <label className={fieldClass("neighborhood")}>
                                        <span>Barrio *</span>
                                        <input
                                            required
                                            value={form.neighborhood}
                                            onChange={(e) => updateField("neighborhood", e.target.value)}
                                        />
                                    </label>
                                    <label className={fieldClass("city")}>
                                        <span>Ciudad *</span>
                                        <input
                                            required
                                            value={form.city}
                                            onChange={(e) => updateField("city", e.target.value)}
                                        />
                                    </label>
                                    <CurrencyAmountField
                                        label="Precio de venta *"
                                        value={Number(form.price) || 0}
                                        currency={form.priceCurrency}
                                        required
                                        highlight={fieldNeedsHighlight("price", highlightedFields)}
                                        onValueChange={(value) => updateField("price", value ? String(value) : "")}
                                        onCurrencyChange={(value) => updateField("priceCurrency", value)}
                                    />
                                    <CurrencyAmountField
                                        label="Administración"
                                        value={Number(form.adminFee) || 0}
                                        currency={form.adminFeeCurrency}
                                        highlight={fieldNeedsHighlight("adminFee", highlightedFields)}
                                        onValueChange={(value) => updateField("adminFee", value ? String(value) : "")}
                                        onCurrencyChange={(value) => updateField("adminFeeCurrency", value)}
                                    />
                                    <label className={fieldClass("bedrooms")}>
                                        <span>Habitaciones</span>
                                        <input type="number" min="0" value={form.bedrooms} onChange={(e) => updateField("bedrooms", e.target.value)} />
                                    </label>
                                    <label className={fieldClass("bathrooms")}>
                                        <span>Baños</span>
                                        <input type="number" min="0" value={form.bathrooms} onChange={(e) => updateField("bathrooms", e.target.value)} />
                                    </label>
                                    <label className={fieldClass("garages")}>
                                        <span>Garajes</span>
                                        <input type="number" min="0" value={form.garages} onChange={(e) => updateField("garages", e.target.value)} />
                                    </label>
                                    <label className={fieldClass("area")}>
                                        <span>Área (m²)</span>
                                        <input type="number" min="0" value={form.area} onChange={(e) => updateField("area", e.target.value)} />
                                    </label>
                                    <label className={fieldClass("stratum")}>
                                        <span>Estrato</span>
                                        <input type="number" min="1" max="6" value={form.stratum} onChange={(e) => updateField("stratum", e.target.value)} />
                                    </label>
                                    <label className={fieldClass("floor")}>
                                        <span>Piso</span>
                                        <input type="number" value={form.floor} onChange={(e) => updateField("floor", e.target.value)} />
                                    </label>
                                    <label className={fieldClass("year")}>
                                        <span>Año construcción</span>
                                        <input type="number" min="1900" max="2100" value={form.year} onChange={(e) => updateField("year", e.target.value)} />
                                    </label>
                                </div>
                            </fieldset>

                            <fieldset className={`${stylesLocal.fieldset}${fieldsetNeedsHighlight(["amenities"], highlightedFields) ? ` ${stylesLocal.fieldsetHighlight}` : ""}`}>
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

                            <fieldset className={`${stylesLocal.fieldset}${fieldsetNeedsHighlight(["photos"], highlightedFields) ? ` ${stylesLocal.fieldsetHighlight}` : ""}`}>
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

                                <div className={stylesLocal.uploadActions}>
                                    <button
                                        type="button"
                                        className={stylesLocal.uploadActionBtn}
                                        onClick={() => galleryInputRef.current?.click()}
                                    >
                                        Elegir de galería
                                    </button>
                                    <button
                                        type="button"
                                        className={stylesLocal.uploadActionBtn}
                                        onClick={() => cameraInputRef.current?.click()}
                                    >
                                        Tomar foto
                                    </button>
                                </div>

                                <input
                                    ref={galleryInputRef}
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
                                    multiple
                                    className={stylesLocal.hiddenInput}
                                    onChange={handlePhotoChange}
                                />
                                <input
                                    ref={cameraInputRef}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className={stylesLocal.hiddenInput}
                                    onChange={handlePhotoChange}
                                />

                                <p className={stylesLocal.help}>
                                    {photos.length + existingPhotos.length}/12 fotos seleccionadas
                                </p>

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

                    {error && !success && editId && accessGranted && !isRevisionMode && !isLockedReview && (
                        <p className={stylesLocal.error}>{error}</p>
                    )}

                    <footer className={stylesLocal.pageHandle} aria-label="Contacto">
                        <ProfileHeader centered hideTitle showAvatar={false} />
                    </footer>
                </main>
                <AppVersion />
                <FloatingSocial phone="573212080985" placement="bottom" />
            </div>
        </>
    );
}
