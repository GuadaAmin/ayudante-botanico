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
import { SED_RULES, determinarReglasDisparadas, INITIAL_SPECIMENS } from '../data/botanicalData';
import { 
  consultarAsesorRAG, 
  evaluarSED,
  extractPlantaId, 
  checkBackendHealth,
  AsesorResponse
} from '../services/api';
import ReactMarkdown from 'react-markdown';
import { getAllRAGDocuments } from '../services/customBotanicalStorage';
import { BrotiBot, BrotiMood } from './BrotiBot';

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
  const effectiveSpecimens = (specimens && specimens.length > 0) ? specimens : INITIAL_SPECIMENS;
  const [activeSubTab, setActiveSubTab] = useState<'asesor' | 'rules'>('asesor');
  
  // Specimen selection for context injection
  const [selectedSpecimenId, setSelectedSpecimenId] = useState<string>(
    selectedSpecimenForDiag?.id || effectiveSpecimens[0]?.id || ''
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

  // Broti Bot Companion State
  const [isBrotiWatering, setIsBrotiWatering] = useState(false);

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

  const currentSp = effectiveSpecimens.find((s) => s.id === selectedSpecimenId) || effectiveSpecimens[0];
  const numericPlantaId = extractPlantaId(currentSp?.id || '1');

  const getPreguntasSugeridas = (sp: Specimen) => {
    const common = (sp?.commonName || sp?.name || '').toLowerCase();
    if (common.includes('lapacho')) {
      return [
        { label: ' Estimular Floración', query: `¿Cómo estimular la floración del ${sp.name} y cuándo entra en reposo hídrico?` },
        { label: ' Déficit Hídrico', query: `¿Qué efectos produce el déficit hídrico en ${sp.name} y cuánto regar?` },
        { label: ' Poda y Cuidados', query: `¿En qué época se poda el ${sp.name} y cómo proteger sus ramas?` }
      ];
    } else if (common.includes('jacarand')) {
      return [
        { label: ' Riego y Hongos', query: `¿Por qué el exceso de agua pudre las raíces del ${sp.name} por Phytophthora?` },
        { label: ' Arañuela y Plagas', query: `¿Qué plagas atacan al ${sp.name} con calor y baja humedad?` },
        { label: ' Suelo y Drenaje', query: `¿Qué tipo de suelo requiere el ${sp.name} para un crecimiento óptimo?` }
      ];
    } else if (common.includes('santa rita') || common.includes('buganvilla')) {
      return [
        { label: ' ¿Por qué no florece?', query: `¿Por qué la ${sp.name} no florece y cómo influye el exceso de agua?` },
        { label: ' Cochinillas y Plagas', query: `¿Cómo tratar cochinillas algodonosas en ${sp.name}?` },
        { label: ' Insolación y Poda', query: `¿Cuánta insolación necesita la ${sp.name} y cómo guiarla en pérgola?` }
      ];
    } else if (common.includes('ceibo')) {
      return [
        { label: ' Suelos Inundados', query: `¿El ${sp.name} tolera suelos anegados y cómo responde al exceso hídrico?` },
        { label: ' Protección de Heladas', query: `¿Qué temperatura mínima soporta el ${sp.name} y cómo protegerlo de heladas?` },
        { label: ' Floración Carmesí', query: `¿Cuándo florece el ${sp.name} y qué cuidados fitosanitarios requiere?` }
      ];
    } else if (common.includes('ceiba') || common.includes('palo borracho')) {
      return [
        { label: ' Reserva del Tronco', query: `¿Cómo funciona la reserva hídrica del tronco de ${sp.name} ante sequía?` },
        { label: ' Humedad y Antracnosis', query: `¿Qué hongos proliferan en ${sp.name} si la humedad relativa supera el 80%?` },
        { label: ' Exposición Solar', query: `¿Qué cuidados de suelo y sol requiere ${sp.name}?` }
      ];
    } else if (common.includes('jazm')) {
      return [
        { label: ' Hojas Amarillas', query: `¿Por qué amarillean las hojas de ${sp.name} y cómo aplicar quelatos de hierro?` },
        { label: ' Hongos por Humedad', query: `¿Qué hongos proliferan en ${sp.name} con alta humedad y calor?` },
        { label: ' Aroma Nocturno', query: `¿Qué sustrato necesita ${sp.name} para potenciar su aroma y floración?` }
      ];
    } else {
      return [
        { label: ` Riego para ${sp.name}`, query: `¿Cuál es el régimen de riego recomendado para ${sp.name} según el SED?` },
        { label: ` Riesgos Fitosanitarios`, query: `¿Qué plagas u hongos pueden afectar a ${sp.name} con los valores actuales?` },
        { label: ` Cuidados de ${sp.name}`, query: `¿Qué pautas de abonado y poda recomiendas para ${sp.name}?` }
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

      // Verificar literatura RAG personalizada para esta planta
      const allRAG = getAllRAGDocuments();
      const customDocs = allRAG.filter((d) =>
        d.tags.some(
          (t) =>
            t.toLowerCase() === specimen.commonName.toLowerCase() ||
            t.toLowerCase() === specimen.scientificName.toLowerCase()
        ) || d.title.toLowerCase().includes(specimen.commonName.toLowerCase())
      );

      let effectiveLit = resRag.parsedContext?.literatura;
      if (customDocs.length > 0 && (!effectiveLit || effectiveLit.length === 0 || !effectiveLit.some(l => l.toLowerCase().includes(specimen.commonName.toLowerCase())))) {
        effectiveLit = customDocs.map((d) => d.content);
      }

      const introText = resRag.respuesta_experta || 
        `He evaluado la telemetría de **${specimen.name}** utilizando el **Motor de Inferencia Difusa (Mamdani)** y la base de conocimiento de ChromaDB.`;

      const botMessage: ChatMessage = {
        id: `bot-diag-${Date.now()}`,
        sender: 'assistant',
        text: introText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        rawPayload: resRag.payload_llm,
        sedContext: resRag.parsedContext?.estado_sed,
        retrievedDocs: effectiveLit,
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
          literaturaRecuperada: effectiveLit,
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

      // Verificar si hay literatura RAG personalizada para esta planta actual
      const allRAG = getAllRAGDocuments();
      const customDocs = allRAG.filter((d) =>
        currentSp && (
          d.tags.some(
            (t) =>
              t.toLowerCase() === currentSp.commonName.toLowerCase() ||
              t.toLowerCase() === currentSp.scientificName.toLowerCase()
          ) || d.title.toLowerCase().includes(currentSp.commonName.toLowerCase())
        )
      );

      let effectiveLit = response.parsedContext?.literatura;
      if (customDocs.length > 0 && (!effectiveLit || effectiveLit.length === 0 || !effectiveLit.some(l => l.toLowerCase().includes(currentSp?.commonName.toLowerCase())))) {
        effectiveLit = customDocs.map((d) => d.content);
      }

      let synthesizedAnswer = '';
      if (response.respuesta_experta && (!customDocs.length || response.respuesta_experta.toLowerCase().includes(currentSp?.commonName.toLowerCase()))) {
        synthesizedAnswer = response.respuesta_experta;
      } else if (effectiveLit && effectiveLit.length > 0) {
        synthesizedAnswer = `Según los manuales botánicos de **${currentSp?.name || 'la especie'}** recuperados en la base de conocimiento:\n\n${effectiveLit.map((lit) => `• "${lit}"`).join('\n\n')}\n\n**Recomendación del Asesor:** Con Prioridad de Riego de ${currentSp?.irrigationPriority ?? 0}% y Riesgo Fitosanitario de ${currentSp?.phytosanitaryRisk ?? 0}%, se aconseja adaptar las tareas a las pautas de las reglas Mamdani y los requerimientos de la especie.`;
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
        retrievedDocs: effectiveLit,
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
    setIsBrotiWatering(true);
    setTimeout(() => setIsBrotiWatering(false), 3000);

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
      text: `**Riego de Auxilio Aplicado:** Se ha suministrado riego inmediato a **${specimenName}**. El evento ha sido guardado en la bitácora del ejemplar y la prioridad de riego ha sido mitigada en el semáforo general.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'local'
    };
    setChatMessages((prev) => [...prev, confirmMsg]);
  };

  const handleWaterFromBroti = () => {
    if (!currentSp) return;
    onWaterSpecimen?.(currentSp.id);
    setIsBrotiWatering(true);
    setTimeout(() => setIsBrotiWatering(false), 3000);

    const confirmMsg: ChatMessage = {
      id: `bot-water-${Date.now()}`,
      sender: 'assistant',
      text: `**Riego de Auxilio Aplicado:** Se ha suministrado riego inmediato a **${currentSp.name}**. El evento ha sido guardado en la bitácora del ejemplar y la prioridad de riego ha sido mitigada en el semáforo general.`,
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
        <div className="space-y-3">
          {/* Barra Superior Compacta: Planta en Foco y Telemetría en Vivo */}
          <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-[#d2decb] shadow-xs flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-9 h-9 rounded-xl overflow-hidden shrink-0 border border-[#c4d6bc]">
                <img
                  src={currentSp.imageUrl}
                  alt={currentSp.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <span
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                    currentSp.status === 'critical' ? 'bg-[#ef4444]' : currentSp.status === 'attention' ? 'bg-[#f59e0b]' : 'bg-[#10b981]'
                  }`}
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-[#556d4e]">Monitoreando:</span>
                <select
                  id="select-plant-focus"
                  value={selectedSpecimenId}
                  onChange={(e) => setSelectedSpecimenId(e.target.value)}
                  className="bg-[#f2f7ef] text-[#22331d] text-[12.5px] font-bold py-1 px-2.5 rounded-xl border border-[#c7d7bf] focus:outline-none focus:border-[#526b4a] cursor-pointer"
                >
                  {effectiveSpecimens.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.commonName || s.scientificName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Telemetría en Vivo y Botón de Parámetros */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="bg-[#f4f8f0] text-[11px] font-semibold px-2 py-1 rounded-lg border border-[#dbe6d5] text-[#334d2a]">
                Suelo: <strong>{currentSp.soilMoisture}%</strong>
              </span>
              <span className="bg-[#f4f8f0] text-[11px] font-semibold px-2 py-1 rounded-lg border border-[#dbe6d5] text-[#334d2a]">
                Temp: <strong>{currentSp.temperature}°C</strong>
              </span>
              <span className="bg-[#f4f8f0] text-[11px] font-semibold px-2 py-1 rounded-lg border border-[#dbe6d5] text-[#334d2a]">
                HR: <strong>{currentSp.humidity}%</strong>
              </span>
              <button
                onClick={() => setShowCustomModal(true)}
                className="bg-[#526b4a] hover:bg-[#43573c] text-white text-[11px] font-bold py-1 px-2.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                title="Ajustar parámetros telemétricos"
              >
                <Sliders className="w-3 h-3" />
                <span>Simular</span>
              </button>
            </div>
          </div>

          {/* Grid Principal: Broti el Robotito Botánico + Chat Feed Prominente */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
            
            {/* Columna Izquierda: Broti Bot Companion */}
            <div className="lg:col-span-4">
              <BrotiBot
                mood={
                  isBrotiWatering
                    ? 'watering'
                    : isAskingRAG
                    ? 'thinking'
                    : ((chatMessages[chatMessages.length - 1]?.diagnostic?.prioridadRiego ?? 0) > 65 || (currentSp?.irrigationPriority ?? 0) > 65)
                    ? 'thirsty'
                    : 'happy'
                }
                specimenName={currentSp?.name || 'Jacarandá'}
                onWater={handleWaterFromBroti}
              />
            </div>

            {/* Columna Derecha: Chat Feed y Barra de Entrada */}
            <div className="lg:col-span-8 space-y-2.5">
              
              {/* Tarjeta Contenedora Principal del Chat con Encabezado */}
              <div className="bg-white rounded-3xl border-2 border-[#cfe2cc] shadow-md overflow-hidden flex flex-col">
                {/* Header del Chat Feed */}
                <div className="px-4 py-2.5 bg-[#f6faf3] border-b border-[#cfe2cc] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#e0efdc] text-[#38562d] flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-bold text-[#20321a] leading-tight">
                        Chatbot Asesor SED (Mamdani + RAG)
                      </h4>
                      <p className="text-[10.5px] text-[#556d4d]">
                        Inferencia difusa y recuperación semántica de ChromaDB
                      </p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    backendStatus ? 'bg-[#e7f5e4] text-[#245b1b] border border-[#bfe3b7]' : 'bg-[#fffbeb] text-[#92400e] border border-[#fde68a]'
                  }`}>
                    <Server className="w-3 h-3" />
                    <span>{backendStatus ? 'FastAPI 8000' : 'Modo Simulado'}</span>
                  </span>
                </div>

                {/* Feed de Mensajes con Scroll Interno */}
                <div
                  ref={chatContainerRef}
                  className="p-4 sm:p-5 min-h-[380px] max-h-[460px] overflow-y-auto space-y-3.5 scroll-smooth bg-gradient-to-b from-white to-[#fafcf9]"
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
                        className={`max-w-[92%] sm:max-w-[85%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-xs ${
                          isUser
                            ? 'bg-gradient-to-br from-[#4b6a42] to-[#36512e] text-white rounded-tr-xs'
                            : 'bg-white text-[#21331d] border border-[#d2e3cd] rounded-tl-xs space-y-3 shadow-xs'
                        }`}
                      >
                        {!isUser && (
                          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#edf3e8] text-[11px]">
                            <span className="font-bold text-[#456939] flex items-center gap-1.5">
                              <Bot className="w-3.5 h-3.5 text-[#4b6a42]" />
                              <span>Sistema Experto Botánico (SED + RAG)</span>
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              msg.source === 'backend'
                                ? 'bg-[#e7f5e4] text-[#245b1b] border-[#bfe3b7]'
                                : 'bg-[#fffbeb] text-[#92400e] border-[#fde68a]'
                            }`}>
                              {msg.source === 'backend' ? 'Inferencia FastAPI' : 'Inferencia Local'}
                            </span>
                          </div>
                        )}

                        <div className={`whitespace-pre-line prose prose-sm max-w-none ${
                          isUser ? 'text-white prose-invert' : 'text-[#22331d]'
                        }`}>
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>

                        {/* EMBEDDED DIAGNOSTIC CARD */}
                        {diag && (
                          <div className="bg-[#f8fbf6] rounded-2xl p-3.5 border border-[#d3e3ce] space-y-3 text-[#21331c] shadow-2xs">
                            <div className="flex items-center justify-between flex-wrap gap-1.5">
                              <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${
                                  diag.prioridadRiego > 65 || diag.riesgoFitosanitario > 75
                                    ? 'bg-[#ef4444] animate-pulse'
                                    : diag.prioridadRiego > 35 || diag.riesgoFitosanitario > 50
                                    ? 'bg-[#f59e0b]'
                                    : 'bg-[#10b981]'
                                }`} />
                                <span className="font-bold text-[13.5px] text-[#1c2e17]">
                                  Diagnóstico para {diag.specimenName}
                                </span>
                              </div>

                              <span className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border ${
                                diag.prioridadRiego > 65
                                  ? 'bg-[#fee2e2] text-[#b91c1c] border-[#fca5a5]'
                                  : diag.riesgoFitosanitario > 60
                                  ? 'bg-[#fef3c7] text-[#b45309] border-[#fcd34d]'
                                  : 'bg-[#ecfdf5] text-[#047857] border-[#a7f3d0]'
                              }`}>
                                {diag.prioridadRiego > 65
                                  ? 'Prioridad de Riego Crítica'
                                  : diag.riesgoFitosanitario > 60
                                  ? 'Alerta Fitosanitaria'
                                  : 'Condición Estable'}
                              </span>
                            </div>

                            {/* Variables Crisp de Entrada */}
                            <div className="grid grid-cols-3 gap-2 bg-white p-2 rounded-xl text-center border border-[#dbe8d7] text-[11px] font-mono shadow-2xs">
                              <div>
                                <span className="block text-[9.5px] font-medium text-[#5c7255] uppercase">HVS (Suelo)</span>
                                <strong className={`font-bold text-[12.5px] ${diag.hvs < 25 ? 'text-[#dc2626]' : 'text-[#21331c]'}`}>
                                  {diag.hvs}%
                                </strong>
                              </div>
                              <div>
                                <span className="block text-[9.5px] font-medium text-[#5c7255] uppercase">TA (Temp)</span>
                                <strong className={`font-bold text-[12.5px] ${diag.ta >= 35 ? 'text-[#ea580c]' : 'text-[#21331c]'}`}>
                                  {diag.ta}°C
                                </strong>
                              </div>
                              <div>
                                <span className="block text-[9.5px] font-medium text-[#5c7255] uppercase">HR (Ambiente)</span>
                                <strong className={`font-bold text-[12.5px] ${diag.hr > 80 ? 'text-[#d97706]' : 'text-[#21331c]'}`}>
                                  {diag.hr}%
                                </strong>
                              </div>
                            </div>

                            {/* Resultados Desfuzificados Mamdani */}
                            <div className="space-y-2 bg-white p-3 rounded-xl border border-[#dbe8d6] shadow-2xs">
                              <div>
                                <div className="flex items-center justify-between text-[11px] font-semibold text-[#324f28] mb-1">
                                  <span className="flex items-center gap-1">
                                    <Droplets className="w-3.5 h-3.5 text-[#0284c7]" />
                                    <span>Prioridad de Riego (Mamdani):</span>
                                  </span>
                                  <span className={`font-bold text-[12.5px] ${diag.prioridadRiego > 65 ? 'text-[#dc2626]' : 'text-[#20321a]'}`}>
                                    {diag.prioridadRiego}%
                                  </span>
                                </div>
                                <div className="w-full h-2 bg-[#e8f1e5] rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-700 ${
                                      diag.prioridadRiego > 80
                                        ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                                        : diag.prioridadRiego > 65
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                        : diag.prioridadRiego > 35
                                        ? 'bg-gradient-to-r from-emerald-500 to-amber-500'
                                        : 'bg-gradient-to-r from-teal-500 to-emerald-500'
                                    }`}
                                    style={{ width: `${Math.min(diag.prioridadRiego, 100)}%` }}
                                  />
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between text-[11px] font-semibold text-[#324f28] mb-1">
                                  <span className="flex items-center gap-1">
                                    <ShieldAlert className="w-3.5 h-3.5 text-[#d97706]" />
                                    <span>Riesgo Fitosanitario (Mamdani):</span>
                                  </span>
                                  <span className={`font-bold text-[12.5px] ${diag.riesgoFitosanitario > 65 ? 'text-[#dc2626]' : 'text-[#20321a]'}`}>
                                    {diag.riesgoFitosanitario}%
                                  </span>
                                </div>
                                <div className="w-full h-2 bg-[#e8f1e5] rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-700 ${
                                      diag.riesgoFitosanitario > 75
                                        ? 'bg-gradient-to-r from-orange-500 to-rose-500'
                                        : diag.riesgoFitosanitario > 50
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                        : 'bg-gradient-to-r from-teal-500 to-emerald-500'
                                    }`}
                                    style={{ width: `${Math.min(diag.riesgoFitosanitario, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Reglas Mamdani Activadas */}
                            {diag.reglasActivadas.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#546b4c] block">
                                  Reglas de producción disparadas por el SED:
                                </span>
                                {diag.reglasActivadas.map((regla) => (
                                  <div key={regla.id} className="bg-white p-2 rounded-xl border border-[#dce9d7] text-[11px] space-y-0.5 font-mono shadow-2xs">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-[10px] bg-[#dce8d5] text-[#263a20] px-1.5 py-0.5 rounded">
                                        {regla.code}
                                      </span>
                                      <span className="font-bold text-[#23351d] truncate max-w-[200px]">
                                        {regla.name}
                                      </span>
                                    </div>
                                    <p className="text-[10.5px] text-[#4d6645]">
                                      {regla.antecedent} -&gt; {regla.consequent}
                                    </p>
                                    <p className="text-[11px] text-[#2c4025] font-sans">
                                      <strong>Acción recomendada:</strong> {regla.recommendedAction}
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
                                  className="flex-1 bg-gradient-to-r from-sky-500 to-emerald-600 hover:from-sky-600 hover:to-emerald-700 text-white text-[12px] font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                                >
                                  <Droplets className="w-3.5 h-3.5" />
                                  <span>Aplicar Riego Inmediato</span>
                                </button>
                              )}

                              {diag.isWatered && (
                                <div className="flex-1 bg-[#ecfdf5] text-[#065f46] text-[11px] font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 border border-[#a7f3d0]">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Riego registrado en bitácora</span>
                                </div>
                              )}

                              <button
                                onClick={() => {
                                  const sp = specimens.find((s) => s.id === diag.specimenId);
                                  if (sp) onSelectSpecimenForModal?.(sp);
                                }}
                                className="bg-white hover:bg-[#f6f9f3] text-[#344d2d] text-[11.5px] font-semibold py-2 px-3 rounded-xl border border-[#cad7c2] flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
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
                  <div className="flex items-center gap-2.5 p-3 text-[12px] text-[#435c3a] bg-white rounded-2xl border border-[#dce7d5] w-fit shadow-2xs animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#526b4a]" />
                    <span>Ejecutando motor difuso (SED) y recuperando literatura en ChromaDB...</span>
                  </div>
                )}
              </div>

              {/* Chips de Preguntas Rápidas y Pruebas Mamdani */}
              <div className="px-3 pt-2.5 pb-2 border-t border-[#edf3e8] bg-[#fcfdfa] space-y-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                  <span className="font-bold text-[#566e4e] shrink-0 text-[10px] uppercase">Pruebas Mamdani:</span>
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
                    className="shrink-0 bg-[#fee2e2] hover:bg-[#fecaca] text-[#991b1b] px-2.5 py-0.5 rounded-full border border-[#fca5a5] font-semibold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs"
                  >
                    <Flame className="w-3 h-3 text-[#dc2626]" />
                    <span>Caso Crítico</span>
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
                    className="shrink-0 bg-[#fef3c7] hover:bg-[#fde68a] text-[#92400e] px-2.5 py-0.5 rounded-full border border-[#fcd34d] font-semibold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs"
                  >
                    <ShieldAlert className="w-3 h-3 text-[#d97706]" />
                    <span>Riesgo Fitosanitario</span>
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
                    className="shrink-0 bg-[#ecfdf5] hover:bg-[#d1fae5] text-[#065f46] px-2.5 py-0.5 rounded-full border border-[#a7f3d0] font-semibold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs"
                  >
                    <CheckCircle2 className="w-3 h-3 text-[#10b981]" />
                    <span>Caso Óptimo</span>
                  </button>
                  {getPreguntasSugeridas(currentSp).map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(p.query)}
                      disabled={isAskingRAG}
                      className="shrink-0 bg-white hover:bg-[#eef5eb] text-[#293d22] px-2.5 py-0.5 rounded-full border border-[#cad8c3] font-medium cursor-pointer transition-all active:scale-95 shadow-2xs"
                    >
                      {p.label}
                    </button>
                  ))}
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
                    className="bg-[#f0f5ec] hover:bg-[#e4edd9] text-[#465f3f] p-2.5 rounded-xl border border-[#d2dec9] shadow-2xs transition-all shrink-0 cursor-pointer"
                    title="Ingresar valores personalizados de sensores"
                  >
                    <Sliders className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Escribe valores (ej: 'Suelo 20, Temp 35, HR 40') o consulta dudas botánicas..."
                    disabled={isAskingRAG}
                    className="flex-1 bg-white text-[13px] px-3.5 py-2.5 rounded-xl border border-[#cad7c1] focus:outline-none focus:border-[#526b4a] text-[#22331d] placeholder:text-[#8ba087]"
                  />

                  <button
                    type="submit"
                    disabled={isAskingRAG || !chatInput.trim()}
                    className="bg-[#526b4a] hover:bg-[#43573c] disabled:opacity-50 text-white p-2.5 rounded-xl shadow-2xs transition-all shrink-0 cursor-pointer active:scale-95"
                    title="Enviar al Chatbot"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>

        </div>
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
