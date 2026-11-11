import React, { useMemo, useState } from 'react';
import {
  Search,
  Droplets,
  Sun,
  Sparkles,
  Plus,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Trash2,
  Leaf,
  Flower2,
  Database,
  Ruler,
  CheckCircle2,
} from 'lucide-react';
import { CatalogSpecies, RagDocument, Specimen } from '../types';
import {
  getCustomRAGDocuments,
  generateRAGDocumentFromSpecies,
} from '../services/customBotanicalStorage';

interface CatalogScreenProps {
  catalogSpecies: CatalogSpecies[];
  specimens?: Specimen[];
  onSelectSpeciesToPlant: (species: CatalogSpecies) => void;
  onOpenNewCustomSpeciesModal: () => void;
  onOpenRagDocModal: (species: CatalogSpecies, doc: RagDocument) => void;
  onDeleteCustomSpecies?: (speciesId: string) => void;
}

type SeasonKey = 'Primavera' | 'Verano' | 'Otoño' | 'Invierno';
const SEASONS: { key: SeasonKey; short: string }[] = [
  { key: 'Primavera', short: 'Prim' },
  { key: 'Verano', short: 'Ver' },
  { key: 'Otoño', short: 'Oto' },
  { key: 'Invierno', short: 'Inv' },
];

function getCurrentSouthernSeason(): SeasonKey {
  const month = new Date().getMonth();
  if (month >= 8 && month <= 10) return 'Primavera';
  if (month === 11 || month <= 1) return 'Verano';
  if (month >= 2 && month <= 4) return 'Otoño';
  return 'Invierno';
}

function parseFloweringSeasons(seasonText: string): Set<SeasonKey> {
  const lower = (seasonText || '').toLowerCase();
  const active = new Set<SeasonKey>();
  if (
    lower.includes('todo el año') ||
    lower.includes('continua') ||
    lower.includes('anual')
  ) {
    SEASONS.forEach((s) => active.add(s.key));
    return active;
  }
  if (lower.includes('primavera')) active.add('Primavera');
  if (lower.includes('verano')) active.add('Verano');
  if (lower.includes('otoño') || lower.includes('otono')) active.add('Otoño');
  if (lower.includes('invierno')) active.add('Invierno');
  if (active.size === 0) active.add('Primavera');
  return active;
}

function parseMaxMeters(heightText: string): number {
  const match = (heightText || '').match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return 1.5;
  const val = parseFloat(match[1].replace(',', '.'));
  if (heightText.toLowerCase().includes('cm')) return val / 100;
  return val;
}

