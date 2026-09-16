import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  Send,
  Server,
  RefreshCw,
  Terminal,
  Database,
  Search,
  Bot,
  Sparkles,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  X,
  ExternalLink,
  ShieldAlert,
  Flame,
  Info
} from 'lucide-react';
import { Specimen, SedRule } from '../types';
import { SED_RULES, determinarReglasDisparadas } from '../data/botanicalData';
import { 
  consultarAsesorRAG, 
  evaluarSED,
  extractPlantaId, 
  checkBackendHealth,
  AsesorResponse
} from '../services/api';

interface SedRagScreenProps {
  specimens: Specimen[];
  selectedSpecimenForDiag?: Specimen | null;
  onSpecimenEvaluated?: (
    specimenId: string,
    result: { prioridad_riego: number; riesgo_fitosanitario: number }
  ) => void;
  onWaterSpecimen?: (specimenId: string) => void;
  onSelectSpecimenForModal?: (specimen: Specimen) => void;
  onNavigateToTab?: (tab: 'dashboard' | 'plantadas' | 'catalogo') => void;
}

interface DiagnosticPayload {
  hvs: number;
  ta: number;
  hr: number;
  prioridadRiego: number;
  riesgoFitosanitario: number;
  reglasActivadas: SedRule[];
  specimenId: string;
  specimenName: string;
  literaturaRecuperada?: string[];
  isWatered?: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  rawPayload?: string;
  sedContext?: string;
  retrievedDocs?: string[];
  source?: 'backend' | 'local';
  diagnostic?: DiagnosticPayload;
}

