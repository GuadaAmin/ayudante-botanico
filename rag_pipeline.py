import os
import re
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from modelos import PlantasRegistradas, CatalogoEspecies

# ==============================================================================
# BASE DE CONOCIMIENTO BOTÁNICA EN MEMORIA (ALTA EFICIENCIA, CERO CONSUMO PYTORCH)
# ==============================================================================

_BASE_CONOCIMIENTO = []
_INICIALIZADA = False

DOCUMENTOS_BASE = [
    # Especies Regionales y Requerimientos Edáficos
    "El Jacarandá (Jacaranda mimosifolia) requiere suelos profundos, arenosos y bien drenados. El exceso de agua provoca hipoxia y posterior pudrición radicular por hongos del género Phytophthora. No tolera anegamiento persistente.",
    "El Ceibo (Erythrina crista-galli), flor nacional argentina, habita naturalmente zonas ribereñas y tolera suelos hidromórficos o anegamientos temporarios. Es sensible a heladas fuertes prolongadas (menores a -2°C) que dañan sus ramas terminales.",
    "El Lapacho Rosado (Handroanthus impetiginosus) requiere pleno sol y prefiere suelos fértiles y permeables. Hacia fines de invierno entra en reposo hídrico que estimula su floración masiva rosada previa a la brotación de hojas.",
    "El Palo Borracho (Ceiba speciosa) posee un tronco abultado que actúa como reservorio de agua durante sequías severas. Requiere pleno sol, riego bajo a moderado y excelente drenaje para evitar pudrición basal.",
    "La Santa Rita (Bougainvillea spectabilis) prospera con estrés hídrico moderado. El exceso de humedad o abonos ricos en nitrógeno provocan follaje exuberante pero inhiben la floración de sus brácteas de colores vivos.",
    "El Jazmín del Paraguay (Brunfelsia australis) requiere sustratos con pH neutro a ligeramente ácido (5.5 a 6.5) y ricos en materia orgánica. Sus flores cambian de violeta a blanco en tres días con aroma nocturno intenso.",
    "La Rosa de China o Hibisco (Hibiscus rosa-sinensis) precisa riego constante en primavera y verano pero con sustrato bien aireado. En invierno debe reducirse el riego y protegerse de vientos helados.",
    "La Tipa Blanca (Tipuana tipu) es un árbol de porte imponente con flores doradas que tolera sequía moderada y suelos pobres gracias a su capacidad de fijación de nitrógeno mediante nódulos radiculares simbióticos.",
    "La Azalea de Jardín (Rhododendron simsii) es una especie acidófila estricta (pH óptimo 4.5 a 5.5). El riego con aguas duras o alcalinas provoca clorosis férrica inmediata y marchitamiento radicular.",
    
    # Fitosanidad: Plagas y Ácaros
    "La arañuela roja (Tetranychus urticae) prolifera de forma exponencial en ambientes de baja humedad relativa (<40% HR) y temperaturas elevadas (>30°C). Provoca punteaduras blanquecinas en el haz y decoloración foliar. Pulverizar agua eleva la humedad ambiental y frena su reproducción.",
    "La cochinilla algodonosa (Pseudococcidae) se aloja en el envés de hojas y axilas de tallos succionando savia. Produce secreciones azucaradas que favorecen el hongo de la negrilla. Se combate con aplicaciones de jabón potásico y aceite de neem al 2%.",
    "Los pulgones (Aphididae) colonizan los brotes tiernos en primavera, enrollando las hojas y deformando botones florales. El extracto de ajo, infusión de tabaco o purín de ortiga actúan como repelentes orgánicos eficaces.",
    "La mosca blanca (Bemisia tabaci) ataca en ambientes cálidos y protegidos. Sus ninfas debilitan la planta y son vectores de virus fitopatógenos. Se recomienda trampeo cromático amarillo y pulverización con aceite mineral.",

    # Fitosanidad: Hongos y Enfermedades
    "El oídio (hongo blanco pulverulento) se desarrolla con humedad relativa media a alta y temperaturas templadas (20-27°C) con escasa circulación de aire. Se trata mejorando la poda de aireación y aplicando fungicidas a base de azufre o bicarbonato de potasio.",
    "La roya foliar se manifiesta con pústulas anaranjadas o marrones en el envés foliar. Prolifera con mojado foliar persistente. Es fundamental no mojar las hojas durante el riego y desinfectar tijeras de podar.",
    "La podredumbre radicular y del cuello por Phytophthora y Pythium se origina por saturación continuada del suelo (>80% HVS). Las raíces se vuelven pardas y acuosas, impidiendo la absorción de agua a pesar de la tierra húmeda.",
    "La clorosis férrica aparece en hojas apicales con amarillamiento del limbo mientras los nervios permanecen verdes. Se soluciona acidificando el sustrato o aplicando quelatos de hierro (Fe-EDDHA).",

    # Manejo del Riego, Suelo y Estrés Térmico
    "Para mitigar el estrés térmico severo (temperaturas >35°C), se recomienda aplicar riegos profundos al atardecer para evitar la evaporación diurna y proveer malla sombra o mulching orgánico sobre el suelo.",
    "El déficit hídrico severo (<20% HVS) provoca pérdida de presión de turgencia, cierre estomático y colapso celular. Tras un período de sequía prolongada, el riego de recuperación debe ser gradual para no agrietar raíces.",
    "El principio de riego profundo y espaciado estimula el desarrollo de raíces geotrópicas profundas, haciendo a las especies ornamentales y arbóreas mucho más resilientes ante olas de calor.",
    "La poda de formación y limpieza sanitaria debe realizarse a fines de invierno o tras la floración, sellando heridas de más de 2 cm con pasta cicatrizante para prevenir el ingreso de cancros fúngicos."
]

