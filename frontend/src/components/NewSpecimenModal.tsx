import React, { useState } from 'react';
import { X, Plus, MapPin, Check, Sparkles } from 'lucide-react';
import { CatalogSpecies, Specimen } from '../types';
import { CATALOG_SPECIES } from '../data/botanicalData';

interface NewSpecimenModalProps {
  isOpen: boolean;
  preselectedSpecies?: CatalogSpecies | null;
  onClose: () => void;
  // Actualizado para requerir una promesa
  onAddSpecimen: (newSpecimen: Specimen) => Promise<void>;
}

export const NewSpecimenModal: React.FC<NewSpecimenModalProps> = ({
  isOpen,
  preselectedSpecies,
  onClose,
  onAddSpecimen
}) => {
  if (!isOpen) return null;

  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string>(
    preselectedSpecies?.id || CATALOG_SPECIES[0].id
  );
  const selectedSpecies =
    CATALOG_SPECIES.find((s) => s.id === selectedSpeciesId) || CATALOG_SPECIES[0];

  const [customName, setCustomName] = useState(`${selectedSpecies.commonName}`);
  const [location, setLocation] = useState('');
  const [soilMoisture, setSoilMoisture] = useState<number>(45);
  const [notes, setNotes] = useState('');

  // Nuevos estados para control de interfaz
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSpeciesChange = (speciesId: string) => {
    setSelectedSpeciesId(speciesId);
    const sp = CATALOG_SPECIES.find((s) => s.id === speciesId);
    if (sp) {
      setCustomName(`${sp.commonName}`);
    }
  };

  // Convertido a función asíncrona
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null); // Limpiar errores previos
    setIsSubmitting(true);

    const isDry = soilMoisture < 25;
    const initialStatus = isDry ? 'attention' : 'stable';

    const newSpecimen: Specimen = {
      id: `spec-${Date.now()}`,
      name: customName || selectedSpecies.commonName,
      scientificName: selectedSpecies.scientificName,
      commonName: selectedSpecies.commonName,
      family: selectedSpecies.family,
      status: initialStatus,
      location: location.trim(), 
      plantedDate: new Date().toISOString().split('T')[0],
      irrigationPriority: isDry ? 68.0 : 20.0,
      phytosanitaryRisk: 15.0,
      soilMoisture,
      temperature: 24.5,
      humidity: 55.0,
      lastWatered: 'Hoy al plantar',
      imageUrl: selectedSpecies.imageUrl,
      notes: notes.trim(),
      activeAlert: isDry
        ? {
            id: `alt-${Date.now()}`,
            specimenId: `spec-${Date.now()}`,
            specimenName: customName,
            type: 'irrigation',
            label: 'Riego Requerido',
            reason: 'Humedad inicial baja detectada en trasplante.',
            irrigationPriority: 68.0,
            phytosanitaryRisk: 15.0,
            severity: 'attention',
            ruleTriggered: 'R-HIDRO-02'
          }
        : null,
      history: [
        {
          id: `h-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: 'diagnostico',
          description: `Plantación y alta en el SED con sensor telemétrico en ${location || 'ubicación general'}`,
          operator: 'Administrador del Jardín'
        }
      ]
    };

    try {
      await onAddSpecimen(newSpecimen);
      onClose(); // Solo se cierra si la promesa se resuelve sin arrojar excepciones
    } catch (error: any) {
      setErrorMessage(error.message); // Captura el error y mantiene el estado actual
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-[28px] border border-[#dce7d5] shadow-2xl p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#edf3e8] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#dfead8] text-[#334c2d] flex items-center justify-center">
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <h3 className="font-botanical text-[20px] font-bold text-[#1f3019]">
              Registrar Nuevo Ejemplar
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#6a8063] hover:text-[#21321b] hover:bg-[#eef4ea] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Species selector */}
          <div>
            <label className="block text-[12px] font-semibold text-[#485d41] mb-1">
              Especie Botánica
            </label>
            <select
              id="new-specimen-species-select"
              value={selectedSpeciesId}
              onChange={(e) => handleSpeciesChange(e.target.value)}
              className="w-full bg-[#f6f9f3] text-[#22331d] text-[13px] font-medium py-2 px-3 rounded-xl border border-[#cad7c1] focus:outline-none focus:border-[#526b4a]"
            >
              {CATALOG_SPECIES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.commonName} ({s.scientificName})
                </option>
              ))}
            </select>
          </div>

          {/* Species photo preview banner */}
          <div className="flex items-center gap-3 bg-[#f6f9f3] p-2.5 rounded-2xl border border-[#e4eedf]">
            <img
              src={selectedSpecies.imageUrl}
              alt={selectedSpecies.commonName}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-xl object-cover shrink-0"
            />
            <div className="min-w-0 text-[12px]">
              <p className="font-bold text-[#23351d]">{selectedSpecies.scientificName}</p>
              <p className="text-[#597151]">{selectedSpecies.family} · Riego {selectedSpecies.wateringNeed}</p>
            </div>
          </div>

          {/* Custom Name / Identifier */}
          <div>
            <label className="block text-[12px] font-semibold text-[#485d41] mb-1">
              Identificador del Ejemplar
            </label>
            <input
              id="new-specimen-name-input"
              type="text"
              required
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Ej: Jacaranda 3, Ceibo Glómeta"
              className="w-full bg-white text-[#22331d] text-[13px] py-2 px-3 rounded-xl border border-[#cad7c1] focus:outline-none focus:border-[#526b4a]"
            />
          </div>

          {/* Location / Zone */}
          <div>
            <label className="block text-[12px] font-semibold text-[#485d41] mb-1">
              Ubicación / Sector en el Jardín
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#72886d]" />
              <input
                id="new-specimen-location-input"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ej: Sector Norte - Vereda Arbolada"
                className="w-full bg-white pl-9 pr-3 py-2 text-[13px] rounded-xl border border-[#cad7c1] focus:outline-none focus:border-[#526b4a] text-[#22331d]"
              />
            </div>
          </div>

          {/* Initial soil moisture */}
          <div>
            <div className="flex justify-between text-[12px] font-semibold text-[#485d41] mb-1">
              <span>Humedad Inicial de Suelo (Sensor)</span>
              <span className="text-[#20321b] font-bold">{soilMoisture}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              value={soilMoisture}
              onChange={(e) => setSoilMoisture(Number(e.target.value))}
              className="w-full accent-[#526b4a]"
            />
            <span className="text-[11px] text-[#697f62]">
              {soilMoisture < 25 ? '⚠️ Estado bajo: activará alerta de riego preventiva' : '✅ Nivel óptimo'}
            </span>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[12px] font-semibold text-[#485d41] mb-1">
              Notas Iniciales
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Ejemplar joven trasplantado recientemente con tutor."
              className="w-full bg-white text-[#22331d] text-[12px] p-2.5 rounded-xl border border-[#cad7c1] focus:outline-none focus:border-[#526b4a]"
            />
          </div>

          {/* Renderizado condicional del error de validación */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-[12.5px] mb-2 font-medium flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              {errorMessage}
            </div>
          )}

          {/* Submit */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-[#f0f4ec] hover:bg-[#e4ebd9] text-[#485e40] py-2.5 rounded-xl font-semibold text-[13px] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              id="btn-confirm-add-specimen"
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-[#526b4a] hover:bg-[#43573c] text-white py-2.5 rounded-xl font-bold text-[13px] flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-98 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Sparkles className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4 stroke-[2.5]" />
              )}
              <span>{isSubmitting ? 'Guardando...' : 'Guardar en Jardín'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};