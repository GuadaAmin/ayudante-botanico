from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from modelos import Base, CatalogoEspecies, PlantasRegistradas, MedicionesAmbientales, TareasPendientes, AlertasMeteorologicas
from motor_difuso import evaluar_estado_planta

# Configuración de sesión de base de datos
engine = create_engine("sqlite:///botanico.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
session = SessionLocal()

def ejecutar_ciclo_operativo():
    # 1. Setup inicial (Mocking de catálogo e inventario)
    especie = session.query(CatalogoEspecies).first()
    if not especie:
        especie = CatalogoEspecies(nombre_cientifico="Jacaranda mimosifolia", umbral_temp_min=5.0, req_hidrico_base=40.0)
        session.add(especie)
        session.commit()
    
    planta = session.query(PlantasRegistradas).first()
    if not planta:
        planta = PlantasRegistradas(especie_id=especie.id, alias="Jacaranda 1")
        session.add(planta)
        session.commit()

    # 2. Extracción de hechos (Inputs crisp)[cite: 2]
    # Simulamos el ingreso de datos de los sensores
    hvs, ta, hr = 25.0, 35.0, 40.0
    
    medicion = MedicionesAmbientales(
        planta_id=planta.id,
        humedad_sustrato=hvs,
        temperatura_ambiental=ta,
        humedad_relativa=hr
    )
    session.add(medicion)

    # 3. Evaluación mediante el SED
    resultado_sed = evaluar_estado_planta(hvs, ta, hr)
    pr_val = resultado_sed["prioridad_riego"]
    rf_val = resultado_sed["riesgo_fitosanitario"]

    # Mutación de estado en la Memoria de Trabajo del SED[cite: 2]
    planta.prioridad_riego_actual = pr_val
    planta.indice_riesgo_fitosanitario = rf_val
    print(f"Evaluando Planta '{planta.alias}' - Prioridad de Riego: {pr_val}%, Riesgo Fitosanitario: {rf_val}%")

    # 4. Desfuzificación y Triggers de Acción[cite: 2]
    if pr_val > 65.0: # Umbral de acción para riego[cite: 2]
        tarea = TareasPendientes(
            planta_id=planta.id, 
            tipo_tarea="REGAR",
            estado_tarea="PENDIENTE"
        )
        session.add(tarea)
        print("Disparador ejecutado: Tarea de riego insertada en base de datos.")

    if rf_val > 75.0: # Umbral de alerta fitosanitaria[cite: 2]
        alerta = AlertasMeteorologicas(
            planta_id=planta.id,
            severidad="CRITICA",
            mensaje=f"Riesgo fitosanitario elevado ({rf_val}%). Iniciar protocolo de revisión.",
            fecha_expiracion=datetime.now(timezone.utc)
        )
        session.add(alerta)
        print("Disparador ejecutado: Alerta meteorológica generada.")

    # 5. Persistencia
    session.commit()
    print("Ciclo operativo finalizado correctamente.")

if __name__ == "__main__":
    ejecutar_ciclo_operativo()