METADATAS_BASE = [
    {"especie": "Jacaranda", "categoria": "especie"},
    {"especie": "Ceibo", "categoria": "especie"},
    {"especie": "Lapacho", "categoria": "especie"},
    {"especie": "Palo Borracho", "categoria": "especie"},
    {"especie": "Santa Rita", "categoria": "especie"},
    {"especie": "Jazmin", "categoria": "especie"},
    {"especie": "Hibisco", "categoria": "especie"},
    {"especie": "Tipa", "categoria": "especie"},
    {"especie": "Azalea", "categoria": "especie"},
    {"especie": "General", "categoria": "plaga"},
    {"especie": "General", "categoria": "plaga"},
    {"especie": "General", "categoria": "plaga"},
    {"especie": "General", "categoria": "plaga"},
    {"especie": "General", "categoria": "hongo"},
    {"especie": "General", "categoria": "hongo"},
    {"especie": "General", "categoria": "hongo"},
    {"especie": "General", "categoria": "fisiologia"},
    {"especie": "General", "categoria": "riego"},
    {"especie": "General", "categoria": "riego"},
    {"especie": "General", "categoria": "riego"},
    {"especie": "General", "categoria": "poda"}
]

IDS_BASE = [
    "doc_jacaranda_1", "doc_ceibo_1", "doc_lapacho_1", "doc_paloborracho_1",
    "doc_santarita_1", "doc_jazmin_1", "doc_hibisco_1", "doc_tipa_1", "doc_azalea_1",
    "doc_aranuela_1", "doc_cochinilla_1", "doc_pulgones_1", "doc_moscablanca_1",
    "doc_oidio_1", "doc_roya_1", "doc_phytophthora_1", "doc_clorosis_1",
    "doc_estres_termico_1", "doc_deficit_hidrico_1", "doc_pautas_riego_1", "doc_poda_sanidad_1"
]

