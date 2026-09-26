import React, { useState } from 'react';
import { X, BookOpen, Database, Copy, Check, FileText, Tag, Calendar, ExternalLink } from 'lucide-react';
import { CatalogSpecies, RagDocument } from '../types';
import { formatChromaDBPayload } from '../services/customBotanicalStorage';

interface RagDocumentModalProps {
  isOpen: boolean;
  species: CatalogSpecies | null;
  ragDoc: RagDocument | null;
  onClose: () => void;
}

export const RagDocumentModal: React.FC<RagDocumentModalProps> = ({
  isOpen,
  species,
  ragDoc,
  onClose
}) => {
  if (!isOpen || !species || !ragDoc) return null;

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const chromaPayload = formatChromaDBPayload(species, ragDoc);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(chromaPayload.codigo_python_insercion);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2200);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(ragDoc.content);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-[26px] border border-[#dce7d5] shadow-2xl p-5 sm:p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#edf3e8] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#dfead8] text-[#2c4725] flex items-center justify-center border border-[#cbdec3]">
              <BookOpen className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-botanical text-[20px] font-bold text-[#1f3019] leading-tight">
                Ficha de Conocimiento RAG
              </h3>
              <p className="text-[12px] text-[#5b7352]">
                Literatura botánica estructurada para recuperación semántica (ChromaDB)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#6a8063] hover:text-[#21321b] hover:bg-[#eef4ea] rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Species Summary Banner */}
        <div className="flex items-center gap-3 bg-[#f6f9f3] p-3 rounded-2xl border border-[#e4eedf]">
          <img
            src={species.imageUrl}
            alt={species.commonName}
            referrerPolicy="no-referrer"
            className="w-13 h-13 rounded-xl object-cover shrink-0 border border-[#cad7c1]"
          />
          <div className="min-w-0 text-[12px]">
            <h4 className="font-bold text-[14px] text-[#20321a] truncate">{species.commonName}</h4>
            <p className="text-[#566e4d] italic truncate">{species.scientificName} · {species.family}</p>
            <span className="inline-block mt-0.5 text-[10px] font-bold bg-[#e1ebd9] text-[#2e4726] px-2 py-0.5 rounded-md">
              Demanda de Riego: {species.wateringNeed}
            </span>
          </div>
        </div>

        {/* Document Details Card */}
        <div className="bg-[#fafbf8] rounded-2xl p-4 border border-[#e5edd4] space-y-3">
          <div className="flex items-center justify-between text-[11px] text-[#63795b] border-b border-[#edf3e6] pb-2">
            <span className="font-semibold text-[#25391e] flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-[#526b4a]" />
              <span>{ragDoc.title}</span>
            </span>
            <span className="bg-[#edf3e7] px-2 py-0.5 rounded text-[10.5px]">Año {ragDoc.year}</span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#546b4c]">
              Texto Extraído para Embeddings Semánticos:
            </span>
            <div className="bg-white p-3 rounded-xl border border-[#e0ebd9] text-[12.5px] text-[#24351d] leading-relaxed shadow-2xs">
              <p className="italic font-serif">"{ragDoc.content}"</p>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#546b4c] flex items-center gap-1">
              <Tag className="w-3 h-3" />
              <span>Etiquetas de Aislamiento y Metadatos:</span>
            </span>
            <div className="flex flex-wrap gap-1">
              {ragDoc.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="text-[10.5px] bg-[#eef4ea] text-[#344d2b] font-medium px-2 py-0.5 rounded-md border border-[#d6e3cf]"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ChromaDB Backend Ready Box */}
        <div className="bg-[#1b2618] text-[#d6ecd0] p-3.5 rounded-2xl text-[11px] font-mono space-y-2 border border-[#3b5533]">
          <div className="flex items-center justify-between text-[#8fc782]">
            <span className="font-bold flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              <span>Código Python para indexar en ChromaDB (Backend):</span>
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="flex items-center gap-1 bg-[#2e4229] hover:bg-[#3d5936] text-white px-2 py-1 rounded text-[10.5px] transition-all cursor-pointer"
            >
              {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCode ? '¡Copiado!' : 'Copiar Inserción'}</span>
            </button>
          </div>
          <div className="bg-black/40 p-2.5 rounded-lg max-h-36 overflow-y-auto text-[10.5px] leading-relaxed">
            <pre className="whitespace-pre-wrap">{chromaPayload.codigo_python_insercion}</pre>
          </div>
          <p className="text-[10px] text-[#9db795]">
             Este fragmento ya está disponible para el Asesor en el frontend y puedes agregarlo a <code>rag_pipeline.py</code> cuando desees actualizar la base vectorial en el backend.
          </p>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopyText}
            className="flex-1 bg-[#f0f5ec] hover:bg-[#e2edd8] text-[#334c2c] py-2 px-3 rounded-xl font-semibold text-[12px] flex items-center justify-center gap-1.5 border border-[#c8dec0] transition-colors cursor-pointer"
          >
            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedText ? 'Texto Copiado' : 'Copiar Texto RAG'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-[#526b4a] hover:bg-[#43573c] text-white py-2 px-3 rounded-xl font-bold text-[12px] transition-colors cursor-pointer text-center"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