export const CatalogScreen: React.FC<CatalogScreenProps> = ({
  catalogSpecies,
  specimens = [],
  onSelectSpeciesToPlant,
  onOpenNewCustomSpeciesModal,
  onOpenRagDocModal,
  onDeleteCustomSpecies,
}) => {
  const [search, setSearch] = useState('');
  const [familyFilter, setFamilyFilter] = useState('all');
  const [onlyFloweringNow, setOnlyFloweringNow] = useState(false);
  const [expandedSpeciesId, setExpandedSpeciesId] = useState<string | null>(null);

  const currentSeason = useMemo(() => getCurrentSouthernSeason(), []);

  // Conteo en vivo de ejemplares ya plantados por especie
  const plantedCounts = useMemo(() => {
    const map = new Map<string, number>();
    catalogSpecies.forEach((sp) => {
      const sciLower = sp.scientificName.toLowerCase();
      const comLower = sp.commonName.toLowerCase();
      const count = specimens.filter(
        (item) =>
          item.scientificName.toLowerCase() === sciLower ||
          item.commonName.toLowerCase() === comLower
      ).length;
      if (count > 0) map.set(sp.id, count);
    });
    return map;
  }, [catalogSpecies, specimens]);

  const filteredSpecies = catalogSpecies.filter((s) => {
    const matchesSearch =
      s.commonName.toLowerCase().includes(search.toLowerCase()) ||
      s.scientificName.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()) ||
      s.family.toLowerCase().includes(search.toLowerCase());
    const matchesFamily = familyFilter === 'all' || s.family === familyFilter;
    const matchesFlowering =
      !onlyFloweringNow || parseFloweringSeasons(s.floweringSeason).has(currentSeason);
    return matchesSearch && matchesFamily && matchesFlowering;
  });

  const families = ['all', ...Array.from(new Set(catalogSpecies.map((s) => s.family)))];

  const toggleExpand = (id: string) => {
    setExpandedSpeciesId((prev) => (prev === id ? null : id));
  };

  const handleOpenRag = (species: CatalogSpecies) => {
    const customDocs = getCustomRAGDocuments();
    const existingDoc = customDocs.find((d) => d.id === `rag-custom-${species.id}`);
    const doc = existingDoc || generateRAGDocumentFromSpecies(species);
    onOpenRagDocModal(species, doc);
  };

  return (
    <div className="space-y-4 pb-6 tab-panel">
      {/* Banner Herbario Vivo Luminoso */}
      <div className="relative overflow-hidden rounded-[24px] p-5 sm:p-6 border border-[#d6e4ce] shadow-sm bg-gradient-to-br from-[#f8fbf5] via-white to-[#eaf3e4]">
        <img
          src="https://images.unsplash.com/photo-1533792344354-ed5e8fc12494?auto=format&fit=crop&w=1000&q=80"
          alt="Herbario Botánico"
          referrerPolicy="no-referrer"
          className="ken-burns absolute inset-0 w-full h-full object-cover object-center opacity-20"
        />
        <div
          className="sunbeam-anim pointer-events-none absolute -top-24 left-1/4 w-44 h-96 blur-2xl opacity-35"
          style={{
            background: 'linear-gradient(180deg, rgba(254, 240, 138, 0.45), transparent)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/92 via-white/84 to-[#eef5e8]/80 backdrop-blur-[2px]" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10.5px] font-bold uppercase tracking-wider bg-[#e8f2e1] px-2.5 py-0.5 rounded-full text-[#3b5a33] border border-[#cfe0c6] inline-flex items-center gap-1.5">
                <Leaf className="w-3 h-3 text-[#4d7442]" />
                <span>Herbario Vivo &amp; Flora Regional</span>
              </span>
              <span className="text-[10.5px] font-bold bg-white/90 px-2.5 py-0.5 rounded-full text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                <Database className="w-3 h-3 text-emerald-600" />
                <span>Vectorizado ChromaDB</span>
              </span>
            </div>

            <h2 className="font-botanical text-[24px] sm:text-[28px] font-bold text-[#22331d] leading-tight">
              Especies Florales y Arbóreas
            </h2>
            <p className="text-[12.5px] text-[#556b4e] max-w-xl leading-snug">
              Explorá morfología, porte estimado y ventanas de floración. Podés plantar cualquier especie en tu jardín o crear fichas personalizadas con literatura RAG.
            </p>
          </div>

          <button
            id="btn-open-new-custom-species-banner"
            onClick={onOpenNewCustomSpeciesModal}
            className="btn-shimmer shrink-0 bg-gradient-to-r from-[#567a4a] to-[#436438] hover:brightness-105 text-white font-bold text-[13px] px-4 py-3 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-100" />
            <span>+ Nueva Especie</span>
          </button>
        </div>
      </div>

      {/* Buscador y Filtros Taxonómicos + Floración */}
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#72886d]" />
            <input
              id="catalog-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre común, científico o familia..."
              className="w-full bg-white pl-10 pr-3 py-2.5 text-[13px] rounded-2xl border border-[#dbe6d3] focus:outline-none focus:border-[#526b4a] text-[#22331d] shadow-2xs"
            />
          </div>

          <button
            type="button"
            onClick={() => setOnlyFloweringNow((prev) => !prev)}
            className={`px-3.5 py-2 rounded-2xl text-[12px] font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
              onlyFloweringNow
                ? 'bg-violet-600 text-white border-violet-600 shadow-2xs'
                : 'bg-white text-[#4f5f4b] border-[#dbe6d3] hover:bg-[#f5f2fc]'
            }`}
            title={`Mostrar especies en floración durante ${currentSeason}`}
          >
            <Flower2 className="w-4 h-4" />
            <span>En Floración ({currentSeason})</span>
          </button>

          <button
            onClick={onOpenNewCustomSpeciesModal}
            className="sm:hidden w-full bg-[#3c5633] text-white py-2 px-3 rounded-2xl font-bold text-[12.5px] flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Agregar Especie</span>
          </button>
        </div>

        {/* Chips de Familias */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {families.map((fam) => (
            <button
              key={fam}
              onClick={() => setFamilyFilter(fam)}
              className={`px-3 py-1 rounded-full text-[11.5px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                familyFilter === fam
                  ? 'bg-[#526b4a] text-white shadow-2xs'
                  : 'bg-white text-[#566e50] border border-[#dbe6d3] hover:bg-[#eff4eb]'
              }`}
            >
              {fam === 'all' ? `Todas las Familias (${catalogSpecies.length})` : fam}
            </button>
          ))}
        </div>
      </div>

      {/* Grilla 2 Columnas Herbario Vivo */}
      <div id="catalog-species-list" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSpecies.length === 0 ? (
          <div className="md:col-span-2 bg-white rounded-[22px] border border-[#dce7d5] p-8 text-center space-y-3">
            <Leaf className="w-10 h-10 text-[#738d6f] mx-auto opacity-70" />
            <h4 className="font-botanical text-[18px] font-bold text-[#23351d]">
              No se encontraron especies coincidentes
            </h4>
            <p className="text-[12.5px] text-[#556c4e] max-w-sm mx-auto">
              Podés dar de alta una especie personalizada e integrarla al catálogo, al jardín y a la base RAG.
            </p>
            <button
              onClick={onOpenNewCustomSpeciesModal}
              className="mt-2 bg-[#526b4a] hover:bg-[#43573c] text-white font-bold text-[12.5px] px-4 py-2 rounded-xl inline-flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Crear "{search || 'nueva especie'}" fuera de catálogo</span>
            </button>
          </div>
        ) : (
          filteredSpecies.map((species) => {
            const isExpanded = expandedSpeciesId === species.id;
            const isCustom = species.id.startsWith('custom-');
            const plantedQty = plantedCounts.get(species.id) || 0;
            const activeSeasons = parseFloweringSeasons(species.floweringSeason);
            const meters = parseMaxMeters(species.maxHeight);
            const canopyHeightPx = Math.max(22, Math.min(54, Math.round(20 + Math.min(18, meters) * 1.8)));
            const dropletsCount =
              species.wateringNeed === 'Alto' ? 3 : species.wateringNeed === 'Medio' ? 2 : 1;
            const isFullSun = species.sunlight.toLowerCase().includes('pleno');

            return (
              <div
                key={species.id}
                id={`species-card-${species.id}`}
                className={`bg-white rounded-[22px] overflow-hidden border shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group ${
                  isCustom ? 'border-emerald-300 ring-1 ring-emerald-200/50' : 'border-[#dce7d5]'
                }`}
              >
                <div>
                  {/* Imagen Herbario con hover zoom suave */}
                  <div className="relative h-48 w-full bg-[#e0ebd9] overflow-hidden">
                    <img
                      src={species.imageUrl}
                      alt={species.commonName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                    {/* Badges superiores */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap pr-2">
                      <span className="bg-white/90 backdrop-blur-md text-[#23351d] text-[10.5px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
                        {species.family}
                      </span>
                      {plantedQty > 0 && (
                        <span className="bg-emerald-600/95 backdrop-blur-md text-white text-[10.5px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>En tu jardín ({plantedQty})</span>
                        </span>
                      )}
                      {isCustom && (
                        <span className="bg-violet-600/90 backdrop-blur-md text-white text-[10.5px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
                          <Sparkles className="w-3 h-3" />
                          <span>Personalizada</span>
                        </span>
                      )}
                    </div>

                    <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-[#23351d] text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                      {species.growthRate}
                    </span>

                    <div className="absolute bottom-2.5 left-3.5 right-3.5 text-white">
                      <h3 className="font-botanical text-[21px] font-bold leading-tight drop-shadow-xs">
                        {species.commonName}
                      </h3>
                      <p className="text-[11.5px] italic text-white/90 truncate">
                        {species.scientificName} · {species.origin}
                      </p>
                    </div>
                  </div>

                  {/* Cuerpo Ficha */}
                  <div className="p-4 space-y-3">
                    <p className="text-[12.5px] text-[#475d40] leading-relaxed">
                      {species.description}
                    </p>

                    {/* Diagrama Porte + Riego Gotas + Luz Solar */}
                    <div className="grid grid-cols-12 gap-2.5 bg-[#f7faf4] p-3 rounded-2xl border border-[#e5edd4] items-center">
                      {/* Porte comparativo animado */}
                      <div className="col-span-4 flex flex-col items-center justify-end border-r border-[#e0ebd9] pr-2 min-h-[68px]">
                        <svg
                          viewBox="0 0 48 64"
                          className="w-10 overflow-visible"
                          style={{ height: `${canopyHeightPx}px` }}
                        >
                          <g className="height-grow">
                            <line
                              x1="24"
                              y1="62"
                              x2="24"
                              y2="28"
                              stroke="#6d5642"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                            />
                            <circle cx="24" cy="22" r="14" fill="#6f9c5f" opacity="0.9" />
                            <circle cx="16" cy="26" r="9" fill="#82ae72" opacity="0.85" />
                            <circle cx="32" cy="26" r="9" fill="#5e8a4f" opacity="0.85" />
                          </g>
                        </svg>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-[#354c2e] mt-1">
                          <Ruler className="w-3 h-3 text-[#65845a]" />
                          <span className="truncate max-w-[76px]" title={species.maxHeight}>
                            {species.maxHeight}
                          </span>
                        </div>
                      </div>

                      {/* Parámetros Hídricos y Solares */}
                      <div className="col-span-8 space-y-2 text-[11.5px]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[#556c4e] font-medium">Riego:</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3].map((idx) => (
                              <Droplets
                                key={idx}
                                className={`w-3.5 h-3.5 ${
                                  idx <= dropletsCount
                                    ? 'text-sky-600'
                                    : 'text-[#d7e3cf]'
                                }`}
                              />
                            ))}
                            <strong className="text-[#23351d] ml-1">{species.wateringNeed}</strong>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[#556c4e] font-medium">Luz:</span>
                          <div className="flex items-center gap-1.5 text-right">
                            <Sun
                              className={`w-3.5 h-3.5 text-amber-500 ${
                                isFullSun ? 'spin-slow' : 'opacity-75'
                              }`}
                            />
                            <strong className="text-[#23351d] text-[11px]">
                              {species.sunlight}
                            </strong>
                          </div>
                        </div>

                        {/* Calendario 4 Estaciones */}
                        <div className="pt-1 border-t border-[#e5edd4]">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-semibold text-[#5b7254]">
                              Floración anual:
                            </span>
                            <span className="text-[10px] text-[#354c2e] truncate max-w-[130px]" title={species.floweringSeason}>
                              {species.floweringSeason}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-1">
                            {SEASONS.map((st) => {
                              const isActive = activeSeasons.has(st.key);
                              const isNow = st.key === currentSeason && isActive;
                              return (
                                <span
                                  key={st.key}
                                  className={`text-center py-0.5 rounded-md text-[9.5px] font-bold border ${
                                    isNow
                                      ? 'bg-violet-600 text-white border-violet-600'
                                      : isActive
                                      ? 'bg-emerald-100/80 text-emerald-800 border-emerald-200'
                                      : 'bg-white/70 text-[#8ca086] border-[#e4ecd8]'
                                  }`}
                                >
                                  {st.short}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Detalles Expandibles */}
                    {isExpanded && (
                      <div className="space-y-2 pt-1 text-[12px] border-t border-[#edf3e8]">
                        <div className="bg-[#fcfdfa] p-3 rounded-xl border border-[#e6eedf] space-y-1.5">
                          <p>
                            <strong className="text-[#2a3e23]">Suelo Óptimo:</strong>{' '}
                            <span className="text-[#495f42]">{species.optimalSoil}</span>
                          </p>
                          <p>
                            <strong className="text-[#2a3e23]">Porte Máximo:</strong>{' '}
                            <span className="text-[#495f42]">{species.maxHeight}</span>
                          </p>
                          <p>
                            <strong className="text-[#2a3e23]">Vulnerabilidad a Plagas:</strong>{' '}
                            <span className="text-[#495f42]">{species.pestVulnerability}</span>
                          </p>
                          <p>
                            <strong className="text-[#2a3e23]">Directriz Fitosanitaria:</strong>{' '}
                            <span className="text-[#495f42]">{species.phytosanitaryNotes}</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Fila de Acciones */}
                <div className="px-4 pb-4 flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => toggleExpand(species.id)}
                    className="py-1.5 px-3 text-[11.5px] font-semibold text-[#4e6745] hover:text-[#25391d] bg-[#f0f6ec] rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>{isExpanded ? 'Menos detalles' : 'Ficha botánica'}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    id={`btn-rag-${species.id}`}
                    onClick={() => handleOpenRag(species)}
                    className="py-1.5 px-3 text-[11.5px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 rounded-xl flex items-center gap-1.5 transition-colors border border-emerald-200 cursor-pointer"
                    title="Ver ficha de literatura RAG y documento vectorizado"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ficha RAG</span>
                  </button>

                  {isCustom && onDeleteCustomSpecies && (
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `¿Eliminar la especie "${species.commonName}" del catálogo personalizado?`
                          )
                        ) {
                          onDeleteCustomSpecies(species.id);
                        }
                      }}
                      className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      title="Eliminar especie personalizada"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    id={`btn-plant-${species.id}`}
                    onClick={() => onSelectSpeciesToPlant(species)}
                    className="btn-shimmer flex-1 min-w-[130px] bg-gradient-to-r from-[#567a4a] to-[#46663b] hover:brightness-105 text-white py-2 px-3 rounded-xl font-bold text-[12px] flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Plantar en Jardín</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
