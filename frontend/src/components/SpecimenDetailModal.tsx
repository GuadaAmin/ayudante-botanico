import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2,
  Droplets, 
  Sparkles, 
  MapPin, 
  Calendar, 
  Thermometer, 
  Wind, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Send,
  MessageSquare,
  Activity,
  History,
  Server
} from 'lucide-react';
import { Specimen } from '../types';
import { evaluarSED, consultarAsesorRAG, extractPlantaId } from '../services/api';
import { getAllRAGDocuments } from '../services/customBotanicalStorage';

interface SpecimenDetailModalProps {
  specimen: Specimen | null;
  onClose: () => void;
  onWaterSpecimen: (specimenId: string) => void;
  onSpecimenEvaluated: (specimenId: string, result: { prioridad_riego: number; riesgo_fitosanitario: number }) => void;
  onDeleteSpecimen?: (specimenId: string) => void;
}

interface ChatMsg {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const SpecimenDetailModal: React.FC<SpecimenDetailModalProps> = ({
  specimen,
  onClose,
  onWaterSpecimen,
  onSpecimenEvaluated,
  onDeleteSpecimen
}) => {
  if (!specimen) return null;

  // Active section inside the modal
  const [modalTab, setModalTab] = useState<'estado' | 'chat_rag' | 'bitacora'>('estado');

  // Interactive SED telemetry sliders
  const [soilMoisture, setSoilMoisture] = useState<number>(specimen.soilMoisture);
  const [temperature, setTemperature] = useState<number>(specimen.temperature);
  const [humidity, setHumidity] = useState<number>(specimen.humidity);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [lastEvalResult, setLastEvalResult] = useState<{ pr: number; rf: number; fuente: string } | null>(null);

  // Bitácora state
  const [newLogNote, setNewLogNote] = useState('');
  const [showAddLog, setShowAddLog] = useState(false);

  // Chat RAG contextualizado state
  const [chatInput, setChatInput] = useState('');
  const [isAskingRAG, setIsAskingRAG] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      sender: 'assistant',
      text: `Hola, estoy contextualizado con la telemetría actual de ${specimen.name} (${specimen.scientificName}). ¿En qué puedo asesorarte sobre este ejemplar?`,
      timestamp: 'Ahora'
    }
  ]);

  // Sync state if specimen changes
  useEffect(() => {
    setSoilMoisture(specimen.soilMoisture);
    setTemperature(specimen.temperature);
    setHumidity(specimen.humidity);
  }, [specimen.id]);

  const isCritical = specimen.status === 'critical';
  const isAttention = specimen.status === 'attention';
  const numericPlantaId = extractPlantaId(specimen.id);

  /**
   * Ejecutar evaluación SED directa en la planta
   */
  const handleEvaluateSED = async () => {
    setIsEvaluating(true);
    try {
      const res = await evaluarSED({
        planta_id: numericPlantaId,
        humedad_sustrato: soilMoisture,
        temperatura_ambiental: temperature,
        humedad_relativa: humidity
      });

      const pr = res.diagnostico_sed.prioridad_riego;
      const rf = res.diagnostico_sed.riesgo_fitosanitario;

      setLastEvalResult({ pr, rf, fuente: res.fuente });
      onSpecimenEvaluated(specimen.id, { prioridad_riego: pr, riesgo_fitosanitario: rf });
    } catch (err) {
      console.error('Error evaluando instancia en modal:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  /**
   * Enviar consulta al RAG contextualizado para esta planta
   */
  const handleSendRAGQuery = async (queryText?: string) => {
    const text = queryText || chatInput;
    if (!text.trim() || isAskingRAG) return;

    const userMsg: ChatMsg = {
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsAskingRAG(true);

    try {
      const res = await consultarAsesorRAG({
        planta_id: numericPlantaId,
        mensaje: text,
        prioridad_riego: specimen.irrigationPriority,
        riesgo_fitosanitario: specimen.phytosanitaryRisk
      });

      // Verificar literatura RAG personalizada para este ejemplar
      const allRAG = getAllRAGDocuments();
      const customDocs = allRAG.filter((d) =>
        d.tags.some(
          (t) =>
            t.toLowerCase() === specimen.commonName.toLowerCase() ||
            t.toLowerCase() === specimen.scientificName.toLowerCase()
        ) || d.title.toLowerCase().includes(specimen.commonName.toLowerCase())
      );

      let effectiveLit = res.parsedContext?.literatura;
      if (customDocs.length > 0 && (!effectiveLit || effectiveLit.length === 0 || !effectiveLit.some(l => l.toLowerCase().includes(specimen.commonName.toLowerCase())))) {
        effectiveLit = customDocs.map((d) => d.content);
      }

      let responseText = '';
      if (res.respuesta_experta && (!customDocs.length || res.respuesta_experta.toLowerCase().includes(specimen.commonName.toLowerCase()))) {
        responseText = res.respuesta_experta;
      } else if (effectiveLit && effectiveLit.length > 0) {
        responseText = `${effectiveLit.map((l) => `• ${l}`).join('\n\n')}\n\nRecomendación adaptada al estado de **${specimen.name}** (Prioridad de Riego: ${specimen.irrigationPriority}%, Riesgo Fit.: ${specimen.phytosanitaryRisk}%).`;
      } else {
        responseText = res.payload_llm || 'Consulta procesada con éxito.';
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      console.error('Error en chat RAG de planta:', err);
    } finally {
      setIsAskingRAG(false);
    }
  };

  /**
   * Agregar nota a la bitácora
   */
  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogNote.trim()) return;

    specimen.history.unshift({
      id: `h-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'diagnostico',
      description: newLogNote,
      operator: 'Operador en Campo'
    });
    setNewLogNote('');
    setShowAddLog(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl border border-[#dce7d5] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Image Banner */}
        <div className="relative h-44 w-full bg-[#dfe9d7] shrink-0">
          <img
            src={specimen.imageUrl}
            alt={specimen.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />

          {/* Action buttons top right */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            {onDeleteSpecimen && (
              <button
                onClick={() => {
                  if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${specimen.name}?`)) {
                    onDeleteSpecimen(specimen.id);
                  }
                }}
                className="p-1.5 bg-black/40 hover:bg-[#dc2626]/80 text-white rounded-full transition-colors cursor-pointer"
                title="Eliminar ejemplar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Status Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-[11px] font-semibold">
            <span
              className={`w-2 h-2 rounded-full ${
                isCritical ? 'bg-[#ef4444]' : isAttention ? 'bg-[#f59e0b]' : 'bg-[#10b981]'
              }`}
            />
            <span className="capitalize">
              {isCritical ? 'Estado Crítico' : isAttention ? 'Requiere Atención' : 'Condición Estable'}
            </span>
          </div>

          {/* Bottom Title */}
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <h2 className="font-botanical text-[26px] font-bold leading-tight drop-shadow-sm">
              {specimen.name}
            </h2>
            <p className="text-[13px] italic text-white/90">
              {specimen.scientificName} · {specimen.family} · [ID: {numericPlantaId}]
            </p>
          </div>
        </div>

        {/* Navigation Tabs inside Detalle de Instancia */}
        <div className="flex border-b border-[#e4eedf] bg-[#f7faf5] px-4 pt-2 shrink-0">
          <button
            onClick={() => setModalTab('estado')}
            className={`flex items-center gap-1.5 py-2.5 px-3 text-[12.5px] font-bold border-b-2 transition-all cursor-pointer ${
              modalTab === 'estado'
                ? 'border-[#526b4a] text-[#24371e]'
                : 'border-transparent text-[#62775c] hover:text-[#24371e]'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Controles de Estado (SED)</span>
          </button>

          <button
            onClick={() => setModalTab('chat_rag')}
            className={`flex items-center gap-1.5 py-2.5 px-3 text-[12.5px] font-bold border-b-2 transition-all cursor-pointer ${
              modalTab === 'chat_rag'
                ? 'border-[#526b4a] text-[#24371e]'
                : 'border-transparent text-[#62775c] hover:text-[#24371e]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat RAG Contextualizado</span>
          </button>

          <button
            onClick={() => setModalTab('bitacora')}
            className={`flex items-center gap-1.5 py-2.5 px-3 text-[12.5px] font-bold border-b-2 transition-all cursor-pointer ${
              modalTab === 'bitacora'
                ? 'border-[#526b4a] text-[#24371e]'
                : 'border-transparent text-[#62775c] hover:text-[#24371e]'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Bitácora ({specimen.history.length})</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: CONTROLES DE ESTADO SED */}
          {modalTab === 'estado' && (
            <div className="space-y-4">
              {/* Output Values: Prioridad de Riego & Riesgo Fitosanitario */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f7faf4] p-3.5 rounded-2xl border border-[#e2ebd8] text-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#63795b] block">
                    Prioridad de Riego (PR)
                  </span>
                  <span className={`text-[26px] font-bold block my-0.5 ${
                    specimen.irrigationPriority > 65 ? 'text-[#dc2626]' : 'text-[#22331d]'
                  }`}>
                    {specimen.irrigationPriority}%
                  </span>
                  <span className="text-[10.5px] text-[#6d8265]">
                    {specimen.irrigationPriority > 65 ? '⚠ Tarea pendiente (>65%)' : '✓ Nivel adecuado'}
                  </span>
                </div>

                <div className="bg-[#f7faf4] p-3.5 rounded-2xl border border-[#e2ebd8] text-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#63795b] block">
                    Riesgo Fitosanitario (RF)
                  </span>
                  <span className={`text-[26px] font-bold block my-0.5 ${
                    specimen.phytosanitaryRisk > 75 ? 'text-[#dc2626]' : 'text-[#22331d]'
                  }`}>
                    {specimen.phytosanitaryRisk}%
                  </span>
                  <span className="text-[10.5px] text-[#6d8265]">
                    {specimen.phytosanitaryRisk > 75 ? '⚠ Alerta crítica (>75%)' : '✓ Riesgo contenido'}
                  </span>
                </div>
              </div>

              {/* Active Alert if present */}
              {specimen.activeAlert && (
                <div className="bg-[#fef2f2] p-3 rounded-2xl border border-[#fecaca] space-y-1 text-[12px]">
                  <div className="flex items-center justify-between text-[#991b1b] font-bold">
                    <span>Alerta Activa: {specimen.activeAlert.label}</span>
                    <span className="font-mono text-[10.5px] bg-[#fee2e2] px-2 py-0.5 rounded">
                      {specimen.activeAlert.ruleTriggered}
                    </span>
                  </div>
                  <p className="text-[#7f1d1d]">{specimen.activeAlert.reason}</p>
                </div>
              )}

              {/* Telemetría Crisp Inputs con Sliders Interactivos */}
              <div className="bg-[#f9faf7] p-4 rounded-2xl border border-[#e5edd8] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#485d41]">
                    Telemetría en Campo (Inputs del SED)
                  </h4>
                  <span className="text-[10.5px] text-[#6a8062]">Ajusta los sensores y evalúa en vivo</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* HVS */}
                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-[#556b4f] mb-1">
                      <span>HVS (Suelo)</span>
                      <span className="font-bold text-[#20321b]">{soilMoisture}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={soilMoisture}
                      onChange={(e) => setSoilMoisture(Number(e.target.value))}
                      className="w-full accent-[#526b4a]"
                    />
                  </div>

                  {/* TA */}
                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-[#556b4f] mb-1">
                      <span>TA (Temp.)</span>
                      <span className="font-bold text-[#20321b]">{temperature}°C</span>
                    </div>
                    <input
                      type="range"
                      min="-10"
                      max="50"
                      value={temperature}
                      onChange={(e) => setTemperature(Number(e.target.value))}
                      className="w-full accent-[#ea580c]"
                    />
                  </div>

                  {/* HR */}
                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-[#556b4f] mb-1">
                      <span>HR (Ambiente)</span>
                      <span className="font-bold text-[#20321b]">{humidity}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={humidity}
                      onChange={(e) => setHumidity(Number(e.target.value))}
                      className="w-full accent-[#0284c7]"
                    />
                  </div>
                </div>

                {/* Botón de Evaluación Directa con Backend */}
                <button
                  type="button"
                  onClick={handleEvaluateSED}
                  disabled={isEvaluating}
                  className="w-full bg-[#526b4a] hover:bg-[#43573c] text-white py-2.5 rounded-xl font-bold text-[12.5px] flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Sparkles className={`w-4 h-4 ${isEvaluating ? 'animate-spin' : ''}`} />
                  <span>{isEvaluating ? 'Evaluando con scikit-fuzzy...' : ' Evaluar Estado con SED (/api/evaluar)'}</span>
                </button>
              </div>

              {/* Botón de Riego Rápido */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    onWaterSpecimen(specimen.id);
                  }}
                  className="w-full bg-[#eef7ea] hover:bg-[#dfead7] text-[#2b4122] py-2.5 px-3 rounded-xl font-bold text-[12.5px] flex items-center justify-center gap-2 border border-[#c6dec0] transition-all cursor-pointer"
                >
                  <Droplets className="w-4 h-4 text-[#0284c7]" />
                  <span> Aplicar Riego de Recuperación (Resuelve Tarea)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CHAT RAG CONTEXTUALIZADO */}
          {modalTab === 'chat_rag' && (
            <div className="space-y-3">
              <div className="bg-[#f6f9f3] p-3 rounded-2xl border border-[#e2ebd9] text-[11.5px] text-[#4d6345] flex items-center justify-between">
                <span>Contexto inyectado: <strong>{specimen.name}</strong> · PR: <strong>{specimen.irrigationPriority}%</strong> · RF: <strong>{specimen.phytosanitaryRisk}%</strong></span>
                <span className="text-[10px] bg-[#e4edd8] px-2 py-0.5 rounded-md font-bold text-[#273820]">ChromaDB RAG</span>
              </div>

              {/* Mensajes del chat */}
              <div className="space-y-2.5 min-h-[220px] max-h-[320px] overflow-y-auto p-2 bg-[#fafbf8] rounded-2xl border border-[#e8efe2]">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] p-3 rounded-2xl text-[12px] leading-relaxed ${
                        m.sender === 'user'
                          ? 'bg-[#526b4a] text-white rounded-br-xs'
                          : 'bg-white text-[#22331d] border border-[#dce7d5] rounded-bl-xs shadow-2xs'
                      }`}
                    >
                      <p className="whitespace-pre-line">{m.text}</p>
                    </div>
                    <span className="text-[9.5px] text-[#788e72] mt-0.5 px-1">{m.timestamp}</span>
                  </div>
                ))}
                {isAskingRAG && (
                  <div className="text-[11px] text-[#5b7352] italic p-2">
                    Consultando literatura botánica en ChromaDB...
                  </div>
                )}
              </div>

              {/* Chips de preguntas sugeridas */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  disabled={isAskingRAG}
                  onClick={() => handleSendRAGQuery('¿Por qué tiene esta prioridad de riego? ¿Cuándo y cuánto regar?')}
                  className="text-[10px] bg-[#f0f5ec] hover:bg-[#e1ebd9] text-[#344d2b] px-2 py-1 rounded-lg border border-[#cddfc6] transition-colors cursor-pointer disabled:opacity-50"
                >
                   Consulta de Riego
                </button>
                <button
                  type="button"
                  disabled={isAskingRAG}
                  onClick={() => handleSendRAGQuery('¿Qué plagas u hongos amenazan a esta planta y cómo prevenirlos?')}
                  className="text-[10px] bg-[#f0f5ec] hover:bg-[#e1ebd9] text-[#344d2b] px-2 py-1 rounded-lg border border-[#cddfc6] transition-colors cursor-pointer disabled:opacity-50"
                >
                   Plagas y Sanidad
                </button>
                <button
                  type="button"
                  disabled={isAskingRAG}
                  onClick={() => handleSendRAGQuery('¿Cuáles son los requerimientos de suelo, sustrato y floración?')}
                  className="text-[10px] bg-[#f0f5ec] hover:bg-[#e1ebd9] text-[#344d2b] px-2 py-1 rounded-lg border border-[#cddfc6] transition-colors cursor-pointer disabled:opacity-50"
                >
                   Suelo y Floración
                </button>
              </div>

              {/* Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendRAGQuery();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Preguntar sobre el cuidado de ${specimen.name}...`}
                  disabled={isAskingRAG}
                  className="flex-1 bg-white text-[12.5px] px-3 py-2 rounded-xl border border-[#cad7c1] focus:outline-none focus:border-[#526b4a]"
                />
                <button
                  type="submit"
                  disabled={isAskingRAG || !chatInput.trim()}
                  className="bg-[#526b4a] hover:bg-[#43573c] disabled:opacity-50 text-white p-2 rounded-xl transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: BITÁCORA DE INTERVENCIONES */}
          {modalTab === 'bitacora' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#5f7457]">
                  Trazabilidad de Intervenciones
                </h4>
                <button
                  onClick={() => setShowAddLog(!showAddLog)}
                  className="text-[11.5px] font-semibold text-[#455c3c] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrar nota</span>
                </button>
              </div>

              {showAddLog && (
                <form onSubmit={handleAddLog} className="bg-[#f6f9f3] p-3 rounded-2xl border border-[#dfe8d8] space-y-2">
                  <input
                    type="text"
                    value={newLogNote}
                    onChange={(e) => setNewLogNote(e.target.value)}
                    placeholder="Ej: Aplicación preventiva de tratamiento fitosanitario..."
                    className="w-full bg-white text-[12px] p-2 rounded-xl border border-[#cad7c1] focus:outline-none focus:border-[#526b4a]"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddLog(false)}
                      className="text-[11px] px-2.5 py-1 text-[#62765b] cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-[#526b4a] text-white text-[11.5px] font-bold px-3 py-1 rounded-xl cursor-pointer"
                    >
                      Guardar en Bitácora
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {specimen.history.map((log) => (
                  <div
                    key={log.id}
                    className="bg-[#fafcf9] p-2.5 rounded-xl border border-[#e9f0e3] text-[12px] flex items-start justify-between gap-2"
                  >
                    <div>
                      <span className="font-semibold text-[#24371e] block">{log.description}</span>
                      <span className="text-[10px] text-[#71866b]">Operador: {log.operator}</span>
                    </div>
                    <span className="text-[10.5px] text-[#6d8266] shrink-0 font-mono">{log.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
