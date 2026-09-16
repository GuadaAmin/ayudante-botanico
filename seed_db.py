import os
import shutil
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from modelos import (
    Base,
    CatalogoEspecies,
    PlantasRegistradas,
    MedicionesAmbientales,
    BitacoraEventos,
    TareasPendientes,
    AlertasMeteorologicas
)

DB_PATH = "botanico.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"

ESPECIES_REGIONALES = [
    {
        "nombre_comun": "Jacarandá",
        "nombre_cientifico": "Jacaranda mimosifolia",
        "familia": "Bignoniaceae",
        "umbral_temp_min": 5.0,
        "umbral_temp_max": 38.0,
        "req_hidrico_base": 40.0,
        "exposicion_solar": "Pleno Sol",
        "epoca_floracion": "Primavera (Noviembre)",
        "descripcion": "Árbol caducifolio de porte medio con floración violácea espectacular en panículas terminales. Prefiere suelos arenosos, profundos y bien drenados.",
        "imagen_url": "https://images.unsplash.com/photo-1546842931-886c185b4c8c?auto=format&fit=crop&w=800&q=80"
    },
    {
        "nombre_comun": "Ceibo (Flor Nacional)",
        "nombre_cientifico": "Erythrina crista-galli",
        "familia": "Fabaceae",
        "umbral_temp_min": -2.0,
        "umbral_temp_max": 40.0,
        "req_hidrico_base": 60.0,
        "exposicion_solar": "Pleno Sol",
        "epoca_floracion": "Primavera - Verano (Octubre a Febrero)",
        "descripcion": "Árbol ribereño con flores carmesí aterciopeladas dispuestas en racimos. Muy tolerante a suelos hidromórficos y anegamientos temporarios.",
        "imagen_url": "https://images.unsplash.com/photo-1473712453425-001a84125611?auto=format&fit=crop&w=800&q=80"
    },
    {
        "nombre_comun": "Lapacho Rosado",
        "nombre_cientifico": "Handroanthus impetiginosus",
        "familia": "Bignoniaceae",
        "umbral_temp_min": 2.0,
        "umbral_temp_max": 39.0,
        "req_hidrico_base": 35.0,
        "exposicion_solar": "Pleno Sol",
        "epoca_floracion": "Fines de Invierno (Agosto a Septiembre)",
        "descripcion": "Árbol de porte majestuoso con floración masiva rosada que precede a la foliación. Resistente a sequías moderadas, requiere buena insolación.",
        "imagen_url": "https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?auto=format&fit=crop&w=800&q=80"
    },
    {
        "nombre_comun": "Palo Borracho",
        "nombre_cientifico": "Ceiba speciosa",
        "familia": "Malvaceae",
        "umbral_temp_min": -1.0,
        "umbral_temp_max": 42.0,
        "req_hidrico_base": 30.0,
        "exposicion_solar": "Pleno Sol",
        "epoca_floracion": "Verano - Otoño (Febrero a Abril)",
        "descripcion": "Tronco abultado adaptado para reserva hídrica con aguijones cónicos. Flores vistosas rosadas con centro blanco-amarillento.",
        "imagen_url": "https://images.unsplash.com/photo-1556886955-13c51410cd17?auto=format&fit=crop&w=800&q=80"
    },
    {
        "nombre_comun": "Santa Rita / Buganvilla",
        "nombre_cientifico": "Bougainvillea spectabilis",
        "familia": "Nyctaginaceae",
        "umbral_temp_min": 3.0,
        "umbral_temp_max": 42.0,
        "req_hidrico_base": 30.0,
        "exposicion_solar": "Pleno Sol",
        "epoca_floracion": "Primavera - Otoño",
        "descripcion": "Arbusto trepador leñoso con brácteas fucsias intensas muy decorativas. Requiere riego moderado a bajo; el exceso de agua frena su floración.",
        "imagen_url": "https://images.unsplash.com/photo-1589244159943-460088ed5c92?auto=format&fit=crop&w=800&q=80"
    },
    {
        "nombre_comun": "Jazmín del Paraguay",
        "nombre_cientifico": "Brunfelsia australis",
        "familia": "Solanaceae",
        "umbral_temp_min": 2.0,
        "umbral_temp_max": 36.0,
        "req_hidrico_base": 50.0,
        "exposicion_solar": "Media Sombra",
        "epoca_floracion": "Primavera (Septiembre a Noviembre)",
        "descripcion": "Arbusto perenne con fragantes corolas que mutan de violeta a lila y finalmente blanco en tres días. Requiere sustrato fértil con buen drenaje.",
        "imagen_url": "https://images.unsplash.com/photo-1557925923-cd4648e211a0?auto=format&fit=crop&w=800&q=80"
    },
    {
        "nombre_comun": "Rosa de China / Hibisco",
        "nombre_cientifico": "Hibiscus rosa-sinensis",
        "familia": "Malvaceae",
        "umbral_temp_min": 4.0,
        "umbral_temp_max": 38.0,
        "req_hidrico_base": 45.0,
        "exposicion_solar": "Pleno Sol",
        "epoca_floracion": "Primavera - Verano",
        "descripcion": "Arbusto floral con grandes corolas rojas y columna estaminal prominente. Requiere protección frente a heladas invernales.",
        "imagen_url": "https://images.unsplash.com/photo-1557925923-cd4648e211a0?auto=format&fit=crop&w=800&q=80"
    },
    {
        "nombre_comun": "Tipa Blanca",
        "nombre_cientifico": "Tipuana tipu",
        "familia": "Fabaceae",
        "umbral_temp_min": 0.0,
        "umbral_temp_max": 40.0,
        "req_hidrico_base": 40.0,
        "exposicion_solar": "Pleno Sol",
        "epoca_floracion": "Fines de Primavera (Diciembre)",
        "descripcion": "Gran árbol de copa extendida con profusa floración dorada en racimos. Gran fijador de nitrógeno y tolerante a condiciones urbanas.",
        "imagen_url": "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80"
    },
    {
        "nombre_comun": "Azalea de Jardín",
        "nombre_cientifico": "Rhododendron simsii",
        "familia": "Ericaceae",
        "umbral_temp_min": -3.0,
        "umbral_temp_max": 32.0,
        "req_hidrico_base": 55.0,
        "exposicion_solar": "Media Sombra",
        "epoca_floracion": "Primavera",
        "descripcion": "Arbusto acidófilo de follaje tupido y abundante floración en matices rosa y carmín. Requiere pH de suelo entre 4.5 y 5.5.",
        "imagen_url": "https://images.unsplash.com/photo-1596726914563-95244199c0d3?auto=format&fit=crop&w=800&q=80"
    }
]