export const SedRagScreen: React.FC<SedRagScreenProps> = ({
  specimens,
  selectedSpecimenForDiag,
  onSpecimenEvaluated,
  onWaterSpecimen,
  onSelectSpecimenForModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'asesor' | 'rules'>('asesor');
  
  // Specimen selection for context injection
  const [selectedSpecimenId, setSelectedSpecimenId] = useState<string>(
    selectedSpecimenForDiag?.id || specimens[0]?.id || ''
  );

  // Chatbot State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: '¡Hola! Soy tu Chatbot y Sistema Experto Botánico con Lógica Difusa (Mamdani) y RAG. Puedo diagnosticar el estado fisiológico y fitosanitario de tus plantas evaluando tus variables de humedad y temperatura contra mis 20 reglas de producción y la literatura en ChromaDB.\n\nPuedes escribir tus valores directamente (ej: "Suelo 20%, 35°C y 40% HR"), consultar dudas botánicas o presionar uno de los botones de diagnóstico rápido aquí debajo:',
      timestamp: 'Ahora',
      source: 'backend'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAskingRAG, setIsAskingRAG] = useState(false);
  const [showRawPayloadModal, setShowRawPayloadModal] = useState<string | null>(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [backendStatus, setBackendStatus] = useState<boolean | null>(null);

  // Custom diagnostic modal inputs
  const [customHvs, setCustomHvs] = useState<number>(25);
  const [customTa, setCustomTa] = useState<number>(35);
  const [customHr, setCustomHr] = useState<number>(40);

  // Search filter in rules
  const [ruleCategoryFilter, setRuleCategoryFilter] = useState<string>('all');
  const [ruleSearch, setRuleSearch] = useState('');

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth().then((res) => setBackendStatus(res.online));
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isAskingRAG]);

  const currentSp = specimens.find((s) => s.id === selectedSpecimenId) || specimens[0];
  const numericPlantaId = extractPlantaId(currentSp?.id || '1');

  const getPreguntasSugeridas = (sp: Specimen) => {
    const common = (sp?.commonName || sp?.name || '').toLowerCase();
    if (common.includes('lapacho')) {
      return [
        { label: '🌸 Estimular Floración', query: `¿Cómo estimular la floración del ${sp.name} y cuándo entra en reposo hídrico?` },
        { label: '💧 Déficit Hídrico', query: `¿Qué efectos produce el déficit hídrico en ${sp.name} y cuánto regar?` },
        { label: '✂️ Poda y Cuidados', query: `¿En qué época se poda el ${sp.name} y cómo proteger sus ramas?` }
      ];
    } else if (common.includes('jacarand')) {
      return [
        { label: '💧 Riego y Hongos', query: `¿Por qué el exceso de agua pudre las raíces del ${sp.name} por Phytophthora?` },
        { label: '🐛 Arañuela y Plagas', query: `¿Qué plagas atacan al ${sp.name} con calor y baja humedad?` },
        { label: '🌱 Suelo y Drenaje', query: `¿Qué tipo de suelo requiere el ${sp.name} para un crecimiento óptimo?` }
      ];
    } else if (common.includes('santa rita') || common.includes('buganvilla')) {
      return [
        { label: '🌸 ¿Por qué no florece?', query: `¿Por qué la ${sp.name} no florece y cómo influye el exceso de agua?` },
        { label: '🛡️ Cochinillas y Plagas', query: `¿Cómo tratar cochinillas algodonosas en ${sp.name}?` },
        { label: '☀️ Insolación y Poda', query: `¿Cuánta insolación necesita la ${sp.name} y cómo guiarla en pérgola?` }
      ];
    } else if (common.includes('ceibo')) {
      return [
        { label: '🌊 Suelos Inundados', query: `¿El ${sp.name} tolera suelos anegados y cómo responde al exceso hídrico?` },
        { label: '❄️ Protección de Heladas', query: `¿Qué temperatura mínima soporta el ${sp.name} y cómo protegerlo de heladas?` },
        { label: '🌸 Floración Carmesí', query: `¿Cuándo florece el ${sp.name} y qué cuidados fitosanitarios requiere?` }
      ];
    } else if (common.includes('ceiba') || common.includes('palo borracho')) {
      return [
        { label: '💧 Reserva del Tronco', query: `¿Cómo funciona la reserva hídrica del tronco de ${sp.name} ante sequía?` },
        { label: '🍄 Humedad y Antracnosis', query: `¿Qué hongos proliferan en ${sp.name} si la humedad relativa supera el 80%?` },
        { label: '☀️ Exposición Solar', query: `¿Qué cuidados de suelo y sol requiere ${sp.name}?` }
      ];
    } else if (common.includes('jazm')) {
      return [
        { label: '🍃 Hojas Amarillas', query: `¿Por qué amarillean las hojas de ${sp.name} y cómo aplicar quelatos de hierro?` },
        { label: '🍄 Hongos por Humedad', query: `¿Qué hongos proliferan en ${sp.name} con alta humedad y calor?` },
        { label: '🌸 Aroma Nocturno', query: `¿Qué sustrato necesita ${sp.name} para potenciar su aroma y floración?` }
      ];
    } else {
      return [
        { label: `💧 Riego para ${sp.name}`, query: `¿Cuál es el régimen de riego recomendado para ${sp.name} según el SED?` },
        { label: `🛡️ Riesgos Fitosanitarios`, query: `¿Qué plagas u hongos pueden afectar a ${sp.name} con los valores actuales?` },
        { label: `🌱 Cuidados de ${sp.name}`, query: `¿Qué pautas de abonado y poda recomiendas para ${sp.name}?` }
      ];
    }
  };

  /**
   * Extrae números y variables de un mensaje en lenguaje natural
   */
  const extraerParametrosDeTexto = (texto: string): { hvs?: number; ta?: number; hr?: number } | null => {
    const t = texto.toLowerCase();

    let hvs: number | undefined;
    let ta: number | undefined;
    let hr: number | undefined;

    const hvsMatch = t.match(/(?:suelo|hvs|humedad\s+del?\s+sustrato|sustrato)[:\s=]+([0-9]+(?:\.[0-9]+)?)/i);
    if (hvsMatch) hvs = parseFloat(hvsMatch[1]);

    const taMatch = t.match(/(?:temp|temperatura|ta|grados)[:\s=]+([0-9]+(?:\.[0-9]+)?)/i);
    if (taMatch) ta = parseFloat(taMatch[1]);

    const hrMatch = t.match(/(?:hr|humedad\s+relativa|humedad\s+ambiente)[:\s=]+([0-9]+(?:\.[0-9]+)?)/i);
    if (hrMatch) hr = parseFloat(hrMatch[1]);

    if (hvs === undefined || ta === undefined || hr === undefined) {
      const numbers = t.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:%|°c|c)?/gi);
      if (numbers && numbers.length >= 3) {
        const parsedNums = numbers.slice(0, 3).map((n) => parseFloat(n));
        if (parsedNums.every((n) => !isNaN(n))) {
          return {
            hvs: Math.max(0, Math.min(100, parsedNums[0])),
            ta: Math.max(-10, Math.min(60, parsedNums[1])),
            hr: Math.max(0, Math.min(100, parsedNums[2])),
          };
        }
      }
    }

    if (hvs !== undefined && ta !== undefined) {
      return {
        hvs: Math.max(0, Math.min(100, hvs)),
        ta: Math.max(-10, Math.min(60, ta)),
        hr: hr !== undefined ? Math.max(0, Math.min(100, hr)) : 50,
      };
    }

    return null;
  };

  /**
   * Ejecuta diagnóstico completo del Sistema Experto y responde en el Chat
   */
  const ejecutarDiagnosticoChat = async (params: {
    hvs: number;
    ta: number;
    hr: number;
    userQuery: string;
    specimen: Specimen;
  }) => {
    const { hvs, ta, hr, userQuery, specimen } = params;
    if (isAskingRAG) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsAskingRAG(true);

    try {
      const targetPlantaId = extractPlantaId(specimen.id);

      // 1. Invocar Motor de Inferencia Difusa (SED)
      const resSed = await evaluarSED({
        planta_id: targetPlantaId,
        humedad_sustrato: hvs,
        temperatura_ambiental: ta,
        humedad_relativa: hr
      });

      const pr = resSed.diagnostico_sed.prioridad_riego;
      const rf = resSed.diagnostico_sed.riesgo_fitosanitario;

      // Actualizar estado global del jardín en App
      onSpecimenEvaluated?.(specimen.id, { prioridad_riego: pr, riesgo_fitosanitario: rf });

      // 2. Invocar Pipeline RAG con el nuevo contexto transaccional
      const resRag: AsesorResponse = await consultarAsesorRAG({
        planta_id: targetPlantaId,
        mensaje: userQuery,
        prioridad_riego: pr,
        riesgo_fitosanitario: rf
      });

      // 3. Determinar qué reglas de las 20 Mamdani se dispararon
      const reglasFired = determinarReglasDisparadas(hvs, ta, hr);

      const introText = resRag.respuesta_experta || 
        `He evaluado la telemetría de **${specimen.name}** utilizando el **Motor de Inferencia Difusa (Mamdani)** y la base de conocimiento de ChromaDB.`;

      const botMessage: ChatMessage = {
        id: `bot-diag-${Date.now()}`,
        sender: 'assistant',
        text: introText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        rawPayload: resRag.payload_llm,
        sedContext: resRag.parsedContext?.estado_sed,
        retrievedDocs: resRag.parsedContext?.literatura,
        source: resSed.fuente,
        diagnostic: {
          hvs,
          ta,
          hr,
          prioridadRiego: pr,
          riesgoFitosanitario: rf,
          reglasActivadas: reglasFired,
          specimenId: specimen.id,
          specimenName: specimen.name,
          literaturaRecuperada: resRag.parsedContext?.literatura,
          isWatered: false
        }
      };

      setChatMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Error en diagnóstico conversacional:', err);
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'Ocurrió un error al procesar el diagnóstico con el Sistema Experto. Verifica la conexión con el backend en http://127.0.0.1:8000.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'local'
      };
      setChatMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsAskingRAG(false);
    }
  };

  // Auto-diagnóstico cuando se transfiere un ejemplar desde otra pantalla
  const lastDiagnosedSpecimenRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedSpecimenForDiag && selectedSpecimenForDiag.id !== lastDiagnosedSpecimenRef.current) {
      lastDiagnosedSpecimenRef.current = selectedSpecimenForDiag.id;
      setSelectedSpecimenId(selectedSpecimenForDiag.id);
      ejecutarDiagnosticoChat({
        hvs: selectedSpecimenForDiag.soilMoisture,
        ta: selectedSpecimenForDiag.temperature,
        hr: selectedSpecimenForDiag.humidity,
        userQuery: `Diagnosticar telemetría actual de ${selectedSpecimenForDiag.name} (${selectedSpecimenForDiag.scientificName}): Humedad Suelo ${selectedSpecimenForDiag.soilMoisture}%, Temp ${selectedSpecimenForDiag.temperature}°C, HR ${selectedSpecimenForDiag.humidity}%.`,
        specimen: selectedSpecimenForDiag
      });
    }
  }, [selectedSpecimenForDiag]);

  /**
   * Envía consulta general de texto o detecta si contiene parámetros numéricos
   */
  const handleSendMessage = async (textToSend?: string) => {
    const rawText = textToSend || chatInput;
    if (!rawText.trim() || isAskingRAG) return;

    // Intentar extraer números (HVS, TA, HR)
    const params = extraerParametrosDeTexto(rawText);
    if (params && params.hvs !== undefined && params.ta !== undefined) {
      await ejecutarDiagnosticoChat({
        hvs: params.hvs,
        ta: params.ta,
        hr: params.hr ?? 50,
        userQuery: rawText,
        specimen: currentSp
      });
      return;
    }

    // Si el usuario pregunta por las reglas
    const lower = rawText.toLowerCase();
    if (lower.includes('regla') || lower.includes('reglas')) {
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'user',
        text: rawText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: `El **Sistema Experto Difuso** cuenta con **20 reglas de producción de Mamdani** distribuidas en dos bloques:\n\n• **Reglas 1 a 10 (Prioridad de Riego):** Evalúan la disponibilidad hídrica (HVS) y la demanda ambiental (TA, HR) para definir cuándo irrigar.\n• **Reglas 11 a 20 (Riesgo Fitosanitario):** Evalúan combinaciones de saturación hídrica y calor/humedad que propician hongos o plagas como la arañuela roja.\n\nPuedes consultar la pestaña **"Base de Reglas SED"** arriba para explorarlas con sus antecedentes y consecuentes completos.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'local'
      };
      setChatMessages((prev) => [...prev, userMessage, botMessage]);
      setChatInput('');
      return;
    }

    // Consulta general RAG
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: rawText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setIsAskingRAG(true);

    try {
      const response: AsesorResponse = await consultarAsesorRAG({
        planta_id: numericPlantaId,
        mensaje: rawText,
        prioridad_riego: currentSp?.irrigationPriority ?? 0,
        riesgo_fitosanitario: currentSp?.phytosanitaryRisk ?? 0,
      });

      let synthesizedAnswer = '';
      if (response.respuesta_experta) {
        synthesizedAnswer = response.respuesta_experta;
      } else if (response.parsedContext?.literatura && response.parsedContext.literatura.length > 0) {
        synthesizedAnswer = `Según los manuales botánicos de **${currentSp.name}** recuperados en ChromaDB:\n\n${response.parsedContext.literatura.map((lit) => `• "${lit}"`).join('\n\n')}\n\n**Recomendación del Asesor:** Con Prioridad de Riego de ${currentSp.irrigationPriority}% y Riesgo Fitosanitario de ${currentSp.phytosanitaryRisk}%, se aconseja adaptar las tareas a las pautas de las reglas Mamdani.`;
      } else {
        synthesizedAnswer = response.payload_llm;
      }

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: synthesizedAnswer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        rawPayload: response.payload_llm,
        sedContext: response.parsedContext?.estado_sed,
        retrievedDocs: response.parsedContext?.literatura,
        source: response.fuente,
      };

      setChatMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Error consultando asesor RAG:', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'Error de comunicación con el backend en /api/asesor. Verifica que el servidor FastAPI esté corriendo en http://127.0.0.1:8000.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'local',
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsAskingRAG(false);
    }
  };

  /**
   * Aplica riego desde el botón en el chat
   */
  const handleWaterFromChat = (msgId: string, specimenId: string, specimenName: string) => {
    onWaterSpecimen?.(specimenId);

    setChatMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId && m.diagnostic) {
          return {
            ...m,
            diagnostic: { ...m.diagnostic, isWatered: true }
          };
        }
        return m;
      })
    );

    const confirmMsg: ChatMessage = {
      id: `bot-water-${Date.now()}`,
      sender: 'assistant',
      text: `💧 **Riego de Auxilio Aplicado:** Se ha suministrado riego inmediato a **${specimenName}**. El evento ha sido guardado en la bitácora del ejemplar y la prioridad de riego ha sido mitigada en el semáforo general.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'local'
    };
    setChatMessages((prev) => [...prev, confirmMsg]);
  };

  const filteredRules = SED_RULES.filter((r) => {
    const matchesCat = ruleCategoryFilter === 'all' || r.category === ruleCategoryFilter;
    const matchesSearch = 
      r.code.toLowerCase().includes(ruleSearch.toLowerCase()) ||
      r.name.toLowerCase().includes(ruleSearch.toLowerCase()) ||
      r.antecedent.toLowerCase().includes(ruleSearch.toLowerCase()) ||
      r.consequent.toLowerCase().includes(ruleSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-4 pb-4">
      {/* Sub-tab switcher: Chatbot SED vs Reglas */}
      <div className="flex p-1 bg-[#e3ecd9] rounded-2xl border border-[#d2dec9]">
        <button
          onClick={() => setActiveSubTab('asesor')}
          className={`flex-1 py-2 px-3 text-[13px] font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'asesor'
              ? 'bg-white text-[#22331d] shadow-2xs'
              : 'text-[#5d7355] hover:text-[#22331d]'
          }`}
        >
          <Bot className="w-4 h-4 text-[#526b4a]" />
          <span>Chatbot SED Experto (Diagnóstico & RAG)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('rules')}
          className={`flex-1 py-2 px-3 text-[13px] font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'rules'
              ? 'bg-white text-[#22331d] shadow-2xs'
              : 'text-[#5d7355] hover:text-[#22331d]'
          }`}
        >
          <Cpu className="w-4 h-4 text-[#526b4a]" />
          <span>Base de Reglas SED ({SED_RULES.length})</span>
        </button>
      </div>

      {/* TAB 1: CHATBOT SED EXPERTO */}
      {activeSubTab === 'asesor' && (
        <div className="space-y-3.5">
          {/* Header Card: Selector de ejemplar y estado de conectividad */}
          <div className="bg-white rounded-2xl p-3.5 border border-[#dce7d5] shadow-xs space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#e3eedb] text-[#334c2b] flex items-center justify-center shrink-0">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-botanical text-[18px] font-bold text-[#1f3019] leading-tight">
                    Chatbot Inteligente · Sistema Experto
                  </h3>
                  <p className="text-[11.5px] text-[#566e4e]">
                    Inferencia difusa neurosimbólica: evalúa reglas de producción y responde en tiempo real.
                  </p>
                </div>
              </div>

              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 self-start sm:self-center shrink-0 ${
                backendStatus ? 'bg-[#eef8eb] text-[#2d5f22] border border-[#c3e3ba]' : 'bg-[#fffbeb] text-[#92400e] border border-[#fde68a]'
              }`}>
                <Server className="w-3.5 h-3.5" />
                <span>{backendStatus ? 'FastAPI 8000 (ChromaDB)' : 'Modo Simulado'}</span>
              </span>
            </div>

            {/* Tarjeta de Planta en Foco y Selector */}
            <div className="pt-2 border-t border-[#edf3e8] flex flex-col gap-2">
              <div className="bg-[#f2f7ef] rounded-2xl p-2.5 border border-[#d6e3cf] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-[#c4d6bc] shadow-2xs">
                    <img
                      src={currentSp.imageUrl}
                      alt={currentSp.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <span
                      className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                        currentSp.status === 'critical' ? 'bg-[#ef4444]' : currentSp.status === 'attention' ? 'bg-[#f59e0b]' : 'bg-[#10b981]'
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] uppercase font-bold text-[#556d4e] tracking-wider">Planta Activa:</span>
                      <select
                        id="select-plant-focus"
                        value={selectedSpecimenId}
                        onChange={(e) => setSelectedSpecimenId(e.target.value)}
                        className="bg-white text-[#22331d] text-[13px] font-bold py-0.5 px-2 rounded-lg border border-[#cad7c1] focus:outline-none focus:border-[#526b4a] cursor-pointer"
                      >
                        {specimens.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.commonName || s.scientificName})
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-[11px] text-[#5b7354] truncate mt-0.5">
                      {currentSp.scientificName} · {currentSp.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <span className="bg-white text-[11px] font-semibold px-2 py-0.5 rounded-lg border border-[#d8e4d2] text-[#334d2a]">
                    💧 Suelo: <strong>{currentSp.soilMoisture}%</strong>
                  </span>
                  <span className="bg-white text-[11px] font-semibold px-2 py-0.5 rounded-lg border border-[#d8e4d2] text-[#334d2a]">
                    🌡️ <strong>{currentSp.temperature}°C</strong>
                  </span>
                  <span className="bg-white text-[11px] font-semibold px-2 py-0.5 rounded-lg border border-[#d8e4d2] text-[#334d2a]">
                    💨 HR: <strong>{currentSp.humidity}%</strong>
                  </span>
                  <button
                    onClick={() => setShowCustomModal(true)}
                    className="bg-white hover:bg-[#edf5e7] text-[#2d4624] text-[11px] font-bold py-1 px-2.5 rounded-lg border border-[#c6d9bf] flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Ajustar</span>
                  </button>
                </div>
              </div>

              {/* Preguntas Sugeridas Específicas para esta Planta */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10.5px] font-bold text-[#516749] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#526b4a]" />
                  <span>Preguntas sobre {currentSp.name}:</span>
                </span>
                {getPreguntasSugeridas(currentSp).map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p.query)}
                    disabled={isAskingRAG}
                    className="text-[11px] font-medium bg-white hover:bg-[#eef5eb] text-[#293d22] px-2.5 py-0.5 rounded-full border border-[#cad8c3] shadow-2xs transition-all active:scale-95 cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chips de Diagnóstico Rápido e Inmediato */}
            <div className="pt-2 border-t border-[#edf3e8]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#697d62] block mb-1.5">
                ⚡ Pruebas con Reglas de Producción Mamdani:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() =>
                    ejecutarDiagnosticoChat({
                      hvs: 20,
                      ta: 35,
                      hr: 40,
                      userQuery: `Diagnosticar ${currentSp.name} con caso crítico: Suelo 20%, Temperatura 35°C, Humedad 40%`,
                      specimen: currentSp,
                    })
                  }
                  disabled={isAskingRAG}
                  className="text-[11px] font-semibold bg-[#fee2e2] hover:bg-[#fecaca] text-[#991b1b] px-2.5 py-1 rounded-full border border-[#fca5a5] flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Flame className="w-3 h-3 text-[#dc2626]" />
                  <span>🔴 Caso Crítico (REG-01)</span>
                </button>

                <button
                  onClick={() =>
                    ejecutarDiagnosticoChat({
                      hvs: 85,
                      ta: 26,
                      hr: 88,
                      userQuery: `Evaluar riesgo fitosanitario para ${currentSp.name}: Suelo 85%, Temp 26°C, HR 88%`,
                      specimen: currentSp,
                    })
                  }
                  disabled={isAskingRAG}
                  className="text-[11px] font-semibold bg-[#fef3c7] hover:bg-[#fde68a] text-[#92400e] px-2.5 py-1 rounded-full border border-[#fcd34d] flex items-center gap-1 transition-all cursor-pointer"
                >
                  <ShieldAlert className="w-3 h-3 text-[#d97706]" />
                  <span>🟠 Riesgo Fitosanitario (REG-11)</span>
                </button>

                <button
                  onClick={() =>
                    ejecutarDiagnosticoChat({
                      hvs: 55,
                      ta: 22,
                      hr: 50,
                      userQuery: `Evaluar condición óptima para ${currentSp.name}: Suelo 55%, Temp 22°C, HR 50%`,
                      specimen: currentSp,
                    })
                  }
                  disabled={isAskingRAG}
                  className="text-[11px] font-semibold bg-[#ecfdf5] hover:bg-[#d1fae5] text-[#065f46] px-2.5 py-1 rounded-full border border-[#a7f3d0] flex items-center gap-1 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-3 h-3 text-[#10b981]" />
                  <span>🟢 Caso Óptimo (REG-08)</span>
                </button>

                <button
                  onClick={() =>
                    ejecutarDiagnosticoChat({
                      hvs: currentSp.soilMoisture,
                      ta: currentSp.temperature,
                      hr: currentSp.humidity,
                      userQuery: `¿Cuál es el diagnóstico actual de ${currentSp.name}? (Suelo ${currentSp.soilMoisture}%, Temp ${currentSp.temperature}°C, HR ${currentSp.humidity}%)`,
                      specimen: currentSp,
                    })
                  }
                  disabled={isAskingRAG}
                  className="text-[11px] font-semibold bg-[#f0f6ec] hover:bg-[#e2edd9] text-[#2c4424] px-2.5 py-1 rounded-full border border-[#d2dec9] flex items-center gap-1 transition-all cursor-pointer"
                >
                  <span>🌿 Diagnosticar {currentSp.name}</span>
                </button>

                <button
                  onClick={() => handleSendMessage('¿Cuáles son las 20 reglas difusas de Mamdani?')}
                  disabled={isAskingRAG}
                  className="text-[11px] font-semibold bg-white hover:bg-[#f6f9f3] text-[#4d6643] px-2.5 py-1 rounded-full border border-[#d4e2cd] transition-all cursor-pointer"
                >
                  📋 Ver 20 Reglas SED
                </button>
              </div>
            </div>
          </div>

          {/* Chat Messages Feed */}
          <div
            ref={chatContainerRef}
            className="bg-[#f6f9f3] rounded-[24px] p-4 border border-[#dce7d5] min-h-[380px] max-h-[520px] overflow-y-auto space-y-3.5 scroll-smooth"
          >
            {chatMessages.map((msg) => {
              const isUser = msg.sender === 'user';
              const diag = msg.diagnostic;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[92%] sm:max-w-[85%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-2xs ${
                      isUser
                        ? 'bg-[#526b4a] text-white rounded-br-xs'
                        : 'bg-white text-[#22331d] border border-[#dce7d5] rounded-bl-xs space-y-3'
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#edf3e8] text-[11px]">
                        <span className="font-bold text-[#566f4e] flex items-center gap-1.5">
                          <Bot className="w-3.5 h-3.5 text-[#526b4a]" />
                          <span>Sistema Experto Botánico (SED + RAG)</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          msg.source === 'backend' ? 'bg-[#e2f3df] text-[#26591d]' : 'bg-[#fef3c7] text-[#92400e]'
                        }`}>
                          {msg.source === 'backend' ? '✓ Inferencia FastAPI' : 'Inferencia Local'}
                        </span>
                      </div>
                    )}

                    <p className="whitespace-pre-line">{msg.text}</p>

                    {/* EMBEDDED DIAGNOSTIC CARD */}
                    {diag && (
                      <div className="bg-[#fcfdfa] rounded-2xl p-3.5 border border-[#d9e6d1] space-y-3 text-[#21331c] shadow-2xs">
                        <div className="flex items-center justify-between flex-wrap gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${
                              diag.prioridadRiego > 65 || diag.riesgoFitosanitario > 75
                                ? 'bg-[#ef4444] animate-pulse'
                                : diag.prioridadRiego > 35 || diag.riesgoFitosanitario > 50
                                ? 'bg-[#f59e0b]'
                                : 'bg-[#10b981]'
                            }`} />
                            <span className="font-bold text-[14px] text-[#1c2e17]">
                              Diagnóstico para {diag.specimenName}
                            </span>
                          </div>

                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            diag.prioridadRiego > 65
                              ? 'bg-[#fee2e2] text-[#b91c1c]'
                              : diag.riesgoFitosanitario > 60
                              ? 'bg-[#fef3c7] text-[#b45309]'
                              : 'bg-[#ecfdf5] text-[#047857]'
                          }`}>
                            {diag.prioridadRiego > 65
                              ? '🚨 Prioridad de Riego Crítica'
                              : diag.riesgoFitosanitario > 60
                              ? '⚠️ Alerta Fitosanitaria'
                              : '✅ Condición Estable'}
                          </span>
                        </div>

                        {/* Variables Crisp de Entrada */}
                        <div className="grid grid-cols-3 gap-1.5 bg-[#f4f8f0] p-2 rounded-xl text-center border border-[#e2ebd9] text-[11.5px]">
                          <div>
                            <span className="block text-[10px] font-medium text-[#5c7255]">HVS (Suelo)</span>
                            <strong className={`font-bold ${diag.hvs < 25 ? 'text-[#dc2626]' : 'text-[#21331c]'}`}>
                              {diag.hvs}%
                            </strong>
                          </div>
                          <div>
                            <span className="block text-[10px] font-medium text-[#5c7255]">TA (Temp)</span>
                            <strong className={`font-bold ${diag.ta >= 35 ? 'text-[#ea580c]' : 'text-[#21331c]'}`}>
                              {diag.ta}°C
                            </strong>
                          </div>
                          <div>
                            <span className="block text-[10px] font-medium text-[#5c7255]">HR (Ambiente)</span>
                            <strong className={`font-bold ${diag.hr > 80 ? 'text-[#d97706]' : 'text-[#21331c]'}`}>
                              {diag.hr}%
                            </strong>
                          </div>
                        </div>

                        {/* Resultados Desfuzificados Mamdani */}
                        <div className="space-y-1.5 bg-white p-2.5 rounded-xl border border-[#e6efe1]">
                          <div className="flex items-center justify-between text-[11.5px]">
                            <span className="font-semibold text-[#38512f] flex items-center gap-1">
                              <Droplets className="w-3.5 h-3.5 text-[#0284c7]" />
                              <span>Prioridad de Riego calculada:</span>
                            </span>
                            <span className={`font-bold text-[13px] ${diag.prioridadRiego > 65 ? 'text-[#dc2626]' : 'text-[#20321a]'}`}>
                              {diag.prioridadRiego}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-[#e8f0e4] rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-700 ${
                                diag.prioridadRiego > 80 ? 'bg-[#ef4444]' : diag.prioridadRiego > 65 ? 'bg-[#f97316]' : diag.prioridadRiego > 35 ? 'bg-[#f59e0b]' : 'bg-[#10b981]'
                              }`}
                              style={{ width: `${Math.min(diag.prioridadRiego, 100)}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11.5px] pt-1">
                            <span className="font-semibold text-[#38512f] flex items-center gap-1">
                              <ShieldAlert className="w-3.5 h-3.5 text-[#d97706]" />
                              <span>Riesgo Fitosanitario calculado:</span>
                            </span>
                            <span className={`font-bold text-[13px] ${diag.riesgoFitosanitario > 65 ? 'text-[#dc2626]' : 'text-[#20321a]'}`}>
                              {diag.riesgoFitosanitario}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-[#e8f0e4] rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-700 ${
                                diag.riesgoFitosanitario > 75 ? 'bg-[#ef4444]' : diag.riesgoFitosanitario > 50 ? 'bg-[#f59e0b]' : 'bg-[#10b981]'
                              }`}
                              style={{ width: `${Math.min(diag.riesgoFitosanitario, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Reglas Mamdani Activadas */}
                        {diag.reglasActivadas.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#546b4c] block">
                              Reglas de producción disparadas por el SED:
                            </span>
                            {diag.reglasActivadas.map((regla) => (
                              <div key={regla.id} className="bg-[#f5f9f2] p-2 rounded-xl border border-[#dfeada] text-[11.5px] space-y-0.5">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono font-bold text-[11px] bg-[#dce8d5] text-[#263a20] px-1.5 py-0.5 rounded">
                                    {regla.code}
                                  </span>
                                  <span className="font-bold text-[#23351d] truncate max-w-[200px]">
                                    {regla.name}
                                  </span>
                                </div>
                                <p className="font-mono text-[10.5px] text-[#4d6645]">
                                  {regla.antecedent} ➔ {regla.consequent}
                                </p>
                                <p className="text-[11px] text-[#2c4025]">
                                  💡 <strong>Acción recomendada:</strong> {regla.recommendedAction}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Botones interactivos en el chat */}
                        <div className="flex items-center gap-2 pt-2 border-t border-[#e2edd8]">
                          {diag.prioridadRiego > 65 && !diag.isWatered && (
                            <button
                              onClick={() => handleWaterFromChat(msg.id, diag.specimenId, diag.specimenName)}
                              className="flex-1 bg-[#526b4a] hover:bg-[#42573a] text-white text-[12px] font-bold py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                            >
                              <Droplets className="w-3.5 h-3.5" />
                              <span>Aplicar Riego Inmediato</span>
                            </button>
                          )}

                          {diag.isWatered && (
                            <div className="flex-1 bg-[#ecfdf5] text-[#065f46] text-[11.5px] font-bold py-1.5 px-3 rounded-xl flex items-center justify-center gap-1 border border-[#a7f3d0]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Riego registrado en bitácora</span>
                            </div>
                          )}

                          <button
                            onClick={() => {
                              const sp = specimens.find((s) => s.id === diag.specimenId);
                              if (sp) onSelectSpecimenForModal?.(sp);
                            }}
                            className="bg-white hover:bg-[#f6f9f3] text-[#344d2d] text-[11.5px] font-semibold py-1.5 px-3 rounded-xl border border-[#cad7c2] flex items-center justify-center gap-1 transition-all cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Ver Ejemplar</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {!isUser && msg.rawPayload && (
                      <div className="pt-1.5 border-t border-[#edf3e8]">
                        <button
                          onClick={() => setShowRawPayloadModal(msg.rawPayload || '')}
                          className="text-[11px] text-[#4d6644] hover:text-[#23351d] font-semibold flex items-center gap-1 underline cursor-pointer"
                        >
                          <Terminal className="w-3.5 h-3.5" />
                          <span>Inspeccionar System Prompt inyectado al LLM (TP2)</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-[#788e72] mt-0.5 px-1">{msg.timestamp}</span>
                </div>
              );
            })}

            {isAskingRAG && (
              <div className="flex items-center gap-2.5 p-3 text-[12.5px] text-[#435c3a] bg-white rounded-2xl border border-[#dce7d5] w-fit shadow-2xs animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin text-[#526b4a]" />
                <span>Ejecutando motor difuso (SED) y recuperando literatura en ChromaDB...</span>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={() => setShowCustomModal(true)}
              className="bg-white hover:bg-[#f3f7ef] text-[#465f3f] p-3 rounded-2xl border border-[#dbe6d3] shadow-2xs transition-all shrink-0 cursor-pointer"
              title="Ingresar valores personalizados de sensores"
            >
              <Sliders className="w-4.5 h-4.5" />
            </button>

            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Escribe valores (ej: 'Suelo 20, Temp 35, HR 40') o consulta dudas botánicas..."
              disabled={isAskingRAG}
              className="flex-1 bg-white text-[13px] px-4 py-3 rounded-2xl border border-[#dbe6d3] focus:outline-none focus:border-[#526b4a] text-[#22331d] placeholder:text-[#8ba087]"
            />

            <button
              type="submit"
              disabled={isAskingRAG || !chatInput.trim()}
              className="bg-[#526b4a] hover:bg-[#43573c] disabled:opacity-50 text-white p-3 rounded-2xl shadow-2xs transition-all shrink-0 cursor-pointer active:scale-95"
              title="Enviar al Chatbot"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: BASE DE REGLAS DE MAMADANI (20 REGLAS) */}
      {activeSubTab === 'rules' && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-3.5 border border-[#dce7d5] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {['all', 'Riego', 'Fitosanitario'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setRuleCategoryFilter(cat)}
                  className={`px-3 py-1 text-[11.5px] rounded-full font-bold transition-all cursor-pointer ${
                    ruleCategoryFilter === cat
                      ? 'bg-[#526b4a] text-white shadow-2xs'
                      : 'bg-[#f0f5ec] text-[#556c4e] hover:bg-[#e4edd9]'
                  }`}
                >
                  {cat === 'all' ? `Todas las Reglas (${SED_RULES.length})` : cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#73886e]" />
              <input
                type="text"
                value={ruleSearch}
                onChange={(e) => setRuleSearch(e.target.value)}
                placeholder="Buscar regla por antecedente..."
                className="w-full bg-[#f9faf7] pl-9 pr-3 py-1.5 text-[12px] rounded-xl border border-[#dce7d5] focus:outline-none focus:border-[#526b4a]"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredRules.map((rule) => (
              <div
                key={rule.id}
                className="bg-white rounded-2xl p-4 border border-[#dce7d5] shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#dfead7] text-[#273820]">
                      {rule.code}
                    </span>
                    <span className="text-[13px] font-bold text-[#24351e]">
                      {rule.name}
                    </span>
                  </div>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${
                    rule.category === 'Riego' ? 'bg-[#e0f2fe] text-[#0369a1]' : 'bg-[#fef3c7] text-[#b45309]'
                  }`}>
                    {rule.category}
                  </span>
                </div>

                <div className="bg-[#f6f9f3] p-3 rounded-xl border border-[#e5edd4] font-mono text-[12px] text-[#203119] space-y-0.5">
                  <p><span className="text-[#68815f] font-semibold">IF:</span> {rule.antecedent}</p>
                  <p><span className="text-[#3b5233] font-bold">THEN:</span> {rule.consequent}</p>
                </div>

                <p className="text-[12px] text-[#4d6345] leading-relaxed">
                  <strong>Justificación Agronómica:</strong> {rule.explanation}
                </p>

                <div className="text-[11.5px] text-[#2d4126] bg-[#eef5e9] p-2.5 rounded-xl flex items-start gap-1.5">
                  <span className="font-bold shrink-0">Acción sugerida:</span>
                  <span>{rule.recommendedAction}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL INGRESO DE VALORES PERSONALIZADOS PARA EL CHATBOT */}
      {showCustomModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#dce7d5] shadow-2xl p-5 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-[#edf3e8] pb-2.5">
              <div className="flex items-center gap-2">
                <Sliders className="w-4.5 h-4.5 text-[#526b4a]" />
                <h4 className="font-botanical text-[18px] font-bold text-[#20321b]">
                  Probar Parámetros en el Chatbot
                </h4>
              </div>
              <button
                onClick={() => setShowCustomModal(false)}
                className="p-1 text-[#6a8063] hover:text-[#21321b] rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[12px] text-[#556c4d]">
              Configura las 3 variables de entrada crisp del SED y el Chatbot evaluará las reglas difusas y responderá en el chat:
            </p>

            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between text-[12px] font-bold text-[#354e2d] mb-1">
                  <span>Humedad de Sustrato (HVS)</span>
                  <span className={customHvs < 25 ? 'text-[#dc2626]' : 'text-[#22331d]'}>{customHvs}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={customHvs}
                  onChange={(e) => setCustomHvs(Number(e.target.value))}
                  className="w-full accent-[#526b4a]"
                />
                <span className="text-[10px] text-[#6d8266]">
                  {customHvs < 25 ? 'Déficit hídrico severo' : customHvs > 75 ? 'Sustrato saturado' : 'Capacidad de campo adecuada'}
                </span>
              </div>

              <div>
                <div className="flex justify-between text-[12px] font-bold text-[#354e2d] mb-1">
                  <span>Temperatura Ambiental (TA)</span>
                  <span className={customTa >= 35 ? 'text-[#ea580c]' : 'text-[#22331d]'}>{customTa}°C</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="45"
                  value={customTa}
                  onChange={(e) => setCustomTa(Number(e.target.value))}
                  className="w-full accent-[#ea580c]"
                />
                <span className="text-[10px] text-[#6d8266]">
                  {customTa >= 35 ? 'Temperatura extrema' : customTa >= 25 ? 'Clima cálido' : customTa >= 15 ? 'Clima templado' : 'Clima frío'}
                </span>
              </div>

              <div>
                <div className="flex justify-between text-[12px] font-bold text-[#354e2d] mb-1">
                  <span>Humedad Relativa Ambiental (HR)</span>
                  <span className={customHr > 80 ? 'text-[#d97706]' : 'text-[#22331d]'}>{customHr}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={customHr}
                  onChange={(e) => setCustomHr(Number(e.target.value))}
                  className="w-full accent-[#0284c7]"
                />
                <span className="text-[10px] text-[#6d8266]">
                  {customHr > 75 ? 'Humedad relativa alta (riesgo fúngico)' : customHr < 45 ? 'Ambiente seco (déficit VPD)' : 'Humedad media balanceada'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#edf3e8]">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="flex-1 py-2 px-3 text-[12px] font-semibold text-[#576e50] hover:bg-[#f0f5ec] rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCustomModal(false);
                  ejecutarDiagnosticoChat({
                    hvs: customHvs,
                    ta: customTa,
                    hr: customHr,
                    userQuery: `Diagnóstico para ${currentSp.name}: HVS ${customHvs}%, TA ${customTa}°C, HR ${customHr}%`,
                    specimen: currentSp,
                  });
                }}
                className="flex-1 bg-[#526b4a] hover:bg-[#43573c] text-white py-2 px-3 text-[12px] font-bold rounded-xl shadow-2xs cursor-pointer active:scale-95"
              >
                Enviar al Chatbot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA INSPECCIONAR SYSTEM PROMPT INYECTADO */}
      {showRawPayloadModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#dce7d5] shadow-2xl p-5 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-3">
            <div className="flex items-center justify-between border-b border-[#edf3e8] pb-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#526b4a]" />
                <h4 className="font-bold text-[14px] text-[#22331d]">
                  System Prompt Inyectado (Payload Neurosimbólico)
                </h4>
              </div>
              <button
                onClick={() => setShowRawPayloadModal(null)}
                className="text-[12px] font-bold text-[#62775b] hover:text-[#203119] px-2 py-1 rounded-lg cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            <p className="text-[11.5px] text-[#586f50]">
              Este es el texto exacto generado por el backend en <code>rag_pipeline.py</code> que concatena la memoria de trabajo transaccional del SED con los vectores recuperados de ChromaDB por similitud del coseno:
            </p>

            <pre className="bg-[#1f291e] text-[#e2f1de] p-3.5 rounded-xl text-[11px] font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto border border-[#3b4e39]">
              {showRawPayloadModal}
            </pre>

            <div className="text-right">
              <button
                onClick={() => setShowRawPayloadModal(null)}
                className="bg-[#526b4a] text-white px-4 py-1.5 rounded-xl text-[12px] font-semibold cursor-pointer"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