STOP_WORDS = {
    "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "al", "en",
    "con", "sin", "por", "para", "sobre", "entre", "hacia", "hasta", "desde",
    "y", "e", "o", "u", "pero", "aunque", "que", "como", "cual", "cuales", "donde",
    "quien", "quienes", "cuando", "cuanto", "cuanta", "es", "son", "fue", "era", "ser",
    "estar", "esta", "estan", "este", "estos", "estas", "mi", "mis", "tu", "tus",
    "su", "sus", "se", "le", "les", "me", "nos", "te", "lo", "yo", "ella",
    "planta", "plantas", "arbol", "arboles", "hoja", "hojas"
}


def _inicializar_base_conocimiento():
    """Inicializa la base de conocimiento botánica en memoria una sola vez."""
    global _BASE_CONOCIMIENTO, _INICIALIZADA
    if _INICIALIZADA:
        return

    _INICIALIZADA = True
    _BASE_CONOCIMIENTO = []
    for doc_id, doc_texto, meta in zip(IDS_BASE, DOCUMENTOS_BASE, METADATAS_BASE):
        _BASE_CONOCIMIENTO.append({
            "id": doc_id,
            "documento": doc_texto,
            "especie": meta.get("especie", "General"),
            "categoria": meta.get("categoria", "general"),
            "familia": meta.get("familia", "General")
        })

    # Cargar cualquier especie personalizada que ya exista en SQLite
    sincronizar_especies_personalizadas()


def get_chroma_resources():
    """Capa de compatibilidad para inicializar y retornar los documentos en memoria."""
    if not _INICIALIZADA:
        _inicializar_base_conocimiento()
    return _BASE_CONOCIMIENTO


def normalizar_texto(texto: str) -> str:
    """Remueve tildes y pasa a minúsculas para comparaciones semánticas robustas."""
    t = (texto or "").lower()
    t = t.replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u').replace('ü', 'u').replace('ñ', 'n')
    return t


def lematizar_termino(p: str) -> str:
    """Stemmer minimalista en español para flexiones botánicas y de riego."""
    if p.startswith("reg") or p.startswith("rieg"):
        return "rieg"
    if p.startswith("pod"):
        return "pod"
    if p.startswith("humed"):
        return "humed"
    if p.startswith("sec"):
        return "sec"
    if p.startswith("plag"):
        return "plag"
    if p.startswith("hong"):
        return "hong"
    if p.startswith("manch"):
        return "manch"
    if p.startswith("bich"):
        return "plag"
    if p.startswith("suel") or p.startswith("sustrat") or p.startswith("tierr"):
        return "sustrat"
    if p.startswith("temp") or p.startswith("calor") or p.startswith("frio"):
        return "clima"

    if p.endswith("ces") and len(p) > 4:
        return p[:-3] + "z"
    if p.endswith("es") and len(p) > 4:
        return p[:-2]
    if p.endswith("s") and len(p) > 3 and not p.endswith("is"):
        return p[:-1]
    return p


def tokenizar(texto: str) -> list:
    """Extrae palabras clave representativas ignorando stop words y unificando raíces."""
    t_norm = normalizar_texto(texto)
    palabras = re.findall(r'[a-z0-9]{3,}', t_norm)
    return [lematizar_termino(p) for p in palabras if p not in STOP_WORDS]


