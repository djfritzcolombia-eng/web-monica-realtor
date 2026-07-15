#!/usr/bin/env python3
"""Guía PDF del Bot Fritz — lenguaje sencillo para el equipo."""
from pathlib import Path

from fpdf import FPDF

FONT = "/Library/Fonts/OpenSans-Regular.ttf"
FONT_B = "/Library/Fonts/OpenSans-Bold.ttf"
FONT_I = "/Library/Fonts/OpenSans-Italic.ttf"

OUTS = [
    Path("/Users/mac/Downloads/GUIA-BOT-FRITZ.pdf"),
    Path("/Users/mac/web-monica-realtor/GUIA-BOT-FRITZ.pdf"),
    Path("/Users/mac/Documents/bot-fritz-30/GUIA-BOT-FRITZ.pdf"),
]


class Guide(FPDF):
    def header(self):
        if self.page_no() == 1:
            return
        self.set_font("OpenSans", "", 8)
        self.set_text_color(140, 140, 140)
        self.set_x(16)
        self.cell(self.epw, 6, "Guía del equipo — Bot Fritz 4.0", align="L")
        self.ln(10)

    def footer(self):
        self.set_y(-14)
        self.set_font("OpenSans", "I", 8)
        self.set_text_color(140, 140, 140)
        self.cell(
            0,
            8,
            f"Fritz Auto Store / FRITZ MOTORS  ·  pág. {self.page_no()}/{{nb}}",
            align="C",
        )


