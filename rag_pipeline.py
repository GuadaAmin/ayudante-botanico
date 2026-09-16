import chromadb
from chromadb.utils import embedding_functions
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from modelos import PlantasRegistradas

# 1. Configuración de ChromaDB con soporte multilingüe
funcion_embedding = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="paraphrase-multilingual-MiniLM-L12-v2")
chroma_client = chromadb.PersistentClient(path="./botanico_vectores")

# Purgar colección anterior si existe para evitar conflictos de dimensión vectorial
try:
    chroma_client.delete_collection(name="manuales_botanicos")
except Exception:
    pass

coleccion = chroma_client.get_or_create_collection(
    name="manuales_botanicos",
    embedding_function=funcion_embedding,
    metadata={"hnsw:space": "cosine"} # Corrección técnica: Similitud del coseno
)

# 2. Vectorización de la Base de Conocimiento Especializada (Flora Regional y Fitosanidad)
documentos = [
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

metadatas = [
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

ids = [
    "doc_jacaranda_1", "doc_ceibo_1", "doc_lapacho_1", "doc_paloborracho_1",
    "doc_santarita_1", "doc_jazmin_1", "doc_hibisco_1", "doc_tipa_1", "doc_azalea_1",
    "doc_aranuela_1", "doc_cochinilla_1", "doc_pulgones_1", "doc_moscablanca_1",
    "doc_oidio_1", "doc_roya_1", "doc_phytophthora_1", "doc_clorosis_1",
    "doc_estres_termico_1", "doc_deficit_hidrico_1", "doc_pautas_riego_1", "doc_poda_sanidad_1"
]

coleccion.upsert(documents=documentos, metadatas=metadatas, ids=ids)

def normalizar_clave_especie(texto: str) -> str:
    """Extrae la clave canónica de especie para filtrado en ChromaDB."""
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
    return "General"

def generar_sintesis_experta(
    consulta: str,
    especie_nombre: str,
    nombre_planta: str,
    prioridad_riego: float,
    riesgo_fitosanitario: float,
    literatura: list
) -> str:
    """
    Motor de Razonamiento Agronómico: Sintetiza una respuesta inteligente,
    coherente y redactada en lenguaje natural cruzando la intención de la pregunta
    con los sensores del SED y la literatura de ChromaDB para esa especie.
    """
    q = (consulta or "").lower()
    es_riego = any(w in q for w in ["riego", "regar", "agua", "sed", "seco", "sequia", "humedad", "déficit", "deficit"])
    es_plaga = any(w in q for w in ["plaga", "bicho", "arañuela", "aranuela", "cochinilla", "pulgón", "pulgon", "mosca", "hongo", "manchas", "enfermedad", "oidio", "roya"])
    es_amarillo = any(w in q for w in ["amarill", "clorosis", "hojas secas", "caen", "caída"])
    es_flor = any(w in q for w in ["flor", "florecer", "floracion", "floración", "pimpollos", "yemas"])
    es_poda = any(w in q for w in ["poda", "podar", "cortar", "ramas"])

    # 1. Diagnóstico del estado telemétrico según el SED
    estado_sed_diag = []
    if prioridad_riego > 65.0:
        estado_sed_diag.append(f"Actualmente tu **{especie_nombre}** ('*{nombre_planta}*') presenta una **Prioridad de Riego Crítica ({prioridad_riego}%)**, lo que indica que el contenido hídrico del sustrato está por debajo del umbral de seguridad.")
    elif prioridad_riego > 40.0:
        estado_sed_diag.append(f"Tu **{especie_nombre}** ('*{nombre_planta}*') se encuentra con una **Prioridad de Riego Moderada ({prioridad_riego}%)**, requiriendo seguimiento del sustrato.")
    else:
        estado_sed_diag.append(f"El balance hídrico de tu **{especie_nombre}** ('*{nombre_planta}*') es **Óptimo ({prioridad_riego}%)**.")

    if riesgo_fitosanitario > 75.0:
        estado_sed_diag.append(f"⚠️ Se detecta un **Riesgo Fitosanitario Elevado ({riesgo_fitosanitario}%)**, propiciado por alta humedad ambiental y temperaturas templado-cálidas.")

    diag_intro = " ".join(estado_sed_diag)

    # 2. Respuesta directa fundamentada en la literatura de la especie
    cuerpo_respuesta = ""
    if literatura:
        cuerpo_respuesta = f"De acuerdo con los manuales agronómicos especializados para **{especie_nombre}**:\n\n> *\"{literatura[0]}\"*"

    # 3. Plan de acción específico
    accion = ""
    if es_riego or prioridad_riego > 65.0:
        accion = f"💧 **Plan de Acción Sugerido:** Aplica un riego profundo de recuperación en la zona de goteo de la copa (evitando encharcar la base del tronco). Se recomienda realizarlo al atardecer para favorecer la absorción capilar sin pérdidas por evaporación."
    elif es_plaga or riesgo_fitosanitario > 75.0:
        accion = f"🛡️ **Tratamiento Fitosanitario Recomendado:** Realiza una inspección minuciosa en el envés de las hojas y axilas. Si detectas insectos chupadores o ácaros, pulveriza con una emulsión de jabón potásico y aceite de neem al 2%. Si hay signos de hongos (polvo blanco o pústulas), mejora la ventilación y aplica un fungicida preventivo."
    elif es_amarillo:
        accion = f"🌿 **Manejo de Clorosis:** El amarillamiento foliar suele asociarse a asfixia radicular por exceso de agua o a deficiencia de hierro (clorosis férrica). Verifica que el drenaje sea óptimo y complementa con quelatos de hierro si las nervaduras permanecen verdes."
    elif es_flor:
        accion = f"🌸 **Estimulación Floral:** Para favorecer una floración abundante y evitar la caída prematura de botones, mantén una buena exposición solar directa y evita los fertilizantes con exceso de nitrógeno."
    elif es_poda:
        accion = f"✂️ **Guía de Poda:** Las podas de formación deben ejecutarse hacia finales del reposo invernal o justo después de la floración principal, esterilizando las herramientas para evitar cancros fúngicos."
    else:
        accion = f"🌱 **Recomendación General:** Mantén el régimen actual de monitoreo. Si observas cambios en la turgencia de las hojas o el color de los brotes, ajústalo según las pautas de la especie."

    return f"{diag_intro}\n\n{cuerpo_respuesta}\n\n{accion}"

def consultar_asesor(planta_id: int, consulta_usuario: str, prioridad_riego: float = None, riesgo_fitosanitario: float = None):
    """Ejecuta el pipeline RAG combinando telemetría del SED, filtrado estricto por especie y síntesis experta."""
    
    # 1. Recuperación de contexto relacional en SQLite
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
    
    if prioridad_riego is not None and prioridad_riego > 0:
        pr_actual = float(prioridad_riego)
    else:
        pr_actual = float(planta.prioridad_riego_actual or 0.0)

    if riesgo_fitosanitario is not None and riesgo_fitosanitario > 0:
        rf_actual = float(riesgo_fitosanitario)
    else:
        rf_actual = float(planta.indice_riesgo_fitosanitario or 0.0)
    
    estado_sed = f"Ejemplar: {nombre_planta} ({especie_nombre}). Prioridad de riego actual: {pr_actual}%. Riesgo fitosanitario: {rf_actual}%."
    session.close()

    # 2. Búsqueda semántica con FILTRADO ESTRICTO DE ESPECIE en ChromaDB
    clave_esp = normalizar_clave_especie(f"{especie_nombre} {nombre_planta}")
    
    query_args = {
        "query_texts": [f"{consulta_usuario} {especie_nombre}"],
        "n_results": 3
    }
    
    # Si tenemos una especie identificada, buscar sólo en esa especie o documentos generales
    if clave_esp != "General":
        query_args["where"] = {"$or": [{"especie": clave_esp}, {"especie": "General"}]}

    try:
        resultados_rag = coleccion.query(**query_args)
    except Exception as e:
        # Fallback sin filtro where en caso de sintaxis de versión antigua
        resultados_rag = coleccion.query(query_texts=[f"{consulta_usuario} {especie_nombre}"], n_results=3)

    documentos_recuperados = resultados_rag['documents'][0] if resultados_rag['documents'] else []
    fragmento_recuperado = "\n- ".join(documentos_recuperados)
    fragmento_recuperado = "- " + fragmento_recuperado if fragmento_recuperado else "No se localizaron manuales específicos."

    # 3. Composición del System Prompt para auditoría
    system_prompt = f"""Eres un experto agronómico evaluando un ejemplar específico.

Contexto Transaccional del Ejemplar (SED):
{estado_sed}

Literatura Botánica Recuperada (Base de Conocimiento para {especie_nombre}):
{fragmento_recuperado}

Instrucción:
Responde a la consulta del usuario fundamentando tu consejo estrictamente en la literatura botánica recuperada para {especie_nombre}, adaptando la urgencia según el contexto transaccional del SED.
"""

    # 4. Generación de Respuesta Experta Contextualizada
    respuesta_sintetizada = generar_sintesis_experta(
        consulta=consulta_usuario,
        especie_nombre=especie_nombre,
        nombre_planta=nombre_planta,
        prioridad_riego=pr_actual,
        riesgo_fitosanitario=rf_actual,
        literatura=documentos_recuperados
    )

    print(f"--- RAG ASESOR EJECUTADO PARA '{nombre_planta}' ({especie_nombre}) ---")
    print(f"Pregunta: {consulta_usuario}")
    print(f"Literatura asociada: {len(documentos_recuperados)} fragmentos recuperados.")
    print("---------------------------------------------------------------")

    return {
        "payload_llm": system_prompt,
        "respuesta_experta": respuesta_sintetizada,
        "literatura_recuperada": documentos_recuperados,
        "especie": especie_nombre,
        "planta": nombre_planta,
        "estado_sed": estado_sed
    }

if __name__ == "__main__":
    consulta = "¿Qué consecuencias tiene regar en exceso esta especie?"
    res = consultar_asesor(planta_id=3, consulta_usuario=consulta)
    print("Respuesta Experta generada:")
    print(res["respuesta_experta"])