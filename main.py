from fastapi import FastAPI
from pydantic import BaseModel
from motor_difuso import evaluar_estado_planta
from rag_pipeline import consultar_asesor

app = FastAPI(title="API - Sistema Experto Botánico")

class Telemetria(BaseModel):
    planta_id: int
    humedad_sustrato: float
    temperatura_ambiental: float
    humedad_relativa: float

class Consulta(BaseModel):
    planta_id: int
    pregunta: str

@app.post("/api/evaluar")
def evaluar_instancia(datos: Telemetria):
    """Inyecta crisp inputs al SED y devuelve el centroide matemático."""
    resultado = evaluar_estado_planta(
        datos.humedad_sustrato, 
        datos.temperatura_ambiental, 
        datos.humedad_relativa
    )
    # En un entorno de producción, aquí se invoca orquestador.py para persistir en la DB
    return {"planta_id": datos.planta_id, "diagnostico_sed": resultado}

@app.post("/api/asesor")
def asistente_rag(consulta: Consulta):
    """Genera el System Prompt contextualizado."""
    prompt_inyectado = consultar_asesor(consulta.planta_id, consulta.pregunta)
    return {"payload_llm": prompt_inyectado}