def buscar_documentos_relevantes(query: str, clave_especie: str = "General", n_results: int = 3) -> list:
    """
    Recupera los manuales botánicos más relevantes por concordancia léxica y especificidad de especie.
    Ejecución ultra liviana (< 1 ms) sin dependencias de PyTorch ni consumo de memoria GPU/RAM.
    """
    _inicializar_base_conocimiento()
    tokens_query = tokenizar(query)
    clave_esp_norm = normalizar_texto(clave_especie) if clave_especie else "general"
    q_norm = normalizar_texto(query)

    scored_docs = []
    terminos_clave = {
        "riego", "regar", "agua", "sustrato", "suelo", "plaga", "hongo", "aranuela",
        "cochinilla", "pulgon", "mosca", "oidio", "roya", "phytophthora", "clorosis",
        "poda", "humedad", "calor", "frio", "ph", "sol", "sombra", "drenaje", "estres",
        "hoja", "flor", "raiz", "bicho", "tallo", "mancha", "amarill"
    }

    for doc in _BASE_CONOCIMIENTO:
        doc_texto = doc["documento"]
        doc_especie_norm = normalizar_texto(doc.get("especie", "General"))
        tokens_doc = tokenizar(doc_texto)

        score = 0.0
        terminos_coincidentes = 0

        # Puntuación por coincidencia de términos entre la consulta y el manual
        for t in tokens_query:
            if t in tokens_doc:
                terminos_coincidentes += 1
                peso = 3.5 if t in terminos_clave else 1.2
                score += peso * (1.0 + (tokens_doc.count(t) * 0.4))

        # Recompensa por mención explícita del nombre de la especie si se menciona en la consulta
        if clave_esp_norm != "general" and (clave_esp_norm in q_norm):
            if clave_esp_norm in doc_especie_norm or doc_especie_norm in clave_esp_norm:
                score += 5.0
                terminos_coincidentes += 1

        # Si hubo coincidencia temática y además es de la misma especie, aplicar bonus de contexto
        es_misma_especie = (clave_esp_norm != "general" and (clave_esp_norm in doc_especie_norm or doc_especie_norm in clave_esp_norm))
        if terminos_coincidentes > 0:
            if es_misma_especie:
                score += 3.0
            elif doc_especie_norm != "general":
                score -= 1.5

        if score > 0:
            scored_docs.append((score, doc_texto))

    scored_docs.sort(key=lambda x: x[0], reverse=True)

    # Solo retornar manuales si hubo al menos una coincidencia real con la consulta
    return [texto for _, texto in scored_docs[:n_results]]


def indexar_especie_en_rag(
    especie_nombre: str,
    contenido_documento: str,
    familia: str = "General",
    doc_id: str = None
) -> dict:
    """Indexa literatura técnica de una especie botánica en la base en memoria."""
    if not _INICIALIZADA:
        _inicializar_base_conocimiento()
    if not doc_id:
        doc_id = f"doc_custom_{especie_nombre.lower().replace(' ', '_')}_{int(datetime.now(timezone.utc).timestamp())}"
    
    # Actualizar si ya existe el doc_id
    for item in _BASE_CONOCIMIENTO:
        if item.get("id") == doc_id:
            item["documento"] = contenido_documento
            item["especie"] = especie_nombre
            item["familia"] = familia
            return {"doc_id": doc_id, "especie": especie_nombre, "status": "actualizado"}

    _BASE_CONOCIMIENTO.append({
        "id": doc_id,
        "documento": contenido_documento,
        "especie": especie_nombre,
        "categoria": "especie_personalizada",
        "familia": familia
    })
    return {"doc_id": doc_id, "especie": especie_nombre, "status": "indexado"}


def sincronizar_especies_personalizadas():
    """Garantiza que todas las especies personalizadas en SQLite estén en la memoria del RAG."""
    try:
        engine = create_engine("sqlite:///botanico.db", connect_args={"check_same_thread": False})
        Session = sessionmaker(bind=engine)
        session = Session()
        especies_cust = session.query(CatalogoEspecies).filter(
            (CatalogoEspecies.es_personalizada == 1) | (CatalogoEspecies.literatura_rag != None)
        ).all()
        for esp in especies_cust:
            if esp.literatura_rag:
                indexar_especie_en_rag(
                    especie_nombre=esp.nombre_comun or esp.nombre_cientifico,
                    contenido_documento=esp.literatura_rag,
                    familia=esp.familia or "General",
                    doc_id=f"doc_custom_cat_{esp.id}"
                )
        session.close()
    except Exception as e:
        print(f"Nota sincronización RAG inicial: {e}")

# Alias para compatibilidad hacia atrás
sincronizar_especies_personalizadas_en_chroma = sincronizar_especies_personalizadas


