import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Sparkles, 
  BookOpen, 
  MapPin, 
  Droplets, 
  Sun, 
  Check, 
  Copy, 
  ChevronDown, 
  ChevronUp, 
  Database,
  ExternalLink,
  Layers,
  Leaf
} from 'lucide-react';
import { CatalogSpecies, Specimen, RagDocument } from '../types';
import { 
  saveCustomSpecies, 
  formatChromaDBPayload, 
  BOTANICAL_PRESETS 
} from '../services/customBotanicalStorage';
import { registrarEspeciePersonalizadaBackend } from '../services/api';

interface NewCustomSpeciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpeciesAdded: (species: CatalogSpecies, plantedSpecimen?: Specimen, ragDoc?: RagDocument) => void;
}

export const NewCustomSpeciesModal: React.FC<NewCustomSpeciesModalProps> = ({
  isOpen,
  onClose,
  onSpeciesAdded
}) => {
  if (!isOpen) return null;

  // Taxonomy & Description
  const [commonName, setCommonName] = useState('');
  const [scientificName, setScientificName] = useState('');
  const [family, setFamily] = useState('');
  const [origin, setOrigin] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(
    'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=800&q=80'
  );

  // Agronomic requirements
  const [wateringNeed, setWateringNeed] = useState<'Bajo' | 'Medio' | 'Alto'>('Medio');
  const [sunlight, setSunlight] = useState<
    'Pleno sol' | 'Media sombra' | 'Sombra' | 'Pleno sol a media sombra'
  >('Media sombra');
  const [growthRate, setGrowthRate] = useState<'Rápido' | 'Moderado' | 'Lento'>('Moderado');
  const [floweringSeason, setFloweringSeason] = useState('Primavera a Verano');
  const [optimalSoil, setOptimalSoil] = useState('Sustrato orgánico, fértil y bien drenado');
  const [maxHeight, setMaxHeight] = useState('1 a 2 metros');
  const [pestVulnerability, setPestVulnerability] = useState(
    'Cochinilla algodonosa, ácaros y hongos por humedad estancada'
  );
  const [phytosanitaryNotes, setPhytosanitaryNotes] = useState(
    'Evitar el encharcamiento prolongado. Aplicar riegos profundos espaciados.'
  );

  // Planting in garden options
  const [alsoPlantInGarden, setAlsoPlantInGarden] = useState(true);
  const [specimenIdentifier, setSpecimenIdentifier] = useState('');
  const [location, setLocation] = useState('Cantero Central');
  const [initialSoilMoisture, setInitialSoilMoisture] = useState<number>(45);

  // RAG indexing option
  const [indexInRAG, setIndexInRAG] = useState(true);
  const [showRAGPreview, setShowRAGPreview] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Apply a quick preset
  const applyPreset = (preset: Partial<CatalogSpecies>) => {
    if (preset.commonName) setCommonName(preset.commonName);
    if (preset.scientificName) setScientificName(preset.scientificName);
    if (preset.family) setFamily(preset.family);
    if (preset.origin) setOrigin(preset.origin);
    if (preset.description) setDescription(preset.description);
    if (preset.imageUrl) setImageUrl(preset.imageUrl);
    if (preset.wateringNeed) setWateringNeed(preset.wateringNeed);
    if (preset.sunlight) setSunlight(preset.sunlight);
    if (preset.growthRate) setGrowthRate(preset.growthRate);
    if (preset.floweringSeason) setFloweringSeason(preset.floweringSeason);
    if (preset.optimalSoil) setOptimalSoil(preset.optimalSoil);
    if (preset.maxHeight) setMaxHeight(preset.maxHeight);
    if (preset.pestVulnerability) setPestVulnerability(preset.pestVulnerability);
    if (preset.phytosanitaryNotes) setPhytosanitaryNotes(preset.phytosanitaryNotes);
    if (!specimenIdentifier && preset.commonName) {
      setSpecimenIdentifier(`${preset.commonName.split('/')[0].trim()} 1`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commonName.trim() || !scientificName.trim()) {
      alert('Por favor completa al menos el Nombre Común y el Nombre Científico.');
      return;
    }

    setIsSubmitting(true);

    const speciesId = `custom-cat-${Date.now()}`;

    const newSpecies: CatalogSpecies = {
      id: speciesId,
      commonName: commonName.trim(),
      scientificName: scientificName.trim(),
      family: family.trim() || 'General',
      origin: origin.trim() || 'Cultivo Regional',
      description: description.trim() || `Especie ornamental botánica ${commonName}.`,
      wateringNeed,
      sunlight,
      growthRate,
      floweringSeason: floweringSeason.trim() || 'Primavera',
      optimalSoil: optimalSoil.trim() || 'Suelo bien drenado',
      maxHeight: maxHeight.trim() || '1.5 metros',
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1546842931-886c185b4c8c?auto=format&fit=crop&w=800&q=80',
      pestVulnerability: pestVulnerability.trim() || 'Pulgones y cochinillas en brotes tiernos',
      phytosanitaryNotes: phytosanitaryNotes.trim() || 'Monitorear humedad y aplicar preventivos orgánicos.'
    };

    // 1. Guardar en Catálogo local y generar documento RAG si está marcado
    const { ragDoc } = saveCustomSpecies(newSpecies, indexInRAG);

    // 2. Si se solicitó plantar en el jardín, crear el ejemplar Specimen
    let newSpecimen: Specimen | undefined;
    if (alsoPlantInGarden) {
      const isDry = initialSoilMoisture < 25;
      const initialStatus = isDry ? 'attention' : 'stable';
      const specName = specimenIdentifier.trim() || `${commonName} 1`;

      newSpecimen = {
        id: `spec-${Date.now()}`,
        name: specName,
        scientificName: newSpecies.scientificName,
        commonName: newSpecies.commonName,
        family: newSpecies.family,
        status: initialStatus,
        location: location.trim() || 'Sector Nuevo',
        plantedDate: new Date().toISOString().split('T')[0],
        irrigationPriority: isDry ? 70.0 : 20.0,
        phytosanitaryRisk: 15.0,
        soilMoisture: initialSoilMoisture,
        temperature: 24.0,
        humidity: 55.0,
        lastWatered: 'Hoy al incorporar al jardín',
        imageUrl: newSpecies.imageUrl,
        notes: `Ejemplar registrado fuera de catálogo. ${newSpecies.description.slice(0, 80)}...`,
        activeAlert: isDry
          ? {
              id: `alt-${Date.now()}`,
              specimenId: `spec-${Date.now()}`,
              specimenName: specName,
              type: 'irrigation',
              label: 'Riego Requerido',
              reason: 'Baja humedad inicial detectada tras plantación.',
              irrigationPriority: 70.0,
              phytosanitaryRisk: 15.0,
              severity: 'attention',
              ruleTriggered: 'REG-02'
            }
          : null,
        history: [
          {
            id: `h-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            type: 'diagnostico',
            description: `Alta de nueva especie botánica (${newSpecies.scientificName}) en el jardín`,
            operator: 'Usuario Administrador'
          }
        ]
      };
    }

    // 3. Persistir en Backend (FastAPI + SQLite + ChromaDB RAG)
    try {
      const backendPayload = {
        nombre_comun: newSpecies.commonName,
        nombre_cientifico: newSpecies.scientificName,
        familia: newSpecies.family,
        origen: newSpecies.origin,
        descripcion: newSpecies.description,
        imagen_url: newSpecies.imageUrl,
        demanda_hidrica: newSpecies.wateringNeed,
        exposicion_solar: newSpecies.sunlight,
        epoca_floracion: newSpecies.floweringSeason,
        sustrato_optimo: newSpecies.optimalSoil,
        vulnerabilidad_plagas: newSpecies.pestVulnerability,
        directrices_sanitarias: newSpecies.phytosanitaryNotes,
        literatura_rag: ragDoc?.content,
        plantar_en_jardin: alsoPlantInGarden,
        alias_ejemplar: specimenIdentifier.trim() || `${commonName} 1`,
        ubicacion_ejemplar: location.trim() || 'Cantero Central',
        humedad_inicial: initialSoilMoisture
      };

      const res = await registrarEspeciePersonalizadaBackend(backendPayload);
      if (res.success && res.data) {
        if (res.data.especie?.id) {
          newSpecies.id = String(res.data.especie.id);
        }
        if (res.data.planta?.id && newSpecimen) {
          newSpecimen.id = String(res.data.planta.id);
        }
      }
    } catch (backendError) {
      console.warn('Backend unavailable, persisted in local botanical storage:', backendError);
    } finally {
      setIsSubmitting(false);
    }

    onSpeciesAdded(newSpecies, newSpecimen, ragDoc);
    onClose();
  };

  // Preview data for ChromaDB
  const previewDoc: RagDocument = {
    id: `rag-custom-preview`,
    title: `Manual de Manejo Fisiológico y Sanitario: ${scientificName || 'Especie'}`,
    section: `Requerimientos Edafo-climáticos y Sanidad en ${commonName || 'Ejemplar'}`,
    source: 'Catálogo Botánico Personalizado (Ingreso de Usuario)',
    year: new Date().getFullYear(),
    content: `El ejemplar ${commonName || 'Planta'} (${scientificName || 'Especie'}), perteneciente a la familia ${family || 'Familia'}, posee una demanda hídrica clasificada como ${wateringNeed} y requiere exposición a ${sunlight}. Sustrato óptimo: ${optimalSoil}. Durante la floración (${floweringSeason}), el balance hídrico debe ser monitoreado rigurosamente. Principales amenazas sanitarias: ${pestVulnerability}. Directrices agronómicas: ${phytosanitaryNotes}`,
    tags: [commonName || 'Planta', scientificName || 'Especie', family || 'Familia', 'Riego', 'Fitosanitario', 'Personalizada']
  };

  const chromaPayload = formatChromaDBPayload(
    {
      id: 'custom',
      commonName: commonName || 'Planta',
      scientificName: scientificName || 'Especie',
      family: family || 'Familia',
      origin,
      description,
      wateringNeed,
      sunlight,
      growthRate,
      floweringSeason,
      optimalSoil,
      maxHeight,
      imageUrl,
      pestVulnerability,
      phytosanitaryNotes
    },
    previewDoc
  );

  const copyChromaCode = () => {
    navigator.clipboard.writeText(chromaPayload.codigo_python_insercion);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-[26px] border border-[#dce7d5] shadow-2xl p-5 sm:p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#edf3e8] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#e3eedc] text-[#2f4a28] flex items-center justify-center shadow-2xs border border-[#cedec5]">
              <Leaf className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-botanical text-[21px] font-bold text-[#1f3019] leading-tight">
                  Agregar Planta Fuera del Catálogo
                </h3>
                <span className="text-[10px] font-bold bg-[#dbe9d2] text-[#2c4424] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  RAG Ready
                </span>
              </div>
              <p className="text-[12px] text-[#556d4c]">
                Ingresa una especie botánica personalizada para integrarla al catálogo, a tu jardín y al sistema RAG.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#6a8063] hover:text-[#21321b] hover:bg-[#eef4ea] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets Bar */}
        <div className="bg-[#f7faf4] p-3 rounded-2xl border border-[#e2ecdc] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-bold text-[#344b2c] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#526b4a]" />
              <span>Plantillas rápidas sugeridas (1 clic para autocompletar):</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {BOTANICAL_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(p)}
                className="text-[11px] bg-white hover:bg-[#eef5e9] text-[#2d4224] px-2.5 py-1 rounded-xl border border-[#cad7c1] transition-all whitespace-nowrap shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                <span>🌿</span>
                <span>{p.commonName?.split('/')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section 1: Taxonomy */}
          <div className="space-y-3">
            <h4 className="text-[12.5px] font-bold uppercase tracking-wider text-[#48623f] flex items-center gap-1.5 border-b border-[#eef4ea] pb-1">
              <Layers className="w-4 h-4 text-[#526b4a]" />
              <span>1. Identidad Taxonómica</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-[#485d41] mb-1">
                  Nombre Común <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={commonName}
                  onChange={(e) => {
                    setCommonName(e.target.value);
                    if (!specimenIdentifier) {
                      setSpecimenIdentifier(`${e.target.value.split('/')[0].trim()} 1`);
                    }
                  }}
                  placeholder="Ej: Monstera Deliciosa, Lavanda"
                  className="w-full bg-white text-[#22331d] text-[13px] py-2 px-3 rounded-xl border border-[#cad7c1] focus:outline-none focus:border-[#526b4a]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#485d41] mb-1">
                  Nombre Científico (Género y Especie) <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={scientificName}
                  onChange={(e) => setScientificName(e.target.value)}
                  placeholder="Ej: Monstera deliciosa, Lavandula dentata"
                  className="w-full bg-white text-[#22331d] text-[13px] py-2 px-3 rounded-xl border border-[#cad7c1] focus:outline-none focus:border-[#526b4a] italic"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#485d41] mb-1">
                  Familia Botánica
                </label>
                <input
                  type="text"
                  value={family}
                  onChange={(e) => setFamily(e.target.value)}
                  placeholder="Ej: Araceae, Lamiaceae, Fabaceae"
                  className="w-full bg-white text-[#22331d] text-[13px] py-2 px-3 rounded-xl border border-[#cad7c1] focus:outline-none focus:border-[#526b4a]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#485d41] mb-1">
                  Origen / Distribución Geográfica
                </label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Ej: Centroamérica, Cuenca Mediterránea"
                  className="w-full bg-white text-[#22331d] text-[13px] py-2 px-3 rounded-xl border border-[#cad7c1] focus:outline-none focus:border-[#526b4a]"
                />
              </div>
            </div>

            {/* Image URL with live preview */}
            <div className="space-y-1.5">
              <label className="block text-[12px] font-semibold text-[#485d41]">
                URL de Fotografía Botánica
              </label>
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-[#c6d7bf] bg-[#eef4ea]">
                  <img
                    src={imageUrl}
                    alt="Vista previa"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1546842931-886c185b4c8c?auto=format&fit=crop&w=800&q=80';
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 bg-white text-[#22331d] text-[12px] py-2 px-3 rounded-xl border border-[#cad7c1] focus:outline-none focus:border-[#526b4a]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#485d41] mb-1">
                Descripción General y Porte
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Hábito de crecimiento, forma de las hojas, arquitectura foliar y valor ornamental..."
                className="w-full bg-white text-[#22331d] text-[12.5px] p-2.5 rounded-xl border border-[#cad7c1] focus:outline-none focus:border-[#526b4a]"
              />
            </div>
          </div>

          {/* Section 2: Agronomic & Physiological Care */}
          <div className="space-y-3 pt-1">
            <h4 className="text-[12.5px] font-bold uppercase tracking-wider text-[#48623f] flex items-center gap-1.5 border-b border-[#eef4ea] pb-1">
              <Droplets className="w-4 h-4 text-[#0284c7]" />
              <span>2. Fisiología y Requerimientos de Cultivo</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11.5px] font-semibold text-[#485d41] mb-1">
                  Demanda Hídrica
                </label>
                <select
                  value={wateringNeed}
                  onChange={(e) => setWateringNeed(e.target.value as any)}
                  className="w-full bg-[#f6f9f3] text-[#22331d] text-[12.5px] py-2 px-3 rounded-xl border border-[#cad7c1] focus:outline-none focus:border-[#526b4a]"
                >
                  <option value="Bajo">Bajo (Tolerante a sequía)</option>
                  <option value="Medio">Medio (Riego regular)</option>
                  <option value="Alto">Alto (Suelo húmedo/ribereño)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11.5px] font-semibold text-[#485d41] mb-1">
                  Exposición Solar
                </label>
                <select
                  value={sunlight}
                  onChange={(e) => setSunlight(e.target.value as any)}
                  className="w-full bg-[#f6f9f3] text-[#22331d] text-[12.5px] py-2 px-3 rounded-xl border border-[#cad7c1] focus:outline-none focus:border-[#526b4a]"
                >
                  <option value="Pleno sol">Pleno sol</option>
                  <option value="Media sombra">Media sombra</option>
                  <option value="Pleno sol a media sombra">Pleno sol a media sombra</option>
                  <option value="Sombra">Sombra / sotobosque</option>
                </select>
              </div>

              <div>
                <label className="block text-[11.5px] font-semibold text-[#485d41] mb-1">
                  Tasa de Crecimiento
                </label>
                <select
                  value={growthRate}
                  onChange={(e) => setGrowthRate(e.target.value as any)}
                  className="w-full bg-[#f6f9f3] text-[#22331d] text-[12.5px] py-2 px-3 rounded-xl border border-[#cad7c1] focus:outline-none focus:border-[#526b4a]"
                >
                  <option value="Rápido">Rápido</option>
                  <option value="Moderado">Moderado</option>
                  <option value="Lento">Lento</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11.5px] font-semibold text-[#485d41] mb-1">
                  Suelo y Sustrato Óptimo
                </label>
                <input
                  type="text"
                  value={optimalSoil}
                  onChange={(e) => setOptimalSoil(e.target.value)}
                  placeholder="Ej: Fértil, pH 6.0-6.5, drenaje con perlita"
                  className="w-full bg-white text-[#22331d] text-[12.5px] py-2 px-3 rounded-xl border border-[#cad7c1] focus:outline-none focus:border-[#526b4a]"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-semibold text-[#485d41] mb-1">
                  Época de Floración
                </label>
                <input
                  type="text"
                  value={floweringSeason}
                  onChange={(e) => setFloweringSeason(e.target.value)}
                  placeholder="Ej: Primavera a Verano, Octubre a Diciembre"
                  className="w-full bg-white text-[#22331d] text-[12.5px] py-2 px-3 rounded-xl border border-[#cad7c1] focus:outline-none focus:border-[#526b4a]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Health & RAG Knowledge */}
          <div className="space-y-3 pt-1">
            <h4 className="text-[12.5px] font-bold uppercase tracking-wider text-[#48623f] flex items-center gap-1.5 border-b border-[#eef4ea] pb-1">
              <BookOpen className="w-4 h-4 text-[#526b4a]" />
              <span>3. Sanidad Vegetal e Información para el RAG</span>
            </h4>

            <div>
              <label className="block text-[11.5px] font-semibold text-[#485d41] mb-1">
                Plagas y Hongos Comunes (Vulnerabilidad)
              </label>
              <input
                type="text"
                value={pestVulnerability}
                onChange={(e) => setPestVulnerability(e.target.value)}
                placeholder="Ej: Arañuela roja con calor seco, cochinillas, oídio"
                className="w-full bg-white text-[#22331d] text-[12.5px] py-2 px-3 rounded-xl border border-[#cad7c1] focus:outline-none focus:border-[#526b4a]"
              />
            </div>

            <div>
              <label className="block text-[11.5px] font-semibold text-[#485d41] mb-1">
                Directriz Fitosanitaria y Pautas de Manejo (SED)
              </label>
              <textarea
                rows={2}
                value={phytosanitaryNotes}
                onChange={(e) => setPhytosanitaryNotes(e.target.value)}
                placeholder="Pautas para evitar asfixia radicular, respuesta ante temperaturas extremas y podas..."
                className="w-full bg-white text-[#22331d] text-[12.5px] p-2.5 rounded-xl border border-[#cad7c1] focus:outline-none focus:border-[#526b4a]"
              />
            </div>
          </div>

          {/* Section 4: Garden Planting & RAG Indexing Checkboxes */}
          <div className="bg-[#f5f8f2] rounded-2xl p-3.5 border border-[#e0ebd9] space-y-3">
            {/* Checkbox: Plant in garden now */}
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id="chk-plant-in-garden"
                checked={alsoPlantInGarden}
                onChange={(e) => setAlsoPlantInGarden(e.target.checked)}
                className="mt-0.5 accent-[#526b4a] w-4 h-4 rounded cursor-pointer"
              />
              <label htmlFor="chk-plant-in-garden" className="text-[12.5px] font-bold text-[#23351d] cursor-pointer">
                 Plantar un ejemplar de esta especie en mi Jardín ahora mismo
                <span className="block text-[11px] font-normal text-[#587250]">
                  Crea un ejemplar activo con sensores telemétricos monitoreados por el SED.
                </span>
              </label>
            </div>

            {alsoPlantInGarden && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pl-6 pt-1 animate-fadeIn">
                <div>
                  <label className="block text-[11px] font-semibold text-[#485d41] mb-0.5">
                    Identificador en Jardín
                  </label>
                  <input
                    type="text"
                    value={specimenIdentifier}
                    onChange={(e) => setSpecimenIdentifier(e.target.value)}
                    placeholder="Ej: Monstera 1"
                    className="w-full bg-white text-[12px] py-1.5 px-2.5 rounded-xl border border-[#cad7c1] text-[#22331d]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#485d41] mb-0.5">
                    Ubicación / Sector
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ej: Cantero Norte"
                    className="w-full bg-white text-[12px] py-1.5 px-2.5 rounded-xl border border-[#cad7c1] text-[#22331d]"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-[#485d41] mb-0.5">
                    <span>Humedad Suelo Inicial</span>
                    <span className="text-[#23351d] font-bold">{initialSoilMoisture}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={initialSoilMoisture}
                    onChange={(e) => setInitialSoilMoisture(Number(e.target.value))}
                    className="w-full accent-[#526b4a]"
                  />
                </div>
              </div>
            )}

            {/* Checkbox: Index in RAG */}
            <div className="flex items-start gap-2.5 pt-1 border-t border-[#e2eddc]">
              <input
                type="checkbox"
                id="chk-index-rag"
                checked={indexInRAG}
                onChange={(e) => setIndexInRAG(e.target.checked)}
                className="mt-0.5 accent-[#526b4a] w-4 h-4 rounded cursor-pointer"
              />
              <div className="flex-1">
                <label htmlFor="chk-index-rag" className="text-[12.5px] font-bold text-[#23351d] cursor-pointer flex items-center justify-between">
                  <span> Generar documento de literatura para el RAG (Listo para ChromaDB)</span>
                  <button
                    type="button"
                    onClick={() => setShowRAGPreview(!showRAGPreview)}
                    className="text-[11px] font-semibold text-[#3b5732] hover:underline flex items-center gap-0.5"
                  >
                    <span>{showRAGPreview ? 'Ocultar código' : 'Ver payload RAG'}</span>
                    {showRAGPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </label>
                <p className="text-[11px] text-[#587250]">
                  Genera una ficha científica que el Chatbot consultará para dar diagnósticos y que podrás indexar en ChromaDB en el backend.
                </p>
              </div>
            </div>

            {/* Expandable ChromaDB Payload Preview */}
            {showRAGPreview && (
              <div className="bg-[#1e2a1b] text-[#d6ecd0] p-3 rounded-xl text-[11px] font-mono space-y-2 animate-fadeIn border border-[#3b5533]">
                <div className="flex items-center justify-between text-[#8fc782]">
                  <span className="font-bold flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5" />
                    <span>Payload Estructurado para ChromaDB:</span>
                  </span>
                  <button
                    type="button"
                    onClick={copyChromaCode}
                    className="flex items-center gap-1 bg-[#2e4229] hover:bg-[#3d5936] text-white px-2 py-0.5 rounded text-[10px] transition-all cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? '¡Copiado!' : 'Copiar Python'}</span>
                  </button>
                </div>
                <div className="bg-black/40 p-2 rounded max-h-36 overflow-y-auto text-[10.5px] leading-relaxed">
                  <pre className="whitespace-pre-wrap">{chromaPayload.codigo_python_insercion}</pre>
                </div>
                <p className="text-[10px] text-[#9db795] italic">
                   Esta especie se persiste en SQLite (<code>catalogo_especies</code>) y se vectoriza automáticamente en ChromaDB para el Asesor RAG.
                </p>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-[#f0f4ec] hover:bg-[#e4ebd9] text-[#485e40] py-2.5 rounded-xl font-semibold text-[13px] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-[#526b4a] hover:bg-[#43573c] text-white py-2.5 rounded-xl font-bold text-[13px] flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-98 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{isSubmitting ? 'Guardando en BD y RAG...' : `Guardar Especie ${alsoPlantInGarden ? 'y Plantar' : ''}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
