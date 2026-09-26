import React, { useState } from 'react';
import { 
  Search, 
  Droplets, 
  Sun, 
  Sparkles, 
  Plus, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  BookOpen,
  Trash2,
  Tag,
  Leaf
} from 'lucide-react';
import { CatalogSpecies, RagDocument } from '../types';
import { 
  getCustomRAGDocuments, 
  generateRAGDocumentFromSpecies 
} from '../services/customBotanicalStorage';

interface CatalogScreenProps {
  catalogSpecies: CatalogSpecies[];
  onSelectSpeciesToPlant: (species: CatalogSpecies) => void;
  onOpenNewCustomSpeciesModal: () => void;
  onOpenRagDocModal: (species: CatalogSpecies, doc: RagDocument) => void;
  onDeleteCustomSpecies?: (speciesId: string) => void;
}

export const CatalogScreen: React.FC<CatalogScreenProps> = ({ 
  catalogSpecies,
  onSelectSpeciesToPlant,
  onOpenNewCustomSpeciesModal,
  onOpenRagDocModal,
  onDeleteCustomSpecies
}) => {
  const [search, setSearch] = useState('');
  const [familyFilter, setFamilyFilter] = useState('all');
  const [expandedSpeciesId, setExpandedSpeciesId] = useState<string | null>(null);

  const filteredSpecies = catalogSpecies.filter((s) => {
    const matchesSearch =
      s.commonName.toLowerCase().includes(search.toLowerCase()) ||
      s.scientificName.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()) ||
      s.family.toLowerCase().includes(search.toLowerCase());
    const matchesFamily = familyFilter === 'all' || s.family === familyFilter;
    return matchesSearch && matchesFamily;
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
    <div className="space-y-4 pb-4">
      {/* Header info banner with botanical imagery & action button */}
      <div className="relative overflow-hidden rounded-[24px] p-5 sm:p-6 border border-[#2d4626]/20 shadow-xs text-white">
        <img
          src="https://images.unsplash.com/photo-1533792344354-ed5e8fc12494?auto=format&fit=crop&w=1000&q=80"
          alt="Jardinería Botánica"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#142612]/95 via-[#1c321a]/85 to-[#142612]/65" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10.5px] font-bold uppercase tracking-widest bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-emerald-100 border border-white/10 inline-flex items-center gap-1.5">
              <span>🌸 Catálogo de Flora Regional y Jardinería</span>
            </span>
            <h2 className="font-botanical text-[24px] sm:text-[26px] font-bold text-white leading-tight drop-shadow-sm">
              Especies Florales y Arbóreas
            </h2>
            <p className="text-[12.5px] text-emerald-50/90 max-w-xl leading-snug">
              Especies autóctonas y de jardinería adaptadas. Puedes plantar ejemplares existentes o incorporar nuevas especies fuera del catálogo con su respectiva ficha RAG.
            </p>
          </div>

          {/* Quick CTA to add custom species */}
          <button
            id="btn-open-new-custom-species-banner"
            onClick={onOpenNewCustomSpeciesModal}
            className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[13px] px-4 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 border border-emerald-400/30 active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>+ Nueva Especie </span>
          </button>
        </div>
      </div>

      {/* Search & Action Bar */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#72886d]" />
            <input
              id="catalog-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre común, científico o familia..."
              className="w-full bg-white pl-9 pr-3 py-2 text-[13px] rounded-2xl border border-[#dbe6d3] focus:outline-none focus:border-[#526b4a] text-[#22331d]"
            />
          </div>

          <button
            onClick={onOpenNewCustomSpeciesModal}
            className="sm:hidden w-full bg-[#3c5633] text-white py-2 px-3 rounded-2xl font-bold text-[12.5px] flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Agregar Especie</span>
          </button>
        </div>

        {/* Family filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {families.map((fam) => (
            <button
              key={fam}
              onClick={() => setFamilyFilter(fam)}
              className={`px-3 py-1 rounded-full text-[11.5px] font-semibold transition-all whitespace-nowrap ${
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

      {/* Species Cards */}
      <div id="catalog-species-list" className="space-y-3.5">
        {filteredSpecies.length === 0 ? (
          <div className="bg-white rounded-[22px] border border-[#dce7d5] p-8 text-center space-y-3">
            <Leaf className="w-10 h-10 text-[#738d6f] mx-auto opacity-70" />
            <h4 className="font-botanical text-[18px] font-bold text-[#23351d]">
              No se encontraron especies coincidentes
            </h4>
            <p className="text-[12.5px] text-[#556c4e] max-w-sm mx-auto">
              Puedes dar de alta esta especie personalizada e integrarla tanto al catálogo como al jardín y a la base RAG.
            </p>
            <button
              onClick={onOpenNewCustomSpeciesModal}
              className="mt-2 bg-[#526b4a] hover:bg-[#43573c] text-white font-bold text-[12.5px] px-4 py-2 rounded-xl inline-flex items-center gap-2 shadow-2xs transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Crear "{search}" fuera de catálogo</span>
            </button>
          </div>
        ) : (
          filteredSpecies.map((species) => {
            const isExpanded = expandedSpeciesId === species.id;
            const isCustom = species.id.startsWith('custom-');

            return (
              <div
                key={species.id}
                id={`species-card-${species.id}`}
                className={`bg-white rounded-[22px] overflow-hidden border shadow-2xs hover:shadow-xs transition-all ${
                  isCustom ? 'border-emerald-300 ring-1 ring-emerald-200/50' : 'border-[#dce7d5]'
                }`}
              >
                {/* Species photo with direct HTML link */}
                <div className="relative h-44 w-full bg-[#e0ebd9] overflow-hidden">
                  <img
                    src={species.imageUrl}
                    alt={species.commonName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                  {/* Badges top */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                    <span className="bg-black/50 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full">
                      {species.family}
                    </span>
                    {isCustom && (
                      <span className="bg-emerald-500/90 backdrop-blur-md text-white text-[10.5px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                        <Sparkles className="w-3 h-3" />
                        <span> Fuera de Catálogo</span>
                      </span>
                    )}
                  </div>

                  {/* Growth badge top right */}
                  <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-[#23351d] text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full">
                    {species.growthRate} crecimiento
                  </span>

                  {/* Bottom title */}
                  <div className="absolute bottom-2.5 left-3.5 right-3.5 text-white">
                    <h3 className="font-botanical text-[22px] font-bold leading-tight drop-shadow-xs">
                      {species.commonName}
                    </h3>
                    <p className="text-[12px] italic text-white/90">
                      {species.scientificName} · {species.origin}
                    </p>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-3.5 space-y-3">
                  <p className="text-[12.5px] text-[#475d40] leading-relaxed">
                    {species.description}
                  </p>

                  {/* Quick Attributes */}
                  <div className="grid grid-cols-2 gap-2 text-[11.5px] bg-[#f7faf4] p-2.5 rounded-xl border border-[#e5edd4]">
                    <div className="flex items-center gap-1.5 text-[#354c2e]">
                      <Droplets className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
                      <span>Riego: <strong className="font-bold">{species.wateringNeed}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#354c2e]">
                      <Sun className="w-3.5 h-3.5 text-[#ca8a04] shrink-0" />
                      <span>Luz: <strong className="font-bold">{species.sunlight}</strong></span>
                    </div>
                    <div className="col-span-2 text-[11px] text-[#556c4e]">
                      🌸 Floración: <span className="font-medium text-[#23351d]">{species.floweringSeason}</span>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="space-y-2 pt-1 text-[12px] animate-fadeIn border-t border-[#edf3e8]">
                      <div className="bg-[#fcfdfa] p-2.5 rounded-xl border border-[#e6eedf] space-y-1.5">
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

                  {/* Actions row */}
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <button
                      onClick={() => toggleExpand(species.id)}
                      className="py-1.5 px-3 text-[11.5px] font-semibold text-[#4e6745] hover:text-[#25391d] bg-[#f0f6ec] rounded-xl flex items-center gap-1 transition-colors"
                    >
                      <span>{isExpanded ? 'Menos detalles' : 'Ficha botánica'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {/* View RAG Document Modal Button */}
                    <button
                      id={`btn-rag-${species.id}`}
                      onClick={() => handleOpenRag(species)}
                      className="py-1.5 px-3 text-[11.5px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 rounded-xl flex items-center gap-1.5 transition-colors border border-emerald-200"
                      title="Ver ficha de literatura RAG y código para ChromaDB"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Ficha RAG</span>
                    </button>

                    {/* Delete custom species option */}
                    {isCustom && onDeleteCustomSpecies && (
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar la especie "${species.commonName}" del catálogo personalizado?`)) {
                            onDeleteCustomSpecies(species.id);
                          }
                        }}
                        className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                        title="Eliminar especie personalizada"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      id={`btn-plant-${species.id}`}
                      onClick={() => onSelectSpeciesToPlant(species)}
                      className="flex-1 min-w-[130px] bg-[#526b4a] hover:bg-[#43573c] text-white py-1.5 px-3 rounded-xl font-bold text-[12px] flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Plantar en Jardín</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
