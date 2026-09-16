from typing import List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from sqlalchemy import create_engine, desc
from sqlalchemy.orm import sessionmaker, Session

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
from orquestador import evaluar_y_persistir
from rag_pipeline import consultar_asesor

# Inicialización de la base de datos relacional
DATABASE_URL = "sqlite:///botanico.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app = FastAPI(
    title="API - Sistema Experto Botánico",
    description="Backend Neurosimbólico: Sistema Experto Difuso (Mamdani skfuzzy), Pipeline RAG (ChromaDB) y Persistencia Relacional (SQLite).",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Esquemas Pydantic para Validación de Cargas Útiles (Payloads)

class Telemetria(BaseModel):
    planta_id: int
    humedad_sustrato: float
    temperatura_ambiental: float
    humedad_relativa: float

class Consulta(BaseModel):
    planta_id: int
    mensaje: str
    prioridad_riego: float = 0.0
    riesgo_fitosanitario: float = 0.0

class NuevaPlanta(BaseModel):
    especie_id: int
    alias: str
    ubicacion: Optional[str] = "Cantero Principal"

@app.post("/api/evaluar", tags=["Sistema Experto Difuso"])
def evaluar_instancia(datos: Telemetria):
    """
    Fases 2, 3 y 5: Inyecta hechos crisp al SED, calcula centroides matemáticos
    y persiste la medición, actualización de estado y triggers en SQLite.
    """
    resultado = evaluar_y_persistir(
        planta_id=datos.planta_id,
        humedad_sustrato=datos.humedad_sustrato,
        temperatura=datos.temperatura_ambiental,
        humedad_relativa=datos.humedad_relativa
    )
    return {
        "planta_id": datos.planta_id,
        "diagnostico_sed": resultado["diagnostico_sed"],
        "triggers": resultado["triggers"],
        "persistencia": resultado["persistencia"]
    }

@app.post("/api/asesor", tags=["Pipeline RAG"])
def asistente_rag(consulta: Consulta):
    """
    Fase 4: Pipeline RAG combinando telemetría del SED con recuperación
    semántica multilingüe en ChromaDB (Similitud Coseno) y síntesis experta.
    """
    resultado = consultar_asesor(
        consulta.planta_id,
        consulta.mensaje,
        prioridad_riego=consulta.prioridad_riego,
        riesgo_fitosanitario=consulta.riesgo_fitosanitario
    )
    if isinstance(resultado, dict):
        return {
            "payload_llm": resultado.get("payload_llm", ""),
            "respuesta_experta": resultado.get("respuesta_experta", ""),
            "literatura_recuperada": resultado.get("literatura_recuperada", []),
            "especie": resultado.get("especie", ""),
            "planta": resultado.get("planta", ""),
            "estado_sed": resultado.get("estado_sed", "")
        }
    return {"payload_llm": resultado, "respuesta_experta": str(resultado)}


@app.get("/api/catalogo", tags=["Catálogo Botánico"])
def listar_catalogo(db: Session = Depends(get_db)):
    """Devuelve las especies del catálogo regional con sus tolerancias y características."""
    especies = db.query(CatalogoEspecies).all()
    return [
        {
            "id": esp.id,
            "nombre_comun": esp.nombre_comun or esp.nombre_cientifico,
            "nombre_cientifico": esp.nombre_cientifico,
            "familia": esp.familia,
            "umbral_temp_min": esp.umbral_temp_min,
            "umbral_temp_max": esp.umbral_temp_max,
            "req_hidrico_base": esp.req_hidrico_base,
            "exposicion_solar": esp.exposicion_solar,
            "epoca_floracion": esp.epoca_floracion,
            "descripcion": esp.descripcion,
            "imagen_url": esp.imagen_url
        }
        for esp in especies
    ]

