/* Silueta de referencia — viewBox 360 × 280 */
export const HOUSE_LINE_VIEWBOX = "0 0 360 280";

/* Techo exterior (con aleros) */
export const HOUSE_ROOF_OUTER = "M 54 112 L 180 28 L 306 112";

/* Grosor del techo */
export const HOUSE_ROOF_INNER = "M 78 108 L 180 62 L 282 108";

/* Muros */
export const HOUSE_WALL_LEFT = "M 78 108 L 78 252";
export const HOUSE_WALL_RIGHT = "M 282 108 L 282 252";

/* Chimenea — ladera derecha */
export const HOUSE_CHIMNEY = "M 248 78 L 248 52 L 262 52 L 262 84";

/* Puerta + pasos */
export const HOUSE_DOOR = "M 164 172 L 196 172 L 196 252 L 164 252 Z";
export const HOUSE_STEP_TOP = "M 158 252 L 202 252 L 202 258 L 158 258 Z";
export const HOUSE_STEP_BOTTOM = "M 152 258 L 208 258 L 208 264 L 152 264 Z";
export const HOUSE_DOOR_KNOB = { cx: 174, cy: 210, r: 2.5 };

/* Ventana izquierda (más pequeña, más alta) */
export const HOUSE_WIN_L_FRAME = "M 86 128 L 118 128 L 118 158 L 86 158 Z";
export const HOUSE_WIN_L_CROSS_V = "M 102 128 L 102 158";
export const HOUSE_WIN_L_CROSS_H = "M 86 143 L 118 143";
export const HOUSE_WIN_L_SILL = "M 82 158 L 122 158";

/* Ventana derecha (más grande, más baja) */
export const HOUSE_WIN_R_FRAME = "M 230 148 L 274 148 L 274 188 L 230 188 Z";
export const HOUSE_WIN_R_CROSS_V = "M 252 148 L 252 188";
export const HOUSE_WIN_R_CROSS_H = "M 230 168 L 274 168";
export const HOUSE_WIN_R_SILL = "M 226 188 L 278 188";

/* Suelo y plantas */
export const HOUSE_GROUND = "M 8 264 H 352";
export const HOUSE_PLANT_L1 = "M 22 264 Q 18 252 22 244 Q 26 236 22 228";
export const HOUSE_PLANT_L2 = "M 34 264 Q 30 250 34 242 Q 38 234 34 226";
export const HOUSE_PLANT_R = "M 334 264 Q 338 250 334 242 Q 330 234 334 226";

export const HOUSE_LINE_PATHS = [
    HOUSE_ROOF_OUTER,
    HOUSE_ROOF_INNER,
    HOUSE_WALL_LEFT,
    HOUSE_WALL_RIGHT,
    HOUSE_CHIMNEY,
    HOUSE_DOOR,
    HOUSE_STEP_TOP,
    HOUSE_STEP_BOTTOM,
    HOUSE_WIN_L_FRAME,
    HOUSE_WIN_L_CROSS_V,
    HOUSE_WIN_L_CROSS_H,
    HOUSE_WIN_L_SILL,
    HOUSE_WIN_R_FRAME,
    HOUSE_WIN_R_CROSS_V,
    HOUSE_WIN_R_CROSS_H,
    HOUSE_WIN_R_SILL,
    HOUSE_GROUND,
    HOUSE_PLANT_L1,
    HOUSE_PLANT_L2,
    HOUSE_PLANT_R,
];
