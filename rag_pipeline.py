import chromadb
from chromadb.utils import embedding_functions
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from modelos import PlantasRegistradas, CatalogoEspecies

# 1. Configuración de ChromaDB con soporte multilingüe
funcion_embedding = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="paraphrase-multilingual-MiniLM-L12-v2")
chroma_client = chromadb.PersistentClient(path="./botanico_vectores")

# # Purgar colección anterior si existe para evitar conflictos de dimensión vectorial
# try:
#     chroma_client.delete_collection(name="manuales_botanicos")
# except Exception:
#     pass

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

def indexar_especie_en_rag(
    especie_nombre: str,
    contenido_documento: str,
    familia: str = "General",
    doc_id: str = None
) -> dict:
    """Indexa literatura técnica de una especie botánica en la colección vectorial de ChromaDB."""
    if not doc_id:
        doc_id = f"doc_custom_{especie_nombre.lower().replace(' ', '_')}_{int(datetime.now(timezone.utc).timestamp())}"
    
    coleccion.upsert(
        documents=[contenido_documento],
        metadatas=[{
            "especie": especie_nombre,
            "categoria": "especie_personalizada",
            "familia": familia
        }],
        ids=[doc_id]
    )
    print(f"✅ [ChromaDB] Literatura RAG indexada para '{especie_nombre}' (ID: {doc_id})")
    return {"doc_id": doc_id, "especie": especie_nombre, "status": "indexado"}

def sincronizar_especies_personalizadas_en_chroma():
    """Garantiza que todas las especies personalizadas en SQLite tengan sus tensores en ChromaDB."""
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

# Sincronizar especies personalizadas existentes
sincronizar_especies_personalizadas_en_chroma()

def normalizar_clave_especie(texto: str) -> str:
    """Extrae la clave canónica de especie para filtrado en ChromaDB (base y personalizadas)."""
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

    # Búsqueda dinámica de especies personalizadas en la base de datos
    try:
        engine = create_engine("sqlite:///botanico.db", connect_args={"check_same_thread": False})
        Session = sessionmaker(bind=engine)
        session = Session()
        especies = session.query(CatalogoEspecies).all()
        stop_words = {"planta", "especie", "para", "como", "arbol", "flor", "hoja", "cultivo", "riego", "jardin"}
        for esp in especies:
            comun = (esp.nombre_comun or "").lower()
            cientifico = (esp.nombre_cientifico or "").lower()
            # Coincidencia directa completa o substring
            if (comun and (comun in t or t in comun)) or (cientifico and (cientifico in t or t in cientifico)):
                res = esp.nombre_comun or esp.nombre_cientifico
                session.close()
                return res
            # Coincidencia por palabra clave significativa
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
    """
    Motor de Razonamiento Agronómico Avanzado: Prioriza la especificidad de la pregunta,
    maneja saludos, filtra temas ajenos y sintetiza la literatura vectorial de ChromaDB.
    """
    q = (consulta or "").lower().strip()

    # 1. Manejo de Saludos
    saludos = ["hola", "hola!", "hola,", "buen dia", "buenos dias", "buenas tardes", "buenas noches", "hey", "saludos"]
    if q in saludos or any(q.startswith(s) for s in ["hola ", "buen dia ", "buenas "]):
        return f"¡Hola! Soy tu asistente botánico experto. Actualmente estoy analizando tu **{especie_nombre}** ('*{nombre_planta}*'). ¿En qué puedo ayudarte con su cuidado, riego o sanidad hoy?"

    # 2. Detección de Fuera de Ámbito (Ej: Autos, tecnología general, cocina, etc.)
    fuera_ambito = ["auto", "coche", "aceite", "motor", "programacion", "python", "receta", "futbol", "película"]
    if any(palabra in q for palabra in fuera_ambito):
        return f"⚠️ Lo que mencionas está fuera de mi área de especialización. Como sistema experto botánico, solo puedo asesorarte sobre el cuidado, plagas, riego y fisiología de tus plantas (especialmente sobre tu **{especie_nombre}**)."

    # 3. Extracción de intenciones específicas de la pregunta
    es_riego = any(w in q for w in ["riego", "regar", "agua", "sed", "seco", "sequia", "humedad", "déficit", "deficit"])
    es_plaga = any(w in q for w in ["plaga", "bicho", "arañuela", "aranuela", "cochinilla", "pulgón", "pulgon", "mosca", "hongo", "manchas", "enfermedad", "oidio", "roya"])
    es_poda = any(w in q for w in ["poda", "podar", "cortar", "ramas"])

    # 4. Construcción de respuesta basada estrictamente en la literatura recuperada
    contexto_literario = ""
    if literatura and len(literatura) > 0:
        # Tomamos los fragmentos más relevantes devueltos por ChromaDB
        contexto_literario = "\n".join([f"- {doc}" for doc in literatura[:2]])

    # Construcción de la respuesta específica según la consulta
    respuesta_base = f"Consultando los manuales botánicos para **{especie_nombre}** ('*{nombre_planta}*'):\n\n{contexto_literario}"

    # Añadir contexto del SED solo si la pregunta está relacionada con riego o estado general
    alerta_sed = ""
    if es_riego and prioridad_riego > 65.0:
        alerta_sed = f"\n\n💧 *Nota del Sistema Experto (SED):* Este ejemplar presenta una **Prioridad de Riego Crítica ({prioridad_riego}%)**, por lo que se aconseja actuar con urgencia."
    elif es_plaga and riesgo_fitosanitario > 65.0:
        alerta_sed = f"\n\n🛡️ *Nota del Sistema Experto (SED):* Se detecta un **Riesgo Fitosanitario Elevado ({riesgo_fitosanitario}%)** en el entorno."

    return f"{respuesta_base}{alerta_sed}"

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
    clave_esp = normalizar_clave_especie(consulta_usuario)
    if clave_esp == "General":
        clave_esp = normalizar_clave_especie(f"{especie_nombre} {nombre_planta}")
    
    query_args = {
        "query_texts": [f"{consulta_usuario} {especie_nombre if clave_esp == 'General' else clave_esp}"],
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