@app.get("/api/plantas", tags=["Inventario y Telemetría"])
def listar_plantas(db: Session = Depends(get_db)):
    """Devuelve las plantas registradas con su estado actual y última medición."""
    plantas = db.query(PlantasRegistradas).all()
    resultado = []
    for p in plantas:
        ultima_med = db.query(MedicionesAmbientales).filter_by(planta_id=p.id).order_by(desc(MedicionesAmbientales.fecha)).first()
        resultado.append({
            "id": p.id,
            "alias": p.alias,
            "ubicacion": p.ubicacion,
            "prioridad_riego_actual": p.prioridad_riego_actual,
            "indice_riesgo_fitosanitario": p.indice_riesgo_fitosanitario,
            "especie": {
                "id": p.especie.id if p.especie else None,
                "nombre_comun": p.especie.nombre_comun if p.especie else p.alias,
                "nombre_cientifico": p.especie.nombre_cientifico if p.especie else "",
                "imagen_url": p.especie.imagen_url if p.especie else None
            },
            "ultima_telemetria": {
                "humedad_sustrato": ultima_med.humedad_sustrato if ultima_med else 45.0,
                "temperatura_ambiental": ultima_med.temperatura_ambiental if ultima_med else 24.0,
                "humedad_relativa": ultima_med.humedad_relativa if ultima_med else 50.0,
                "fecha": ultima_med.fecha.isoformat() if ultima_med else None
            }
        })
    return resultado

@app.get("/api/plantas/{planta_id}", tags=["Inventario y Telemetría"])
def detalle_planta(planta_id: int, db: Session = Depends(get_db)):
    """Devuelve la ficha detallada de una planta, sus mediciones recientes y su bitácora."""
    planta = db.query(PlantasRegistradas).filter_by(id=planta_id).first()
    if not planta:
        raise HTTPException(status_code=404, detail="Planta no encontrada")
    
    mediciones = db.query(MedicionesAmbientales).filter_by(planta_id=planta.id).order_by(desc(MedicionesAmbientales.fecha)).limit(10).all()
    eventos = db.query(BitacoraEventos).filter_by(planta_id=planta.id).order_by(desc(BitacoraEventos.fecha)).limit(15).all()
    
    return {
        "id": planta.id,
        "alias": planta.alias,
        "ubicacion": planta.ubicacion,
        "prioridad_riego_actual": planta.prioridad_riego_actual,
        "indice_riesgo_fitosanitario": planta.indice_riesgo_fitosanitario,
        "especie": {
            "id": planta.especie.id if planta.especie else None,
            "nombre_comun": planta.especie.nombre_comun if planta.especie else planta.alias,
            "nombre_cientifico": planta.especie.nombre_cientifico if planta.especie else "",
            "descripcion": planta.especie.descripcion if planta.especie else "",
            "imagen_url": planta.especie.imagen_url if planta.especie else None
        },
        "mediciones_recientes": [
            {
                "id": m.id,
                "humedad_sustrato": m.humedad_sustrato,
                "temperatura_ambiental": m.temperatura_ambiental,
                "humedad_relativa": m.humedad_relativa,
                "fecha": m.fecha.isoformat()
            }
            for m in mediciones
        ],
        "bitacora_eventos": [
            {
                "id": e.id,
                "tipo_evento": e.tipo_evento,
                "fecha": e.fecha.isoformat(),
                "observaciones": e.observaciones
            }
            for e in eventos
        ]
    }

@app.post("/api/plantas", tags=["Inventario y Telemetría"])
def registrar_nueva_planta(datos: NuevaPlanta, db: Session = Depends(get_db)):
    """Registra una nueva planta en el jardín botánico a partir de una especie del catálogo."""
    especie = db.query(CatalogoEspecies).filter_by(id=datos.especie_id).first()
    if not especie:
        raise HTTPException(status_code=404, detail="Especie no encontrada en el catálogo")
    
    nueva = PlantasRegistradas(
        especie_id=especie.id,
        alias=datos.alias,
        ubicacion=datos.ubicacion or "Cantero Principal",
        prioridad_riego_actual=25.0,
        indice_riesgo_fitosanitario=15.0
    )
    db.add(nueva)
    db.flush()

    # Evento en bitácora
    evento = BitacoraEventos(
        planta_id=nueva.id,
        tipo_evento="REGISTRO_INICIAL",
        observaciones=f"Incorporación de {nueva.alias} ({especie.nombre_cientifico}) al jardín."
    )
    db.add(evento)
    db.commit()
    db.refresh(nueva)
    return {"status": "ok", "planta_id": nueva.id, "alias": nueva.alias}

