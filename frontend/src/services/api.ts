/**
 * Servicio de integración con el backend FastAPI (ayudante-botanico)
 * Endpoints:
 * - POST /api/evaluar -> Inferencia difusa mediante scikit-fuzzy (SED)
 * - POST /api/asesor -> Inyección de contexto RAG (ChromaDB + SQLite)
 */

export interface TelemetriaInput {
  planta_id: number;
  humedad_sustrato: number;
  temperatura_ambiental: number;
  humedad_relativa: number;
}

export interface DiagnosticoSED {
  prioridad_riego: number;
  riesgo_fitosanitario: number;
}

export interface EvaluacionResponse {
  planta_id: number;
  diagnostico_sed: DiagnosticoSED;
  fuente: 'backend' | 'local';
}

export interface ConsultaInput {
  planta_id: number;
  mensaje: string;
  prioridad_riego?: number;
  riesgo_fitosanitario?: number;
}

export interface AsesorResponse {
  payload_llm: string;
  respuesta_experta?: string;
  especie?: string;
  planta?: string;
  fuente: 'backend' | 'local';
  parsedContext?: {
    estado_sed?: string;
    literatura?: string[];
    instruccion?: string;
  };
}

// Configuración de URLs: Permite usar variable de entorno VITE_API_URL o usar el proxy de Vite '/api'
const API_URL = ((import.meta as any).env?.VITE_API_URL as string) || '';

/**
 * Parsea el ID del ejemplar al número entero esperado por la base de datos y la API
 */
export function extractPlantaId(specimenId: string | number): number {
  if (typeof specimenId === 'number') return specimenId;
  const digits = specimenId.replace(/\D/g, '');
  const parsed = parseInt(digits, 10);
  return isNaN(parsed) || parsed <= 0 ? 1 : parsed;
}

/**
 * Verifica si el backend FastAPI está activo y respondiendo
 */
export async function checkBackendHealth(): Promise<{ online: boolean; message: string }> {
  try {
    // Verificamos conectividad probando /openapi.json que FastAPI expone de forma nativa
    const res = await fetch(`${API_URL}/openapi.json`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      return {
        online: true,
        message: 'Backend FastAPI conectado correctamente (puerto 8000).'
      };
    }
    return {
      online: false,
      message: `El backend respondió con estado ${res.status}.`
    };
  } catch (error) {
    return {
      online: false,
      message: 'No se pudo conectar con el servidor backend (FastAPI no detectado en http://127.0.0.1:8000).'
    };
  }
}

/**
 * Invoca el Sistema Experto Difuso (SED) en el backend: POST /api/evaluar
 */
export async function evaluarSED(telemetria: TelemetriaInput): Promise<EvaluacionResponse> {
  const payload = {
    planta_id: telemetria.planta_id,
    humedad_sustrato: Number(telemetria.humedad_sustrato),
    temperatura_ambiental: Number(telemetria.temperatura_ambiental),
    humedad_relativa: Number(telemetria.humedad_relativa),
  };

  try {
    const response = await fetch(`${API_URL}/api/evaluar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(`Error en backend /api/evaluar: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      planta_id: data.planta_id,
      diagnostico_sed: {
        prioridad_riego: Number(data.diagnostico_sed?.prioridad_riego ?? 0),
        riesgo_fitosanitario: Number(data.diagnostico_sed?.riesgo_fitosanitario ?? 0),
      },
      fuente: 'backend',
    };
  } catch (error) {
    console.warn('Fallo en conexión con el backend para /api/evaluar. Usando fallback local:', error);
    // Fallback matemático aproximado si el backend no está disponible
    const fallbackDiagnostico = calcularFallbackSED(
      payload.humedad_sustrato,
      payload.temperatura_ambiental,
      payload.humedad_relativa
    );
    return {
      planta_id: payload.planta_id,
      diagnostico_sed: fallbackDiagnostico,
      fuente: 'local',
    };
  }
}

/**
 * Invoca el Pipeline RAG en el backend: POST /api/asesor
 */
