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
from motor_difuso import evaluar_estado_planta

# Configuración de sesión de base de datos
engine = create_engine("sqlite:///botanico.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def evaluar_y_persistir(
    planta_id: int,
    humedad_sustrato: float,
    temperatura: float,
    humedad_relativa: float
) -> dict:
    """
    Ejecuta el ciclo transaccional completo:
    1. Registra hechos (telemetría crisp) en mediciones_ambientales.
    2. Ejecuta el Motor SED (Mamdani) y calcula centroides.
    3. Muta el estado de la planta en la Memoria de Trabajo (plantas_registradas).
    4. Evalúa umbrales de disparo (PR > 65% para riego, RF > 75% para fitosanitario).
    5. Persiste tareas y alertas en la base de datos relacional.
    """
    session = SessionLocal()
    try:
        # 1. Recuperar o validar la instancia de la planta
        planta = session.query(PlantasRegistradas).filter_by(id=planta_id).first()
        if not planta:
            planta = session.query(PlantasRegistradas).first()
            if not planta:
                from seed_db import seed_database
                seed_database()
                planta = session.query(PlantasRegistradas).first()

        # 2. Persistir medición física de telemetría
        now = datetime.now(timezone.utc)
        medicion = MedicionesAmbientales(
            planta_id=planta.id,
            humedad_sustrato=humedad_sustrato,
            temperatura_ambiental=temperatura,
            humedad_relativa=humedad_relativa,
            fecha=now
        )
        session.add(medicion)

        # 3. Evaluación mediante el SED
        resultado_sed = evaluar_estado_planta(humedad_sustrato, temperatura, humedad_relativa)
        pr_val = float(resultado_sed["prioridad_riego"])
        rf_val = float(resultado_sed["riesgo_fitosanitario"])

        # Mutación de estado en la Memoria de Trabajo del SED
        planta.prioridad_riego_actual = pr_val
        planta.indice_riesgo_fitosanitario = rf_val

        # 4. Disparadores (Triggers) y creación de tareas/alertas
        tarea_creada = False
        if pr_val > 65.0:
            # Evitar duplicar tarea de riego pendiente
            tarea_existente = session.query(TareasPendientes).filter_by(
                planta_id=planta.id,
                tipo_tarea="REGAR",
                estado_tarea="PENDIENTE"
            ).first()

            if not tarea_existente:
                tarea = TareasPendientes(
                    planta_id=planta.id,
                    tipo_tarea="REGAR",
                    estado_tarea="PENDIENTE",
                    fecha_generacion=now
                )
                session.add(tarea)
                tarea_creada = True

            # Registrar en bitácora
            evento_riego = BitacoraEventos(
                planta_id=planta.id,
                tipo_evento="TRIGGER_RIEGO",
                fecha=now,
                observaciones=f"Prioridad de riego SED ({pr_val}%) superó el umbral de acción del 65%."
            )
            session.add(evento_riego)

        alerta_creada = False
        if rf_val > 75.0:
            alerta = AlertasMeteorologicas(
                planta_id=planta.id,
                severidad="CRITICA",
                mensaje=f"Riesgo fitosanitario elevado ({rf_val}%). Iniciar protocolo fitosanitario preventivo.",
                fecha_expiracion=now + timedelta(days=3)
            )
            session.add(alerta)
            alerta_creada = True

            evento_alerta = BitacoraEventos(
                planta_id=planta.id,
                tipo_evento="ALERTA_FITOSANITARIA",
                fecha=now,
                observaciones=f"Riesgo fitosanitario SED ({rf_val}%) superó el umbral del 75%."
            )
            session.add(evento_alerta)

        # 5. Persistencia transaccional en SQLite
        session.commit()

        return {
            "planta_id": int(planta.id),
            "alias": str(planta.alias),
            "diagnostico_sed": {
                "prioridad_riego": float(pr_val),
                "riesgo_fitosanitario": float(rf_val)
            },
            "triggers": {
                "tarea_riego_generada": bool(tarea_creada or pr_val > 65.0),
                "alerta_fitosanitaria_generada": bool(alerta_creada or rf_val > 75.0)
            },
            "persistencia": {
                "medicion_guardada": True,
                "estado_actualizado": True
            }
        }
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()

def ejecutar_ciclo_operativo():
    """Ejecución de prueba por línea de comandos (Fase 3)."""
    hvs, ta, hr = 25.0, 35.0, 40.0
    print(f"--- Ejecutando Ciclo Operativo CLI (HVS:{hvs}%, TA:{ta}°C, HR:{hr}%) ---")
    resultado = evaluar_y_persistir(planta_id=1, humedad_sustrato=hvs, temperatura=ta, humedad_relativa=hr)
    print(f"Evaluación completada para Planta '{resultado['alias']}':")
    print(f"  Prioridad de Riego: {resultado['diagnostico_sed']['prioridad_riego']}%")
    print(f"  Riesgo Fitosanitario: {resultado['diagnostico_sed']['riesgo_fitosanitario']}%")
    print(f"  Triggers activados: {resultado['triggers']}")
    print("Ciclo operativo finalizado y persistido correctamente en SQLite.")

if __name__ == "__main__":
    ejecutar_ciclo_operativo()