@app.post("/api/plantas/{planta_id}/regar", tags=["Inventario y Telemetría"])
def aplicar_riego(planta_id: int, db: Session = Depends(get_db)):
    """Aplica riego a la planta, resuelve tareas de riego pendientes y registra en bitácora."""
    planta = db.query(PlantasRegistradas).filter_by(id=planta_id).first()
    if not planta:
        raise HTTPException(status_code=404, detail="Planta no encontrada")
    
    # Reducir prioridad de riego
    planta.prioridad_riego_actual = max(round(planta.prioridad_riego_actual - 50.0, 1), 15.0)

    # Completar tareas de riego pendientes
    tareas_pendientes = db.query(TareasPendientes).filter_by(
        planta_id=planta.id,
        tipo_tarea="REGAR",
        estado_tarea="PENDIENTE"
    ).all()
    for t in tareas_pendientes:
        t.estado_tarea = "COMPLETADA"

    # Registrar evento en bitácora
    evento = BitacoraEventos(
        planta_id=planta.id,
        tipo_evento="RIEGO_APLICADO",
        observaciones="Riego de recuperación aplicado. Déficit hídrico resuelto."
    )
    db.add(evento)
    db.commit()
    return {
        "status": "ok",
        "mensaje": f"Riego aplicado a {planta.alias}",
        "nueva_prioridad_riego": planta.prioridad_riego_actual
    }

@app.get("/api/alertas", tags=["Alertas y Tareas"])
def listar_alertas(db: Session = Depends(get_db)):
    """Lista las alertas activas en el jardín botánico."""
    alertas = db.query(AlertasMeteorologicas).all()
    return [
        {
            "id": a.id,
            "planta_id": a.planta_id,
            "severidad": a.severidad,
            "mensaje": a.mensaje,
            "fecha_expiracion": a.fecha_expiracion.isoformat()
        }
        for a in alertas
    ]

@app.get("/api/tareas", tags=["Alertas y Tareas"])
def listar_tareas(db: Session = Depends(get_db)):
    """Lista las tareas pendientes generadas por los disparadores del SED."""
    tareas = db.query(TareasPendientes).filter_by(estado_tarea="PENDIENTE").all()
    return [
        {
            "id": t.id,
            "planta_id": t.planta_id,
            "tipo_tarea": t.tipo_tarea,
            "estado_tarea": t.estado_tarea,
            "fecha_generacion": t.fecha_generacion.isoformat()
        }
        for t in tareas
    ]

@app.get("/api/reglas", tags=["Sistema Experto Difuso"])
def catalogo_reglas():
    """Devuelve el catálogo de las 20 reglas Mamdani de inferencia difusa."""
    return {
        "total_reglas": 20,
        "motor": "Mamdani (scikit-fuzzy con defuzzificación por Centroide)",
        "bloque_a_riego": [
            {"id": "REG-01", "premisa": "SI Humedad=Déficit Y Temperatura=Extrema", "consecuente": "Prioridad de Riego=CRÍTICA"},
            {"id": "REG-02", "premisa": "SI Humedad=Déficit Y Temperatura=Cálida", "consecuente": "Prioridad de Riego=ALTA"},
            {"id": "REG-03", "premisa": "SI Humedad=Déficit Y Temperatura=Templada", "consecuente": "Prioridad de Riego=MODERADA"},
            {"id": "REG-04", "premisa": "SI Humedad=Déficit Y Temperatura=Fría", "consecuente": "Prioridad de Riego=BAJA"},
            {"id": "REG-05", "premisa": "SI Humedad=Déficit Y HR=Baja Y Temperatura=Cálida", "consecuente": "Prioridad de Riego=CRÍTICA"},
            {"id": "REG-06", "premisa": "SI Humedad=Capacidad Campo Y Temperatura=Extrema", "consecuente": "Prioridad de Riego=MODERADA"},
            {"id": "REG-07", "premisa": "SI Humedad=Capacidad Campo Y Temperatura=Cálida", "consecuente": "Prioridad de Riego=BAJA"},
            {"id": "REG-08", "premisa": "SI Humedad=Capacidad Campo Y Temperatura=Templada", "consecuente": "Prioridad de Riego=NULA"},
            {"id": "REG-09", "premisa": "SI Humedad=Saturación", "consecuente": "Prioridad de Riego=NULA"},
            {"id": "REG-10", "premisa": "SI Humedad=Capacidad Campo Y HR=Alta Y Temperatura=Cálida", "consecuente": "Prioridad de Riego=NULA"}
        ],
        "bloque_b_fitosanitario": [
            {"id": "REG-11", "premisa": "SI Humedad=Saturación Y Temperatura=Cálida Y HR=Alta", "consecuente": "Riesgo Fitosanitario=CRÍTICO"},
            {"id": "REG-12", "premisa": "SI Humedad=Saturación Y Temperatura=Templada Y HR=Alta", "consecuente": "Riesgo Fitosanitario=ALTO"},
            {"id": "REG-13", "premisa": "SI Humedad=Saturación Y Temperatura=Fría", "consecuente": "Riesgo Fitosanitario=ALTO"},
            {"id": "REG-14", "premisa": "SI HR=Alta Y Temperatura=Templada", "consecuente": "Riesgo Fitosanitario=MEDIO"},
            {"id": "REG-15", "premisa": "SI Humedad=Capacidad Campo Y HR=Baja Y Temperatura=Templada", "consecuente": "Riesgo Fitosanitario=BAJO"},
            {"id": "REG-16", "premisa": "SI Humedad=Déficit Y Temperatura=Extrema Y HR=Baja", "consecuente": "Riesgo Fitosanitario=ALTO"},
            {"id": "REG-17", "premisa": "SI Humedad=Capacidad Campo Y Temperatura=Extrema Y HR=Alta", "consecuente": "Riesgo Fitosanitario=MEDIO"},
            {"id": "REG-18", "premisa": "SI Humedad=Déficit Y Temperatura=Fría", "consecuente": "Riesgo Fitosanitario=BAJO"},
            {"id": "REG-19", "premisa": "SI Humedad=Saturación Y HR=Media Y Temperatura=Templada", "consecuente": "Riesgo Fitosanitario=MEDIO"},
            {"id": "REG-20", "premisa": "SI Humedad=Capacidad Campo Y HR=Media Y Temperatura=Cálida", "consecuente": "Riesgo Fitosanitario=BAJO"}
        ]
    }

