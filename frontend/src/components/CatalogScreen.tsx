import React, { useState } from 'react';
import { Search, Droplets, Sun, Sparkles, Plus, Info, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { CatalogSpecies } from '../types';
import { CATALOG_SPECIES } from '../data/botanicalData';

interface CatalogScreenProps {
  onSelectSpeciesToPlant: (species: CatalogSpecies) => void;
}

export const CatalogScreen: React.FC<CatalogScreenProps> = ({ onSelectSpeciesToPlant }) => {
  const [search, setSearch] = useState('');
  const [familyFilter, setFamilyFilter] = useState('all');
  const [expandedSpeciesId, setExpandedSpeciesId] = useState<string | null>(null);

  const filteredSpecies = CATALOG_SPECIES.filter((s) => {
    const matchesSearch =
      s.commonName.toLowerCase().includes(search.toLowerCase()) ||
      s.scientificName.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase());
    const matchesFamily = familyFilter === 'all' || s.family === familyFilter;
    return matchesSearch && matchesFamily;
  });

  const families = ['all', ...Array.from(new Set(CATALOG_SPECIES.map((s) => s.family)))];

  const toggleExpand = (id: string) => {
    setExpandedSpeciesId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Header info banner with botanical imagery */}
      <div className="relative overflow-hidden rounded-[24px] p-5 border border-[#2d4626]/20 shadow-xs text-white">
        <img
          src="https://images.unsplash.com/photo-1533792344354-ed5e8fc12494?auto=format&fit=crop&w=1000&q=80"
          alt="Jardinería Botánica"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#142612]/92 via-[#1c321a]/82 to-[#142612]/60" />

        <div className="relative z-10">
          <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-emerald-100 border border-white/10">
            🌸 Catálogo de Flora Regional y Jardinería
          </span>
          <h2 className="font-botanical text-[24px] font-bold text-white leading-tight mt-1.5 drop-shadow-sm">
            Especies Florales y Arbóreas
          </h2>
          <p className="text-[12.5px] text-emerald-50/90 mt-1 max-w-[90%] leading-snug">
            Especies autóctonas y de jardinería adaptadas a climas subtropicales y templados. Selecciona un ejemplar para plantarlo e integrarlo al monitoreo inteligente por el SED.
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#72886d]" />
          <input
            id="catalog-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre común o científico..."
            className="w-full bg-white pl-9 pr-3 py-2 text-[13px] rounded-2xl border border-[#dbe6d3] focus:outline-none focus:border-[#526b4a] text-[#22331d]"
          />
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
              {fam === 'all' ? 'Todas las Familias' : fam}
            </button>
          ))}
        </div>
      </div>

      {/* Species Cards */}
      <div id="catalog-species-list" className="space-y-3.5">
        {filteredSpecies.map((species) => {
          const isExpanded = expandedSpeciesId === species.id;

          return (
            <div
              key={species.id}
              id={`species-card-${species.id}`}
              className="bg-white rounded-[22px] overflow-hidden border border-[#dce7d5] shadow-2xs hover:shadow-xs transition-all"
            >
              {/* Species photo with direct HTML link */}
              <div className="relative h-40 w-full bg-[#e0ebd9] overflow-hidden">
                <img
                  src={species.imageUrl}
                  alt={species.commonName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />

                {/* Family badge top left */}
                <span className="absolute top-3 left-3 bg-black/50 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full">
                  {species.family}
                </span>

                {/* Origin badge top right */}
                <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-[#23351d] text-[10.5px] font-medium px-2.5 py-0.5 rounded-full">
                  {species.growthRate} crecimiento
                </span>

                {/* Bottom title */}
                <div className="absolute bottom-2.5 left-3.5 right-3.5 text-white">
                  <h3 className="font-botanical text-[21px] font-bold leading-tight drop-shadow-xs">
                    {species.commonName}
                  </h3>
                  <p className="text-[12px] italic text-white/90">
                    {species.scientificName}
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
                        <strong className="text-[#2a3e23]">Directriz SED:</strong>{' '}
                        <span className="text-[#495f42]">{species.phytosanitaryNotes}</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions row */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => toggleExpand(species.id)}
                    className="py-1.5 px-3 text-[11.5px] font-semibold text-[#4e6745] hover:text-[#25391d] bg-[#f0f6ec] rounded-xl flex items-center gap-1 transition-colors"
                  >
                    <span>{isExpanded ? 'Menos detalles' : 'Ficha técnica'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    id={`btn-plant-${species.id}`}
                    onClick={() => onSelectSpeciesToPlant(species)}
                    className="flex-1 bg-[#526b4a] hover:bg-[#43573c] text-white py-1.5 px-3 rounded-xl font-bold text-[12px] flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Plantar en Jardín</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