def normalizar_clave_especie(texto: str) -> str:
    """Extrae la clave canónica de especie para filtrado (base y personalizadas)."""
    t = (texto or "").lower()
    if "lapacho" in t or "handroanthus" in t: return "Lapacho"
    if "jacarand" in t: return "Jacaranda"
    if "ceibo" in t or "erythrina" in t: return "Ceibo"
    if "palo borracho" in t or "ceiba" in t: return "Palo Borracho"
    if "santa rita" in t or "bougainvillea" in t or "buganvilla" in t: return "Santa Rita"
    if "jazm" in t or "brunfelsia" in t: return "Jazmin"
    if "hibisc" in t or "rosa de china" in t: return "Hibisco"
    if "tipa" in t or "tipuana" in t: return "Tipa"
    if "azalea" in t or "rhododendron" in t: return "Azalea"

    try:
        engine = create_engine("sqlite:///botanico.db", connect_args={"check_same_thread": False})
        Session = sessionmaker(bind=engine)
        session = Session()
        especies = session.query(CatalogoEspecies).all()
        stop_words = {"planta", "especie", "para", "como", "arbol", "flor", "hoja", "cultivo", "riego", "jardin"}
        for esp in especies:
            comun = (esp.nombre_comun or "").lower()
            cientifico = (esp.nombre_cientifico or "").lower()
            if (comun and (comun in t or t in comun)) or (cientifico and (cientifico in t or t in cientifico)):
                res = esp.nombre_comun or esp.nombre_cientifico
                session.close()
                return res
            palabras = [w for w in (comun + " " + cientifico).split() if len(w) >= 4 and w not in stop_words]
            if any(palabra in t for palabra in palabras):
                res = esp.nombre_comun or esp.nombre_cientifico
                session.close()
                return res
        session.close()
    except Exception:
        pass

    return "General"


def generar_sintesis_experta(
    consulta: str,
    especie_nombre: str,
    nombre_planta: str,
    prioridad_riego: float,
    riesgo_fitosanitario: float,
    literatura: list
) -> str:
    """Sintetiza la respuesta basándose en intenciones y fragmentos recuperados."""
    q = (consulta or "").lower().strip()

    saludos = ["hola", "hola!", "hola,", "buen dia", "buenos dias", "buenas tardes", "buenas noches", "hey", "saludos"]
    if q in saludos or any(q.startswith(s) for s in ["hola ", "buen dia ", "buenas "]):
        return f"¡Hola! Soy tu asistente botánico experto. Actualmente estoy analizando tu **{especie_nombre}** ('*{nombre_planta}*'). ¿En qué puedo ayudarte con su cuidado, riego o sanidad hoy?"

    fuera_ambito = [
        "auto", "coche", "aceite", "motor", "programacion", "python", "receta", "futbol",
        "pelicula", "película", "torta", "pastel", "chocolate", "cocina", "cocinar",
        "comida", "musica", "cancion", "politica", "dinero", "dolar", "dolares", "cripto",
        "juego", "videojuego", "partido", "gol"
    ]
    if any(palabra in q for palabra in fuera_ambito):
        return f"Lo que mencionas está fuera de mi área de especialización. Como sistema experto botánico, solo puedo asesorarte sobre el cuidado, plagas, riego y fisiología de tus plantas (especialmente sobre tu **{especie_nombre}**)."

    es_riego = any(w in q for w in ["riego", "regar", "agua", "sed", "seco", "sequia", "humedad", "déficit", "deficit"])
    es_plaga = any(w in q for w in ["plaga", "bicho", "arañuela", "aranuela", "cochinilla", "pulgón", "pulgon", "mosca", "hongo", "manchas", "enfermedad", "oidio", "roya"])

    if not literatura or len(literatura) == 0:
        return f"No localicé directrices botánicas específicas sobre tu consulta ('{consulta}') en los manuales de **{especie_nombre}**. Como sistema experto agronómico, puedo ayudarte con el riego, sustrato, plagas, enfermedades y poda de tus ejemplares."

    contexto_literario = "\n".join([f"- {doc}" for doc in literatura[:2]])
    respuesta_base = f"Consultando los manuales botánicos para **{especie_nombre}** ('*{nombre_planta}*'):\n\n{contexto_literario}"

    alerta_sed = ""
    if es_riego and prioridad_riego > 65.0:
        alerta_sed = f"\n\n*Nota del Sistema Experto (SED):* Este ejemplar presenta una **Prioridad de Riego Crítica ({prioridad_riego}%)**, por lo que se aconseja actuar con urgencia."
    elif es_plaga and riesgo_fitosanitario > 65.0:
        alerta_sed = f"\n\n*Nota del Sistema Experto (SED):* Se detecta un **Riesgo Fitosanitario Elevado ({riesgo_fitosanitario}%)** en el entorno."

    return f"{respuesta_base}{alerta_sed}"