@app.get("/", response_class=HTMLResponse)
def home():
    """Panel de Bienvenida y enlaces a la Documentación Interactiva (Swagger UI)."""
    return """
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>API - Sistema Experto Botánico</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #eaf1e7; color: #1e3019; margin: 0; padding: 40px 20px; display: flex; justify-content: center; }
            .card { background: white; max-width: 680px; width: 100%; border-radius: 24px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #d3e2ce; }
            h1 { color: #22371c; margin-top: 0; font-size: 26px; }
            p { font-size: 14.5px; line-height: 1.6; color: #435b3c; }
            .badge { display: inline-block; background: #e0edd9; color: #26401f; font-weight: 600; font-size: 12px; padding: 4px 10px; rounded: 8px; border-radius: 9999px; margin-bottom: 16px; }
            .btn { display: inline-block; background: #3b5731; color: white; text-decoration: none; font-weight: 600; font-size: 14px; padding: 10px 20px; border-radius: 12px; margin-top: 10px; transition: background 0.2s; }
            .btn:hover { background: #2b4023; }
            .endpoints { margin-top: 24px; border-top: 1px solid #e2ede0; padding-top: 20px; font-size: 13px; font-family: monospace; }
            .ep-item { padding: 6px 0; color: #324a29; }
        </style>
    </head>
    <body>
        <div class="card">
            <span class="badge">🌿 Backend Neurosimbólico Activo</span>
            <h1>API - Sistema Experto Botánico</h1>
            <p>Servicios REST para el Asesoramiento, Diagnóstico Fitosanitario y Riego mediante <strong>Lógica Difusa (Mamdani)</strong> y <strong>RAG (ChromaDB)</strong> con persistencia en <strong>SQLite</strong>.</p>
            <a href="/docs" class="btn">🚀 Abrir Documentación Swagger UI</a>
            <div class="endpoints">
                <strong>Puntos de Acceso Disponibles:</strong>
                <div class="ep-item">POST /api/evaluar - Motor Difuso SED + Persistencia</div>
                <div class="ep-item">POST /api/asesor - Pipeline RAG Multilingüe (ChromaDB)</div>
                <div class="ep-item">GET /api/catalogo - Catálogo de Especies Regionales</div>
                <div class="ep-item">GET /api/plantas - Inventario de Ejemplares Monitoreados</div>
                <div class="ep-item">GET /api/alertas - Alertas Meteorológicas y Fitosanitarias</div>
                <div class="ep-item">GET /api/tareas - Tareas Pendientes del Jardín</div>
                <div class="ep-item">GET /api/reglas - Catálogo de las 20 Reglas Mamdani</div>
            </div>
        </div>
    </body>
    </html>
    """
