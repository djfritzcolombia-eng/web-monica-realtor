# Bot Fritz — Comandos de intervención humana

Guía rápida de la pausa automática 24 h cuando un asesor responde desde el celular / WhatsApp Business (misma cuenta del bot).

---

## Cómo funciona

1. Escribes en un chat de cliente desde el **celular** o la app de WhatsApp Business.
2. El bot detecta tu mensaje (no confunde con sus propias respuestas).
3. Ese chat queda en **pausa 24 horas**.
4. Si el cliente escribe, recibe **una sola vez**:
   > Un asesor te está atendiendo en este momento.  
   > El asistente automático queda en pausa; te responderemos por aquí.
5. Después de ese aviso, el bot **no responde** más en ese chat.
6. Si vuelves a escribir tú, se **renuevan** las 24 horas.
7. Para reactivar antes de que pasen las 24 h, usa `#bot` o `#activar`.

---

## Comandos en el chat del cliente

Escríbelos **desde el celular** en el mismo chat donde quieres controlar el bot:

| Comando | Qué hace |
|---------|----------|
| *(cualquier mensaje tuyo)* | Pausa automática 24 h |
| `#pausa` | Fuerza la pausa 24 h |
| `#yo` | Igual que `#pausa` |
| `#humano` | Igual que `#pausa` |
| `#asesor` | Igual que `#pausa` |
| `#bot` | Reactiva el bot en ese chat |
| `#activar` | Igual que `#bot` |
| `#reanudar` | Igual que `#bot` |

---

## Comandos desde el panel admin

Desde un chat autorizado como administrador:

| Comando | Qué hace |
|---------|----------|
| `admin` o `##fritz` | Menú del panel admin |
| `#pausa 573001234567` | Pausa 24 h ese número |
| `#bot 573001234567` | Reactiva ese número |
| `#activar 573001234567` | Igual que `#bot` + número |
| `#pausados` | Lista los chats en pausa |

---

## Otros comandos admin útiles

| Comando | Qué hace |
|---------|----------|
| `#status` | Estado general del bot |
| `#health` | Salud completa |
| `#wa` | Estado de WhatsApp |
| `#metrics` | Métricas |
| `#users` | Usuarios en memoria |
| `#errors` | Últimos errores |
| `#logs` | Actividad reciente |
| `#whoami` | Tu ID de WhatsApp |
| `#purge` | Depurar datos de prueba (pide confirmación) |
| `#purge si` | Confirmar depuración |

---

## Ejemplos prácticos

**Caso 1 — Intervienes desde el móvil**  
Cliente escribe → tú respondes desde WhatsApp Business → el bot se calla 24 h.

**Caso 2 — Quieres forzar la pausa sin escribirle al cliente**  
En ese chat (o desde admin): `#pausa`

**Caso 3 — Terminaste de atender y quieres que el bot vuelva**  
En ese chat: `#bot`  
O desde admin: `#bot 573001234567`

**Caso 4 — Ver qué chats están pausados**  
Desde admin: `#pausados`

---

## Notas

- La pausa es **por chat** (por cliente), no apaga todo el bot.
- El aviso al cliente se envía **solo una vez** por cada periodo de pausa.
- Tras 24 h sin reactivar, el bot vuelve solo.
- El bot corre en la VM Google Cloud `bot-fritz-30` (`34.45.224.200`).

---

*Bot Fritz 4.0 — Fritz Auto Store / FRITZ MOTORS*  
*Actualizado: julio 2026*