def consultar_asesor(planta_id: int, consulta_usuario: str, prioridad_riego: float = None, riesgo_fitosanitario: float = None):
    """Ejecuta el pipeline RAG ultraliviano combinando el ejemplar, contexto SED y manuales."""
    engine = create_engine("sqlite:///botanico.db", connect_args={"check_same_thread": False})
    Session = sessionmaker(bind=engine)
    session = Session()
    
    planta = session.query(PlantasRegistradas).filter_by(id=planta_id).first()
    if not planta:
        planta = session.query(PlantasRegistradas).first()
        if not planta:
            session.close()
            return {"payload_llm": "Error: Base de datos vacía.", "respuesta_experta": "No se encontraron plantas registradas."}
        
    nombre_planta = planta.alias
    especie_nombre = planta.especie.nombre_comun if planta.especie and planta.especie.nombre_comun else (planta.especie.nombre_cientifico if planta.especie else "Especie regional")
    
    pr_actual = float(prioridad_riego) if (prioridad_riego is not None and prioridad_riego > 0) else float(planta.prioridad_riego_actual or 0.0)
    rf_actual = float(riesgo_fitosanitario) if (riesgo_fitosanitario is not None and riesgo_fitosanitario > 0) else float(planta.indice_riesgo_fitosanitario or 0.0)
    
    estado_sed = f"Ejemplar: {nombre_planta} ({especie_nombre}). Prioridad de riego actual: {pr_actual}%. Riesgo fitosanitario: {rf_actual}%."
    session.close()

    clave_esp = normalizar_clave_especie(consulta_usuario)
    if clave_esp == "General":
        clave_esp = normalizar_clave_especie(f"{especie_nombre} {nombre_planta}")
    
    documentos_recuperados = buscar_documentos_relevantes(
        query=consulta_usuario,
        clave_especie=clave_esp,
        n_results=3
    )

    fragmento_recuperado = "\n- ".join(documentos_recuperados)
    fragmento_recuperado = "- " + fragmento_recuperado if fragmento_recuperado else "No se localizaron manuales específicos."

    system_prompt = f"""Eres un experto agronómico evaluando un ejemplar específico.

Contexto Transaccional del Ejemplar (SED):
{estado_sed}

Literatura Botánica Recuperada (Base de Conocimiento para {especie_nombre}):
{fragmento_recuperado}

Instrucción:
Responde a la consulta del usuario fundamentando tu consejo estrictamente en la literatura botánica recuperada para {especie_nombre}, adaptando la urgencia según el contexto transaccional del SED.
"""

    respuesta_sintetizada = generar_sintesis_experta(
        consulta=consulta_usuario,
        especie_nombre=especie_nombre,
        nombre_planta=nombre_planta,
        prioridad_riego=pr_actual,
        riesgo_fitosanitario=rf_actual,
        literatura=documentos_recuperados
    )

    return {
        "payload_llm": system_prompt,
        "respuesta_experta": respuesta_sintetizada,
        "literatura_recuperada": documentos_recuperados,
        "especie": especie_nombre,
        "planta": nombre_planta,
        "estado_sed": estado_sed
    }