def build():
    pdf = Guide(format="A4")
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_font("OpenSans", "", FONT)
    pdf.add_font("OpenSans", "B", FONT_B)
    pdf.add_font("OpenSans", "I", FONT_I)
    pdf.add_page()
    pdf.set_left_margin(16)
    pdf.set_right_margin(16)

    def width():
        return pdf.epw

    def ensure(needed=36):
        if pdf.get_y() + needed > pdf.h - 22:
            pdf.add_page()
            pdf.set_x(16)

    def h1(text):
        ensure(22)
        pdf.set_x(16)
        pdf.set_font("OpenSans", "B", 15)
        pdf.set_text_color(45, 92, 84)
        pdf.multi_cell(width(), 8, text)
        pdf.ln(2)

    def h2(text):
        ensure(16)
        pdf.set_x(16)
        pdf.set_font("OpenSans", "B", 11)
        pdf.set_text_color(58, 51, 44)
        pdf.multi_cell(width(), 6.5, text)
        pdf.ln(1)

    def p(text, style="", size=10, color=(45, 45, 45)):
        ensure(14)
        pdf.set_x(16)
        pdf.set_font("OpenSans", style, size)
        pdf.set_text_color(*color)
        pdf.multi_cell(width(), 5.4, text)
        pdf.ln(1)

    def bullet(text):
        p(f"  •  {text}")

    def box(title, body, bg=(230, 242, 239)):
        ensure(34)
        x, y = 16, pdf.get_y()
        lines = max(2, body.count("\n") + 1 + len(body) // 95)
        box_h = 10 + lines * 5 + 2
        pdf.set_fill_color(*bg)
        pdf.rect(x, y, width(), box_h, style="F")
        pdf.set_xy(x + 4, y + 2)
        pdf.set_font("OpenSans", "B", 9)
        pdf.set_text_color(45, 92, 84)
        pdf.multi_cell(width() - 8, 5, title)
        pdf.set_x(x + 4)
        pdf.set_font("OpenSans", "", 9)
        pdf.set_text_color(50, 50, 50)
        pdf.multi_cell(width() - 8, 5, body)
        pdf.set_y(y + box_h + 3)
        pdf.set_x(16)

    def flow(steps):
        ensure(len(steps) * 12 + 10)
        for i, step in enumerate(steps):
            pdf.set_x(16)
            pdf.set_fill_color(230, 242, 239)
            bold = i in (0, len(steps) - 1)
            pdf.set_font("OpenSans", "B" if bold else "", 10)
            pdf.set_text_color(45, 92, 84)
            pdf.cell(width(), 8, f"  {step}", fill=True, new_x="LMARGIN", new_y="NEXT")
            if i < len(steps) - 1:
                pdf.set_font("OpenSans", "", 9)
                pdf.set_text_color(150, 150, 150)
                pdf.set_x(16)
                pdf.cell(width(), 4, "            |", new_x="LMARGIN", new_y="NEXT")
                pdf.set_x(16)
                pdf.cell(width(), 4, "            v", new_x="LMARGIN", new_y="NEXT")

    def chat(who, text):
        ensure(22)
        pdf.set_x(16)
        if who == "c":
            bg, label, tc = (232, 240, 254), "Cliente", (30, 60, 120)
        elif who == "a":
            bg, label, tc = (255, 244, 229), "Tú (asesor)", (140, 80, 20)
        else:
            bg, label, tc = (230, 242, 239), "Bot", (45, 92, 84)
        pdf.set_fill_color(*bg)
        pdf.set_font("OpenSans", "B", 8)
        pdf.set_text_color(*tc)
        pdf.cell(width(), 5, f"  {label}", fill=True, new_x="LMARGIN", new_y="NEXT")
        pdf.set_x(16)
        pdf.set_fill_color(*bg)
        pdf.set_font("OpenSans", "", 9)
        pdf.set_text_color(40, 40, 40)
        pdf.multi_cell(width(), 5, f"  {text}", fill=True)
        pdf.ln(1.5)

    def row(cmd, desc, header=False):
        ensure(18)
        pdf.set_x(16)
        c1, c2 = 58, width() - 58
        if header:
            pdf.set_font("OpenSans", "B", 9)
            pdf.set_fill_color(232, 220, 208)
            pdf.set_text_color(40, 40, 40)
            pdf.cell(c1, 7, cmd, border=1, fill=True)
            pdf.cell(c2, 7, desc, border=1, fill=True, new_x="LMARGIN", new_y="NEXT")
            return
        y0 = pdf.get_y()
        x0 = 16
        pdf.set_font("OpenSans", "B", 9)
        pdf.set_text_color(40, 40, 40)
        pdf.set_xy(x0, y0)
        pdf.multi_cell(c1, 5.5, cmd)
        y1 = pdf.get_y()
        pdf.set_xy(x0 + c1, y0)
        pdf.set_font("OpenSans", "", 9)
        pdf.multi_cell(c2, 5.5, desc)
        y2 = pdf.get_y()
        y_end = max(y1, y2, y0 + 7)
        pdf.set_draw_color(200, 190, 180)
        pdf.rect(x0, y0, c1, y_end - y0)
        pdf.rect(x0 + c1, y0, c2, y_end - y0)
        pdf.set_y(y_end)
        pdf.set_x(16)

    # ===== COVER =====
    y = pdf.get_y()
    pdf.set_fill_color(230, 242, 239)
    pdf.rect(16, y, width(), 44, style="F")
    pdf.set_xy(22, y + 7)
    pdf.set_font("OpenSans", "B", 22)
    pdf.set_text_color(45, 92, 84)
    pdf.multi_cell(width() - 12, 10, "Guía del equipo")
    pdf.set_x(22)
    pdf.set_font("OpenSans", "B", 14)
    pdf.multi_cell(width() - 12, 8, "Cómo trabaja el Bot Fritz")
    pdf.set_x(22)
    pdf.set_font("OpenSans", "", 11)
    pdf.set_text_color(70, 70, 70)
    pdf.multi_cell(width() - 12, 6, "Para entenderlo y operarlo día a día  ·  Versión 4.0")
    pdf.set_y(y + 50)

    p(
        "Este documento es para el equipo. Explica qué hace el bot, por qué caminos puede ir un cliente, "
        "qué pasa cuando tú intervienes, y cómo cuidarlo en el día a día. Lenguaje sencillo, con ejemplos "
        "de chat y cajas de “qué pasa por detrás”."
    )
    p("Índice", style="B", size=12, color=(45, 92, 84))
    for line in [
        "1. Qué es este bot",
        "2. El viaje de un mensaje",
        "3. Las piezas del sistema",
        "4. El menú del cliente",
        "5. Camino Amazon (repuestos)",
        "6. Camino taller — Daniel",
        "7. Camino Edwin (nuevos / importación)",
        "8. Cuando quiere las dos cosas",
        "9. Cómo entiende vehículo y pieza",
        "10. Horario y fotos",
        "11. Cuando no hay celular visible",
        "12. Pausa humana (24 h)",
        "13. Panel administrador",
        "14. Operar el bot día a día",
        "15. Mini glosario",
        "15b. Un día típico con el bot",
        "16. Resumen final",
    ]:
        p(line, size=10)

    # 1
    pdf.add_page()
    h1("1. Qué es este bot")
    p(
        "Es el asistente automático de WhatsApp de Fritz Auto Store. Atiende a quien escribe buscando "
        "un repuesto, identificando su vehículo o pidiendo una reparación, y lo conecta con la persona "
        "correcta sin que tenga que repetir la historia."
    )
    p("Dos marcas, según el caso:", style="B")
    bullet("Fritz Auto Store — la línea de WhatsApp: ventas, repuestos, búsquedas.")
    bullet("FRITZ MOTORS — el taller físico: mecánica, latonería, pintura, motores.")
    p("Dos asesores:", style="B")
    bullet("Edwin Fritz — repuestos nuevos, importaciones, piezas originales.")
    bullet("Daniel Fritz — taller / reparaciones, piezas usadas, carrocería.")
    p(
        "Horario del taller: lunes a sábado, 8am a 6pm (Bogotá). Fuera de horario el bot igual registra "
        "la consulta y avisa que los contactarán cuando abran."
    )
    box(
        "Qué pasa por detrás",
        "El bot guarda por cada cliente un archivito con lo que ya sabe (vehículo, qué pidió, si hay pausa). "
        "Así no pregunta dos veces lo mismo.",
    )

    # 2
    h1("2. El viaje de un mensaje")
    p("Imagina una cadena pasando un papel de mano en mano:")
    pdf.ln(1)
    flow(
        [
            "1. El cliente escribe por WhatsApp",
            "2. El puente recibe el mensaje (y fotos si hay)",
            "3. El cerebro decide qué camino seguir",
            "4. Si hace falta, pide ayuda a la inteligencia artificial",
            "5. Responde… o calla si un humano ya tomó el chat",
        ]
    )
    pdf.ln(2)
    p(
        "Si TÚ escribes desde el teléfono en ese chat, el puente avisa: “aquí entró un humano” y se activa la pausa.",
        style="I",
        color=(140, 80, 20),
    )
    box(
        "Qué pasa por detrás",
        "El puente y el cerebro viven en la misma máquina. Se hablan por una puerta interna. "
        "Tú no ves eso: solo ves WhatsApp.",
        bg=(255, 244, 229),
    )

    # 3
    h1("3. Las piezas del sistema (en castellano)")
    pieces = [
        ("El puente de WhatsApp", "Es la puerta. Recibe lo que llega y entrega lo que el bot responde."),
        ("El cerebro (motor)", "Lee el mensaje y elige: menú, buscar, taller, asesor, o preguntar algo."),
        ("La memoria", "Recuerda el vehículo, el estado de la charla y si el chat está en pausa."),
        ("Las reglas rápidas", "Reconocen cosas simples: hola, menú, sí, no, taller… sin gastar IA."),
        ("El extractor", "Saca de la frase la pieza y el vehículo (marca, modelo, año)."),
        ("La inteligencia (Gemini)", "Entra solo cuando el mensaje es confuso o mezcla varias cosas."),
        ("La búsqueda Amazon", "Busca el repuesto y muestra hasta 3 opciones con precio en pesos."),
        ("Las notificaciones", "Avisa a Daniel o a Edwin por WhatsApp con el resumen del cliente."),
        ("La pausa humana", "Calla al bot cuando tú tomas el chat, por 24 horas."),
        ("El panel admin", "Comandos con # para ver estado, métricas o pausar/reactivar."),
    ]
    for title, body in pieces:
        ensure(20)
        y = pdf.get_y()
        pdf.set_fill_color(230, 242, 239)
        pdf.rect(16, y, width(), 16, style="F")
        pdf.set_xy(20, y + 2)
        pdf.set_font("OpenSans", "B", 9)
        pdf.set_text_color(45, 92, 84)
        pdf.cell(width() - 8, 5, title, new_x="LMARGIN", new_y="NEXT")
        pdf.set_x(20)
        pdf.set_font("OpenSans", "", 9)
        pdf.set_text_color(50, 50, 50)
        pdf.multi_cell(width() - 8, 4.5, body)
        pdf.set_y(y + 17)
        pdf.set_x(16)

    # 4
    h1("4. El menú que ve el cliente")
    p("Cuando alguien saluda o escribe 0, el bot muestra algo así:")
    chat("b", "¡Hola María! Somos Fritz Auto Store")
    chat(
        "b",
        "1 Buscar repuesto (ya tengo el vehículo)\n"
        "2 Identificar vehículo (foto del VIN)\n"
        "3 Repuesto + vehículo en un mensaje\n"
        "4 Cambiar de vehículo\n"
        "5 Hablar con un asesor\n"
        "6 Reparaciones / taller",
    )
    p(
        "También puede escribir libre, por ejemplo: pastillas de freno Mercedes C180 2019. "
        "En muchos mensajes aparece un pie: 0 Menú · 4 Cambiar vehículo · 5 Asesores.",
        style="I",
        size=9,
        color=(100, 100, 100),
    )
    h2("Qué hace cada opción del menú")
    bullet("1 — Si ya hay vehículo, pide la pieza; si no, pide el vehículo.")
    bullet("2 — Espera foto del VIN o del tablero.")
    bullet("3 — Pide todo en un solo mensaje.")
    bullet("4 — Olvida el vehículo anterior y pide uno nuevo.")
    bullet("5 — Muestra contactos de Edwin y Daniel + ubicación del taller.")
    bullet("6 — Entra al flujo de taller: vehículo + qué le pasa.")

    # 5
    h1("5. Camino Amazon (repuestos nuevos)")
    p("Sirve cuando el cliente quiere un repuesto y ya (o casi) sabemos el vehículo.")
    p("Paso a paso:", style="B")
    bullet("El cliente da la pieza y el vehículo (menú 1 o 3, o texto libre).")
    bullet("El bot confirma: ¿Es correcto? sí / no.")
    bullet("Si dice sí, busca y muestra hasta 3 resultados (título, precio en pesos, enlace).")
    bullet("Pregunta: ¿Te sirvió? sí / otro repuesto / 5 asesor.")
    bullet("Si no hay resultados, avisa y deriva a Edwin (importación).")
    p("Ejemplo de conversación:", style="B")
    chat("c", "pastillas de freno Mercedes C180 2019")
    chat("b", "Confirmo: pastillas de freno / Mercedes C180 2019 — ¿sí o no?")
    chat("c", "sí")
    chat("b", "[3 opciones en Amazon con precio] + ¿Te sirvió?")
    chat("c", "sí")
    chat("b", "¡Excelente! ¿Otro repuesto o 0 para el menú?")
    box(
        "Qué pasa por detrás",
        "Antes de buscar, el bot confirma para no gastar una búsqueda en vano. "
        "Guarda pieza y vehículo en la memoria del cliente.",
    )

    # 6
    h1("6. Camino taller — Daniel (FRITZ MOTORS)")
    p(
        "Se activa con el menú 6, o cuando el cliente habla de síntomas o reparaciones: "
        "no prende, golpe, pintura, falla eléctrica… También piezas usadas o de carrocería "
        "(puerta, guardabarro, usado…)."
    )
    bullet("El cliente recibe una tarjeta: consulta recibida + taller + Daniel + ubicación/Waze + horario.")
    bullet("Daniel recibe por WhatsApp un resumen con lo que pidió el cliente y cómo contactarlo.")
    bullet(
        "El chat queda en modo “después del asesor”: puede dar más detalles sin que el bot se vaya a Amazon por error."
    )
    p("Ejemplo:", style="B")
    chat("c", "Mi Mercedes A200 2017 no prende")
    chat("b", "Consulta recibida — FRITZ MOTORS — Daniel te escribe en breve + ubicación del taller")
    box(
        "Qué pasa por detrás",
        "Daniel recibe un lead por WhatsApp con el resumen. El cliente no tiene que repetir la historia.",
    )

    # 7
    h1("7. Camino Edwin (repuestos nuevos / importación)")
    p(
        "Se activa con palabras como nuevo, original, OEM, importado, o cuando Amazon no encuentra nada."
    )
    bullet("El cliente ve una confirmación corta.")
    bullet("Edwin recibe el lead completo por WhatsApp.")
    p("Ejemplo:", style="B")
    chat("c", "Necesito un filtro de aceite original para Toyota Corolla 2018")
    chat("b", "Consulta recibida — Fritz Auto Store — Edwin · repuestos nuevos")

    # 8
    h1("8. Cuando quiere las dos cosas")
    p("Si el mensaje mezcla repuesto y reparación, el bot pregunta qué prefiere primero:")
    bullet("repuesto — búsqueda / Amazon")
    bullet("taller — FRITZ MOTORS")
    chat("c", "Necesito pastillas y también revisar el ruido del motor")
    chat("b", "¿Qué prefieres primero? repuesto o taller")
    box(
        "Qué pasa por detrás",
        "El planificador junta lo que ya sabe (pieza, problema, vehículo) y hace una sola pregunta por turno.",
        bg=(232, 240, 254),
    )

    # 9
    h1("9. Cómo entiende el vehículo y la pieza")
    bullet("Por texto: marca, modelo, año.")
    bullet("Por VIN (17 caracteres): lo decodifica y muestra una ficha.")
    bullet("Por foto: intenta leer el VIN o el tablero y luego pide el repuesto.")
    bullet("Va juntando datos de a poco: una pregunta por turno, sin repetir lo que ya sabe.")
    p("Ejemplo con foto:", style="B")
    chat("c", "[envía foto del VIN]")
    chat("b", "Vehículo identificado: … ¿Qué repuesto necesitas?")

    # 10
    h1("10. Horario y fotos")
    p("Horario del taller: lunes a sábado, 8am a 6pm (Bogotá). Domingo cerrado.")
    p(
        "Fuera de horario, en las derivaciones añade: “Consulta registrada. Te contactamos en horario de atención.” "
        "El lead igual llega al asesor."
    )
    p(
        "Fotos: el puente descarga la imagen y el bot intenta leer el vehículo. "
        "Si no puede, pide otra foto o que escriban marca, modelo y año."
    )

    # 11
    h1("11. Cuando WhatsApp no da el celular")
    p("A veces WhatsApp solo da un ID interno. Entonces:")
    bullet("Se avisa al asesor que busque el chat por el nombre.")
    bullet("Al cliente se le pide confirmar el celular (ej. 300 663 6377).")
    bullet("Cuando lo confirma, se reenvía el lead con el número real.")
    box(
        "Qué pasa por detrás",
        "El bot intenta siempre guardar el teléfono real del cliente en su memoria, "
        "para que Edwin o Daniel puedan escribirle fácil.",
        bg=(255, 244, 229),
    )

    # 12
    h1("12. Pausa humana (24 horas)")
    p("Hay dos formas de activarla:", style="B")
    bullet("Automática: cualquier mensaje tuyo desde el móvil en ese chat.")
    bullet("Manual: #pausa, #yo, #humano o #asesor.")
    p("Para volver:", style="B")
    bullet("#bot, #activar o #reanudar en el chat.")
    bullet("O desde admin: #bot 57300… / #activar 57300…")
    bullet("#pausados para ver la lista.")
    p("Comportamiento con el cliente:", style="B")
    bullet("Primer mensaje del cliente en pausa: un aviso.")
    bullet("Siguientes mensajes: silencio.")
    bullet("A las 24 h: el bot vuelve solo.")
    p("Ejemplo completo:", style="B")
    chat("c", "Busco pastillas para un Kia Rio 2019")
    chat("b", "Confirmo búsqueda… ¿sí o no?")
    chat("a", "Hola, soy Edwin, ya te ayudo con eso")
    chat("b", "(el bot se pausa en silencio)")
    chat("c", "¿Siguen ahí?")
    chat("b", "Un asesor te está atendiendo… (solo esta vez)")
    chat("c", "ok gracias")
    chat("b", "(silencio)")
    chat("a", "#bot")
    p("A partir de ahí el bot vuelve a atender ese chat.", style="I", size=9)
    box(
        "Truco del equipo",
        "Si vas a atender varios chats seguidos, mira #pausados para no olvidar cuál sigue en silencio. "
        "Cuando termines, reactiva con #bot para que el automático vuelva a ayudar.",
        bg=(255, 244, 229),
    )

    # 13
    h1("13. Panel administrador")
    p("Solo funciona si tu número está autorizado. Escribes admin, ##fritz, o cualquier #comando.")
    p("Lo más útil día a día:", style="B")
    bullet("#status / #health — ¿está vivo? ¿WhatsApp conectado?")
    bullet("#pausados — ¿en qué chats estás atendiendo tú?")
    bullet("#pausa / #bot con número — controlar un chat a distancia")
    bullet("#whoami — si el bot no te reconoce como admin")
    bullet("#purge si — solo en pruebas; borra memorias y métricas")
    pdf.ln(1)
    p("Tabla rápida del panel:", style="B")
    row("Comando", "Para qué sirve", header=True)
    row("#status", "Bot activo, WhatsApp, mensajes, reinicios")
    row("#health", "Uptime, errores, usuarios, Gemini")
    row("#wa", "Bridge: conectado / proceso / reconexión")
    row("#metrics", "Mensajes, búsquedas, derivaciones")
    row("#users", "Cuántos clientes hay en memoria")
    row("#pausados", "Chats donde el bot está callado")
    row("#pausa 57…", "Forzar pausa 24 h a un número")
    row("#bot 57…", "Reactivar el bot en ese número")
    row("#whoami", "Ver tu ID y si eres admin")
    row("#purge si", "Limpiar entorno de pruebas")

    # 14
    h1("14. Operar el bot día a día")
    p(
        "El bot debe estar siempre en marcha (proceso fritz-bot). "
        "Si algo falla, el monitor intenta reiniciarlo solo."
    )
    bullet("Para ver si está vivo: revisa el health en el puerto 3002.")
    bullet("Si WhatsApp se desconecta, puede hacer falta escanear el QR otra vez.")
    bullet("Los chats y lo que recuerda de cada cliente viven en el servidor.")
    bullet("Las métricas y los logs también quedan en el servidor.")
    pdf.ln(1)
    h2("Señales de que todo va bien")
    bullet("PM2 muestra fritz-bot en verde (online).")
    bullet("El health responde status ok.")
    bullet("WhatsApp aparece connected.")
    bullet("Los clientes reciben respuesta en segundos.")
    pdf.ln(1)
    h2("Si algo se ve raro")
    bullet("Cliente no recibe respuesta: mira si ese chat está en #pausados.")
    bullet("Nadie recibe respuesta: revisa #wa y #health.")
    bullet("Te mandan a escanear QR: la sesión de WhatsApp se cayó; vuelve a vincular.")
    bullet("Respuestas raras o cortadas: mira #errors y avisa a quien administra el servidor.")
    box(
        "Qué pasa por detrás",
        "Al reiniciar el bot se corta un momento y vuelve a abrir WhatsApp con la sesión guardada. "
        "Por eso a veces tarda unos segundos en aparecer “conectado”.",
        bg=(232, 240, 254),
    )

    # 15
    h1("15. Mini glosario (sin tecnicismos)")
    row("Palabra", "Qué significa aquí", header=True)
    row("Puente", "El programa que conecta WhatsApp con el bot")
    row("Memoria", "Lo que el bot recuerda de cada cliente")
    row("Lead", "El aviso que le llega a Edwin o Daniel")
    row("Handoff", "Cuando el bot pasa al cliente a un asesor")
    row("Pausa humana", "El bot se calla porque tú tomaste el chat")
    row("VIN", "El número de serie del vehículo (17 caracteres)")
    row("Riel", "Camino claro y rápido (menú, sí/no, pedido obvio)")
    row("Carril libre", "Cuando el mensaje es confuso y entra la IA")
    row("Admin", "Comandos con # solo para números autorizados")
    pdf.ln(2)
    box(
        "Cómo leer este glosario",
        "No necesitas memorizar nombres técnicos. Con saber qué hace cada pieza en la práctica alcanza "
        "para operar el bot y explicar al equipo qué está pasando.",
        bg=(232, 240, 254),
    )

    # 15b día típico
    h1("15b. Un día típico con el bot")
    p("Así se siente el bot en la práctica, de punta a punta:")
    pdf.ln(1)
    p("Mañana", style="B")
    chat("c", "Hola, buenos días")
    chat("b", "¡Hola! Somos Fritz Auto Store… menú 1 a 6")
    chat("c", "3")
    chat("c", "Amortiguadores Mazda 3 2016")
    chat("b", "Confirmo… ¿sí o no?")
    chat("c", "sí")
    chat("b", "[opciones Amazon] ¿Te sirvió?")
    pdf.ln(1)
    p("Mediodía — entra un caso de taller", style="B")
    chat("c", "El carro no prende, es un Chevrolet Spark 2014")
    chat("b", "Consulta recibida — FRITZ MOTORS — Daniel te escribe + ubicación")
    box(
        "Qué pasa por detrás",
        "Daniel ya recibió el lead. Tú puedes escribirle al cliente desde el celular; al hacerlo, "
        "ese chat queda en pausa 24 h para que el bot no se meta en medio.",
        bg=(255, 244, 229),
    )
    p("Tarde — tú tomas un chat", style="B")
    chat("a", "Hola, te escribo yo directamente para cotizarte")
    chat("c", "Perfecto, gracias")
    chat("b", "Un asesor te está atendiendo… (solo si el cliente escribe de nuevo, y una sola vez)")
    pdf.ln(1)
    p("Cierre del día", style="B")
    bullet("Revisa #pausados si quieres ver qué chats siguen en silencio.")
    bullet("Si ya terminaste con alguien, #bot en ese chat.")
    bullet("Si WhatsApp se ve raro, #wa y #health.")

    # 16
    h1("16. Resumen final")
    p(
        "El bot recibe por WhatsApp, entiende si es repuesto, taller o las dos cosas, confirma, "
        "busca o deriva a Edwin/Daniel, y se aparta cuando tú tomas el chat."
    )
    pdf.ln(2)
    flow(
        [
            "Cliente escribe",
            "Puente recibe",
            "Cerebro elige camino",
            "Amazon / Daniel / Edwin / pregunta",
            "O silencio si un humano ya entró",
        ]
    )
    pdf.ln(3)
    p("Quién atiende qué", style="B", size=12, color=(45, 92, 84))
    bullet("Edwin — repuestos nuevos, importaciones, OEM.")
    bullet("Daniel — taller, usados, carrocería.")
    pdf.ln(2)
    p(
        "Taller FRITZ MOTORS: Sector Santiago de Arma, vereda Playa Rica, finca 06, Rionegro. Lun–Sáb 8am–6pm.",
        size=9,
        color=(90, 90, 90),
    )
    pdf.ln(4)
    box(
        "En una frase",
        "Atiende, entiende, confirma, busca o deriva… y se hace a un lado cuando un humano toma el chat.",
        bg=(230, 242, 239),
    )

    data = bytes(pdf.output())
    for path in OUTS:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
    print(f"pages={pdf.page_no()} bytes={len(data)}")
    for path in OUTS:
        print(path)


if __name__ == "__main__":
    build()