def seed_database():
    """Inicializa la base de datos limpia con todas las tablas y siembra los datos."""
    print("Iniciando creación de tablas y siembra de datos...")
    
    # Si la base de datos previa existe, respaldarla
    if os.path.exists(DB_PATH):
        shutil.copyfile(DB_PATH, f"{DB_PATH}.bak")
        os.remove(DB_PATH)
        print(" [+] Respaldo de base previa creado y base reinicializada con nuevo esquema.")

    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()

    try:
        # 1. Sembrar Catálogo de Especies
        especies_map = {}
        for esp_data in ESPECIES_REGIONALES:
            nueva_esp = CatalogoEspecies(**esp_data)
            session.add(nueva_esp)
            session.flush()
            especies_map[esp_data["nombre_cientifico"]] = nueva_esp
            print(f" [+] Especie insertada: {esp_data['nombre_comun']} ({esp_data['nombre_cientifico']})")

        session.commit()

        # 2. Sembrar Ejemplares Monitoreados (Alineados 1 a 1 con frontend)
        plantas_iniciales = [
            {
                "id": 1,
                "especie": especies_map["Jacaranda mimosifolia"],
                "alias": "Jacaranda 1",
                "ubicacion": "Cantero Central - Sector A",
                "prioridad_riego": 81.37,
                "riesgo_fitosanitario": 70.0,
                "telemetria": {"hvs": 25.0, "ta": 35.0, "hr": 40.0}
            },
            {
                "id": 2,
                "especie": especies_map["Ceiba speciosa"],
                "alias": "Ceiba 2 (Palo Borracho)",
                "ubicacion": "Cantero Central - Glorieta",
                "prioridad_riego": 25.0,
                "riesgo_fitosanitario": 68.5,
                "telemetria": {"hvs": 78.0, "ta": 24.2, "hr": 86.4}
            },
            {
                "id": 3,
                "especie": especies_map["Handroanthus impetiginosus"],
                "alias": "Lapacho Rosado",
                "ubicacion": "Sector Sur - Parque Abierto",
                "prioridad_riego": 69.2,
                "riesgo_fitosanitario": 25.0,
                "telemetria": {"hvs": 22.1, "ta": 28.4, "hr": 46.0}
            },
            {
                "id": 4,
                "especie": especies_map["Tipuana tipu"],
                "alias": "Tipa 1",
                "ubicacion": "Lindero Este - Cortina de Sombreo",
                "prioridad_riego": 15.0,
                "riesgo_fitosanitario": 12.0,
                "telemetria": {"hvs": 52.0, "ta": 24.0, "hr": 58.0}
            },
            {
                "id": 5,
                "especie": especies_map["Bougainvillea spectabilis"],
                "alias": "Santa Rita Pérgola",
                "ubicacion": "Pérgola Este - Jardín de Entrada",
                "prioridad_riego": 22.0,
                "riesgo_fitosanitario": 15.0,
                "telemetria": {"hvs": 42.0, "ta": 26.5, "hr": 52.0}
            },
            {
                "id": 6,
                "especie": especies_map["Erythrina crista-galli"],
                "alias": "Ceibo Ribereño",
                "ubicacion": "Borde de Laguna - Sector Este",
                "prioridad_riego": 40.0,
                "riesgo_fitosanitario": 20.0,
                "telemetria": {"hvs": 60.0, "ta": 25.0, "hr": 65.0}
            },
            {
                "id": 7,
                "especie": especies_map["Brunfelsia australis"],
                "alias": "Jazmín Patio Sombra",
                "ubicacion": "Patio de Media Sombra - Cantero 4",
                "prioridad_riego": 32.0,
                "riesgo_fitosanitario": 84.5,
                "telemetria": {"hvs": 88.0, "ta": 31.0, "hr": 86.0}
            }
        ]

        now = datetime.now(timezone.utc)

        for p_info in plantas_iniciales:
            planta = PlantasRegistradas(
                id=p_info["id"],
                especie_id=p_info["especie"].id,
                alias=p_info["alias"],
                ubicacion=p_info["ubicacion"],
                prioridad_riego_actual=p_info["prioridad_riego"],
                indice_riesgo_fitosanitario=p_info["riesgo_fitosanitario"]
            )
            session.add(planta)
            session.flush()
            print(f" [+] Ejemplar registrado: {p_info['alias']}")

            # Registrar telemetría
            tel = p_info["telemetria"]
            medicion = MedicionesAmbientales(
                planta_id=planta.id,
                humedad_sustrato=tel["hvs"],
                temperatura_ambiental=tel["ta"],
                humedad_relativa=tel["hr"],
                fecha=now
            )
            session.add(medicion)

            # Bitácora de siembra
            evento_siembra = BitacoraEventos(
                planta_id=planta.id,
                tipo_evento="REGISTRO_INICIAL",
                fecha=now - timedelta(days=30),
                observaciones=f"Incorporación de {planta.alias} ({p_info['especie'].nombre_cientifico}) al jardín botánico."
            )
            session.add(evento_siembra)

            # Triggers de Tareas y Alertas
            if p_info["prioridad_riego"] > 65.0:
                tarea = TareasPendientes(
                    planta_id=planta.id,
                    tipo_tarea="REGAR",
                    estado_tarea="PENDIENTE",
                    fecha_generacion=now
                )
                session.add(tarea)
                print(f" [!] Tarea de riego creada para: {planta.alias} (PR={p_info['prioridad_riego']}%)")

            if p_info["riesgo_fitosanitario"] > 75.0:
                alerta = AlertasMeteorologicas(
                    planta_id=planta.id,
                    severidad="CRITICA",
                    mensaje=f"Riesgo fitosanitario elevado ({p_info['riesgo_fitosanitario']}%). Alta humedad y calor propician hongos.",
                    fecha_expiracion=now + timedelta(days=3)
                )
                session.add(alerta)
                print(f" [!] Alerta fitosanitaria creada para: {planta.alias} (RF={p_info['riesgo_fitosanitario']}%)")

        session.commit()
        print("Migración y siembra de datos completada exitosamente.")

    except Exception as e:
        session.rollback()
        print(f"Error durante la siembra de base de datos: {e}")
        raise e
    finally:
        session.close()

if __name__ == "__main__":
    seed_database()
