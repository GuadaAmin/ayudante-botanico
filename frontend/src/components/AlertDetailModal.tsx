import React from 'react';
import { X, Droplets, ShieldAlert, Sparkles, CheckCircle2, BookOpen, AlertTriangle, ArrowRight } from 'lucide-react';
import { AlertInfo, Specimen, SedRule, RagDocument } from '../types';
import { SED_RULES } from '../data/botanicalData';
import { getAllRAGDocuments } from '../services/customBotanicalStorage';

interface AlertDetailModalProps {
  alert: AlertInfo | null;
  specimen: Specimen | null;
  onClose: () => void;
  onApplyWatering: (specimenId: string) => void;
  onResolvePhyto: (specimenId: string) => void;
}

export const AlertDetailModal: React.FC<AlertDetailModalProps> = ({
  alert,
  specimen,
  onClose,
  onApplyWatering,
  onResolvePhyto
}) => {
  if (!alert || !specimen) return null;

  const isCritical = alert.severity === 'critical';
  const isPhyto = alert.type === 'phytosanitary';
  
  // Find associated rule and RAG docs
  const rule = SED_RULES.find((r) => r.code === alert.ruleTriggered) || SED_RULES[0];

  // FILTRADO ESTRICTO: Buscar únicamente literatura correspondiente a esta especie (incluye personalizadas)
  const specimenNameLower = specimen.name.toLowerCase();
  const commonNameLower = specimen.commonName.toLowerCase();
  const scientificNameLower = specimen.scientificName.toLowerCase();

  const allDocs = getAllRAGDocuments();

  const ragDocs = allDocs.filter((d) => {
    const titleLower = d.title.toLowerCase();
    const contentLower = d.content.toLowerCase();
    
    // Coincidencia con tags o texto de esta especie
    const matchesTag = d.tags.some((tag) => {
      const t = tag.toLowerCase();
      return commonNameLower.includes(t) || scientificNameLower.includes(t) || specimenNameLower.includes(t);
    });

    const matchesText = 
      titleLower.includes(scientificNameLower) ||
      titleLower.includes(commonNameLower.split(' ')[0]) ||
      contentLower.includes(scientificNameLower) ||
      contentLower.includes(commonNameLower.split(' ')[0]);

    return matchesTag || matchesText;
  });

  // Fallback seguro: Si no hubiera específico, buscar sólo documentos generales sin nombre de otra especie
  const displayDocs = ragDocs.length > 0 
    ? ragDocs 
    : allDocs.filter((d) => {
        const isGeneral = !d.title.includes(':') && !d.tags.some(t => ['Jacaranda', 'Ceiba', 'Lapacho'].includes(t));
        return isGeneral && (alert.type === 'irrigation' ? d.tags.includes('Riego') : d.tags.includes('Fitosanitario'));
      });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-[28px] border border-[#dce7d5] shadow-2xl p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                isCritical ? 'bg-[#ef4444] animate-pulse' : 'bg-[#f59e0b]'
              }`}
            />
            <span
              className={`text-[12px] font-bold px-2.5 py-0.5 rounded-full ${
                isPhyto ? 'bg-[#fef3c7] text-[#b45309]' : 'bg-[#fee2e2] text-[#dc2626]'
              }`}
            >
              {alert.label}
            </span>
          </div>

          <button
            id="btn-close-alert-modal"
            onClick={onClose}
            className="p-1 text-[#697f62] hover:text-[#203119] hover:bg-[#eef4ea] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Specimen Info Banner */}
        <div className="flex items-center gap-3 bg-[#f6f9f3] p-3 rounded-2xl border border-[#e4eedf]">
          <img
            src={specimen.imageUrl}
            alt={specimen.name}
            referrerPolicy="no-referrer"
            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-[#d2dec9]"
          />
          <div className="min-w-0">
            <h3 className="font-botanical text-[20px] font-bold text-[#1f3019] leading-tight truncate">
              {specimen.name}
            </h3>
            <p className="text-[12px] text-[#556c4e] italic truncate">
              {specimen.scientificName} · {specimen.location}
            </p>
            <p className="text-[11.5px] text-[#3b5034] font-medium mt-0.5">
              Humedad Suelo actual: <strong>{specimen.soilMoisture}%</strong> | HR: <strong>{specimen.humidity}%</strong>
            </p>
          </div>
        </div>

        {/* Diagnostic Reason */}
        <div className="space-y-1">
          <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#5f7457]">
            Diagnóstico Emitido por el SED
          </h4>
          <p className="text-[14px] font-medium text-[#22331d] bg-[#f9faf7] p-3 rounded-xl border border-[#e3ebe0]">
            {alert.reason}
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-[#fef2f2] p-3 rounded-xl border border-[#fecaca] text-center">
            <span className="text-[11px] font-medium text-[#991b1b] block">Prioridad de Riego</span>
            <span className="text-[22px] font-bold text-[#dc2626] leading-tight block">
              {alert.irrigationPriority}%
            </span>
            <span className="text-[10.5px] text-[#7f1d1d]">
              {alert.irrigationPriority > 75 ? 'Déficit Hídrico Crítico' : 'Moderado'}
            </span>
          </div>

          <div className="bg-[#fffbeb] p-3 rounded-xl border border-[#fde68a] text-center">
            <span className="text-[11px] font-medium text-[#92400e] block">Riesgo Fitosanitario</span>
            <span className="text-[22px] font-bold text-[#d97706] leading-tight block">
              {alert.phytosanitaryRisk}%
            </span>
            <span className="text-[10.5px] text-[#78350f]">
              {alert.phytosanitaryRisk > 60 ? 'Alerta por Humedad Alta' : 'Control Preventivo'}
            </span>
          </div>
        </div>

        {/* SED Rule Triggered */}
        {rule && (
          <div className="bg-[#f7faf4] rounded-2xl p-3 border border-[#dbe6d3] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-bold text-[#3d5435] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#526b4a]" />
                <span>Regla de Inferencia Disparada:</span>
              </span>
              <span className="font-mono text-[10.5px] font-bold px-1.5 py-0.5 rounded bg-[#dfead7] text-[#2c3d25]">
                {rule.code}
              </span>
            </div>

            <div className="font-mono text-[11px] bg-white p-2 rounded-lg border border-[#e2ecdc] text-[#283b22]">
              <span className="text-[#657d5c]">SI:</span> {rule.antecedent} <br />
              <strong className="text-[#3b5233]">ENTONCES:</strong> {rule.consequent}
            </div>

            <p className="text-[11.5px] text-[#4d6345] leading-relaxed">
              {rule.explanation}
            </p>
          </div>
        )}

        {/* RAG Knowledge Document Snippet */}
        {displayDocs.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[11.5px] font-bold text-[#4d6345] flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#526b4a]" />
              <span>Evidencia Bibliográfica Recuperada (RAG):</span>
            </span>
            <div className="bg-[#fcfdfa] p-2.5 rounded-xl border border-[#e5edd5] text-[11.5px] text-[#425739] leading-relaxed">
              <p className="font-semibold text-[#24351e] mb-1">
                {displayDocs[0].title} — <span className="text-[#6d8265] font-normal">{displayDocs[0].source}</span>
              </p>
              <p className="italic bg-[#f1f6ed] p-2 rounded-lg">
                "{displayDocs[0].content}"
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 border-t border-[#edf3e8] flex flex-col gap-2">
          {alert.type === 'irrigation' ? (
            <button
              id="btn-modal-apply-watering"
              onClick={() => {
                onApplyWatering(specimen.id);
                onClose();
              }}
              className="w-full bg-[#526b4a] hover:bg-[#43573c] text-white py-2.5 px-4 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98"
            >
              <Droplets className="w-4 h-4 text-[#7dd3fc]" />
              <span>Aplicar Riego Inmediato (45L) y Cerrar Alerta</span>
            </button>
          ) : (
            <button
              id="btn-modal-resolve-phyto"
              onClick={() => {
                onResolvePhyto(specimen.id);
                onClose();
              }}
              className="w-full bg-[#526b4a] hover:bg-[#43573c] text-white py-2.5 px-4 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4 text-[#86efac]" />
              <span>Registrar Tratamiento Fitosanitario y Aireación</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full bg-[#f4f7f1] hover:bg-[#eaefe6] text-[#4d6345] py-2 rounded-xl text-[12px] font-semibold transition-colors"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
};