export async function consultarAsesorRAG(consulta: ConsultaInput): Promise<AsesorResponse> {
  const payload = {
    planta_id: consulta.planta_id,
    mensaje: consulta.mensaje,
    prioridad_riego: consulta.prioridad_riego ?? 0.0,
    riesgo_fitosanitario: consulta.riesgo_fitosanitario ?? 0.0,
  };

  try {
    const response = await fetch(`${API_URL}/api/asesor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      throw new Error(`Error en backend /api/asesor: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const payloadLlm = data.payload_llm || '';
    const respuestaExperta = data.respuesta_experta || '';
    const parsed = parsearPayloadLLM(payloadLlm);

    return {
      payload_llm: payloadLlm,
      respuesta_experta: respuestaExperta,
      especie: data.especie,
      planta: data.planta,
      fuente: 'backend',
      parsedContext: parsed,
    };
  } catch (error) {
    console.warn('Fallo en conexión con el backend para /api/asesor. Generando respuesta local:', error);
    const fallbackPayload = generarPayloadFallback(consulta);
    return {
      payload_llm: fallbackPayload,
      fuente: 'local',
      parsedContext: parsearPayloadLLM(fallbackPayload),
    };
  }
}

/**
 * Parsea el texto del System Prompt devuelto por consultar_asesor
 */
function parsearPayloadLLM(rawPayload: string): {
  estado_sed?: string;
  literatura?: string[];
  instruccion?: string;
} {
  const result: { estado_sed?: string; literatura?: string[]; instruccion?: string } = {};

  try {
    if (rawPayload.includes('Contexto Transaccional del Ejemplar (SED):')) {
      const parts = rawPayload.split('Contexto Transaccional del Ejemplar (SED):');
      const secondPart = parts[1] || '';
      const litParts = secondPart.split('Literatura Botánica Recuperada (Base de Conocimiento):');
      result.estado_sed = litParts[0]?.trim();

      if (litParts[1]) {
        const instParts = litParts[1].split('Instrucción:');
        const litText = instParts[0]?.trim();
        result.literatura = litText
          ?.split('\n- ')
          .map((s) => s.replace(/^- /, '').trim())
          .filter(Boolean);
        result.instruccion = instParts[1]?.trim();
      }
    }
  } catch (err) {
    console.error('Error parseando payload LLM:', err);
  }

  return result;
}

/**
 * Fallback local aproximado de las reglas Mamdani si el servidor FastAPI no está encendido
 */
function calcularFallbackSED(hvs: number, ta: number, hr: number): DiagnosticoSED {
  let pr = 15;
  if (hvs < 25 && ta >= 35) {
    pr = 81.37;
  } else if (hvs < 25 && ta >= 25) {
    pr = 76.5;
  } else if (hvs < 40) {
    pr = 52.0;
  } else if (hvs > 75) {
    pr = 5.0;
  }

  let rf = 20;
  if (hvs > 75 && ta > 25 && hr > 75) {
    rf = 88.0;
  } else if (hvs < 25 && ta >= 35 && hr < 50) {
    rf = 70.0;
  } else if (hr > 75) {
    rf = 64.0;
  }

  return {
    prioridad_riego: Number(pr.toFixed(2)),
    riesgo_fitosanitario: Number(rf.toFixed(2)),
  };
}

/**
 * Genera el System Prompt contextualizado de respaldo cuando el backend no está disponible
 */
function generarPayloadFallback(consulta: ConsultaInput): string {
  return `Eres un experto agronómico evaluando un ejemplar específico.

Contexto Transaccional del Ejemplar (SED):
Prioridad de riego actual: ${consulta.prioridad_riego || 45}%. Riesgo fitosanitario: ${consulta.riesgo_fitosanitario || 20}%.

Literatura Botánica Recuperada (Base de Conocimiento):
- El Jacarandá requiere suelos bien drenados. El exceso de agua provoca hipoxia y posterior pudrición radicular por Phytophthora.
- Para mitigar el estrés térmico severo, se recomienda aplicar riegos profundos al atardecer y proporcionar malla sombra.

Instrucción:
Responde a la consulta del usuario fundamentando tu consejo estrictamente en la literatura botánica recuperada, pero adaptando la urgencia según el contexto transaccional del SED.`;
}
