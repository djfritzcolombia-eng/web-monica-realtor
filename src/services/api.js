// src/services/api.js

const BASE_URL = "https://us-central1-view-real-time.cloudfunctions.net/api";
const API_BEARER_TOKEN = import.meta.env.VITE_API_BEARER_TOKEN;

/**
 * Realiza una petición POST genérica a un endpoint.
 * @param {string} endpoint - Ruta final, por ejemplo 'login' o 'sumar'
 * @param {Object} data - Cuerpo del JSON a enviar
 * @return {Promise<Object>} Respuesta con { success, data } o { success, error }
 */
export async function postRequest(endpoint, data) {
  try {
    const headers = { "Content-Type": "application/json" };
    if (API_BEARER_TOKEN) {
      headers.Authorization = `Bearer ${API_BEARER_TOKEN}`;
    }

    const response = await fetch(`${BASE_URL}/${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    const result = await response.json();

    return result;
  } catch (err) {
    console.error("Error de red:", err);
    return {
      success: false,
      error: "Error al conectar con el servidor",
    };
  }
}
