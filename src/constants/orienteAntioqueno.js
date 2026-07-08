/** Municipios del Oriente Antioqueño — IDs verificados con Wasi (region Antioquia). */
export const ORIENTE_ANTIOQUENO_CITIES = [
    { key: "rionegro", label: "Rionegro", id_city: "685" },
    { key: "la-ceja", label: "La Ceja", id_city: "410" },
    { key: "el-retiro", label: "El Retiro", id_city: "677" },
    { key: "el-carmen-de-viboral", label: "El Carmen de Viboral", id_city: "153" },
    { key: "marinilla", label: "Marinilla", id_city: "488" },
    { key: "guarne", label: "Guarne", id_city: "356" },
    { key: "guatape", label: "Guatapé", id_city: "358" },
    { key: "el-penol", label: "El Peñol", id_city: "278" },
    { key: "la-union", label: "La Unión", id_city: "438" },
    { key: "santuario", label: "Santuario", id_city: "800" },
    { key: "cocorna", label: "Cocorná", id_city: "203" },
    { key: "san-rafael", label: "San Rafael", id_city: "770" },
    { key: "sonson", label: "Sonsón", id_city: "833" },
    { key: "montebello", label: "Montebello", id_city: "515" },
    { key: "caldas", label: "Caldas", id_city: "130" },
    { key: "granada", label: "Granada", id_city: "340" },
    { key: "argelia", label: "Argelia", id_city: "58" },
    { key: "abejorral", label: "Abejorral", id_city: "1" },
    { key: "la-pintada", label: "La Pintada", id_city: "1006" },
    { key: "san-vicente", label: "San Vicente", id_city: "773" },
    { key: "san-carlos", label: "San Carlos", id_city: "726" },
    { key: "san-luis", label: "San Luis", id_city: "755" },
    { key: "san-francisco", label: "San Francisco", id_city: "735" },
    { key: "alejandria", label: "Alejandría", id_city: "858621" },
];

export const ORIENTE_CITY_ID_SET = new Set(
    ORIENTE_ANTIOQUENO_CITIES.map((city) => city.id_city)
);
