import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navbar, TabType } from './components/Navbar';
import { DashboardScreen } from './components/DashboardScreen';
import { SpecimensScreen } from './components/SpecimensScreen';
import { SedRagScreen } from './components/SedRagScreen';
import { CatalogScreen } from './components/CatalogScreen';
import { AlertDetailModal } from './components/AlertDetailModal';
import { NewSpecimenModal } from './components/NewSpecimenModal';
import { SpecimenDetailModal } from './components/SpecimenDetailModal';
import { AlertInfo, CatalogSpecies, PlantStatus, Specimen } from './types';
import { INITIAL_SPECIMENS } from './data/botanicalData';
import { checkBackendHealth } from './services/api';

export default function App() {
  // Navigation: Abre directamente en el Chatbot SED como experiencia principal
  const [activeTab, setActiveTab] = useState<TabType>('asesor');
  const [plantadasFilter, setPlantadasFilter] = useState<'all' | PlantStatus>('all');

  // Backend Connectivity
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);

  // Garden Data State
  const [specimens, setSpecimens] = useState<Specimen[]>(INITIAL_SPECIMENS);

  // Modals & Selected items
  const [selectedAlert, setSelectedAlert] = useState<{
    alert: AlertInfo;
    specimen: Specimen;
  } | null>(null);

  const [selectedSpecimenForModal, setSelectedSpecimenForModal] = useState<Specimen | null>(null);
  const [selectedSpecimenForDiag, setSelectedSpecimenForDiag] = useState<Specimen | null>(null);

  const [isNewSpecimenModalOpen, setIsNewSpecimenModalOpen] = useState(false);
  const [preselectedSpecies, setPreselectedSpecies] = useState<CatalogSpecies | null>(null);

  // Quick feedback toast/notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Verificar estado del backend FastAPI al cargar la app
  const verifyBackend = async () => {
    const health = await checkBackendHealth();
    setBackendConnected(health.online);
    if (health.online) {
      showToast('🟢 Conectado al backend FastAPI (ayudante-botanico en puerto 8000)');
    } else {
      showToast('🟡 Backend no detectado en puerto 8000. Operando en modo local');
    }
  };

  useEffect(() => {
    verifyBackend();
  }, []);

  // Actualizar estado del ejemplar cuando se ejecuta el diagnóstico SED
  const handleSpecimenEvaluated = (
    specimenId: string,
    result: { prioridad_riego: number; riesgo_fitosanitario: number }
  ) => {
    setSpecimens((prev) =>
      prev.map((s) => {
        if (s.id !== specimenId) return s;

        const pr = result.prioridad_riego;
        const rf = result.riesgo_fitosanitario;

        let newAlert: AlertInfo | null = s.activeAlert || null;
        let newStatus: PlantStatus = s.status;

        // Triggers según sección 5 del documento TP2:
        // Si Prioridad de Riego > 65%, genera tarea de riego
        // Si Riesgo Fitosanitario > 75%, genera alerta crítica
        if (pr > 65) {
          newAlert = {
            id: `alt-${Date.now()}`,
            specimenId: s.id,
            specimenName: s.name,
            type: 'irrigation',
            label: 'Riego Requerido',
            reason: `Prioridad de riego calculada por el SED en ${pr}% (>65%). Disparador de riego activado.`,
            irrigationPriority: pr,
            phytosanitaryRisk: rf,
            severity: pr > 80 ? 'critical' : 'attention',
            ruleTriggered: pr > 80 ? 'REG-01' : 'REG-02',
          };
          newStatus = pr > 80 ? 'critical' : 'attention';
        } else if (rf > 75) {
          newAlert = {
            id: `alt-${Date.now()}`,
            specimenId: s.id,
            specimenName: s.name,
            type: 'phytosanitary',
            label: 'Revisión Fitosanitaria',
            reason: `Riesgo fitosanitario elevado (${rf}% > 75%). Iniciar protocolo preventivo.`,
            irrigationPriority: pr,
            phytosanitaryRisk: rf,
            severity: 'critical',
            ruleTriggered: 'REG-11',
          };
          newStatus = 'critical';
        } else if (pr <= 45 && rf <= 50) {
          newAlert = null;
          newStatus = 'stable';
        }

        return {
          ...s,
          irrigationPriority: pr,
          phytosanitaryRisk: rf,
          status: newStatus,
          activeAlert: newAlert,
          history: [
            {
              id: `h-${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              type: 'diagnostico',
              description: `Evaluación SED Mamdani: Prioridad Riego: ${pr}%, Riesgo Fit.: ${rf}%.`,
              operator: 'Motor SED skfuzzy',
            },
            ...s.history,
          ],
        };
      })
    );

    showToast(`Diagnóstico SED aplicado: Riego ${result.prioridad_riego}%, Fitosanitario ${result.riesgo_fitosanitario}%`);
  };

  // Water specimen action
  const handleWaterSpecimen = (specimenId: string) => {
    setSpecimens((prev) =>
      prev.map((s) => {
        if (s.id !== specimenId) return s;

        const newMoisture = Math.min(s.soilMoisture + 45, 88);
        const newIrrigationPriority = Math.max(Math.round(s.irrigationPriority - 55), 12);
        
        // If alert was irrigation, clear or downgrade it
        let newAlert = s.activeAlert;
        if (newAlert && newAlert.type === 'irrigation') {
          newAlert = null;
        }

        // Determine new status
        let newStatus: PlantStatus = s.status;
        if (s.status === 'critical' && (!newAlert || newAlert.severity !== 'critical')) {
          newStatus = s.phytosanitaryRisk > 60 ? 'attention' : 'stable';
        }

        return {
          ...s,
          soilMoisture: newMoisture,
          irrigationPriority: newIrrigationPriority,
          status: newStatus,
          lastWatered: 'Hace unos momentos',
          activeAlert: newAlert,
          history: [
            {
              id: `h-${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              type: 'riego',
              description: 'Riego manual de recuperación aplicado (45L). Déficit hídrico resuelto.',
              operator: 'Operador SED'
            },
            ...s.history
          ]
        };
      })
    );

    const targetSpecimen = specimens.find((s) => s.id === specimenId);
    showToast(`💧 Riego aplicado exitosamente a ${targetSpecimen?.name || 'el ejemplar'}`);
  };

  // Resolve Phytosanitary alert
  const handleResolvePhyto = (specimenId: string) => {
    setSpecimens((prev) =>
      prev.map((s) => {
        if (s.id !== specimenId) return s;

        let newAlert = s.activeAlert;
        if (newAlert && newAlert.type === 'phytosanitary') {
          newAlert = null;
        }

        return {
          ...s,
          phytosanitaryRisk: Math.max(Math.round(s.phytosanitaryRisk - 40), 18),
          status: s.irrigationPriority > 70 ? 'critical' : 'stable',
          activeAlert: newAlert,
          history: [
            {
              id: `h-${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              type: 'tratamiento',
              description: 'Inspección fitosanitaria completada. Aireación y tratamiento preventivo aplicado.',
              operator: 'Téc. Fitosanitario'
            },
            ...s.history
          ]
        };
      })
    );

    showToast('🌿 Tratamiento fitosanitario registrado y alerta resuelta');
  };

  // Add new specimen
  const handleAddSpecimen = (newSpecimen: Specimen) => {
    setSpecimens((prev) => [newSpecimen, ...prev]);
    showToast(`🌱 ¡${newSpecimen.name} incorporado exitosamente al jardín!`);
  };

  // Navigation handlers
  const handleNavigateToPlantadasWithFilter = (filter: 'all' | PlantStatus = 'all') => {
    setPlantadasFilter(filter);
    setActiveTab('plantadas');
  };

  const handleRunDiagnosisFromSpecimen = (specimen: Specimen) => {
    setSelectedSpecimenForDiag(specimen);
    setActiveTab('asesor');
  };

  const handlePlantFromCatalog = (species: CatalogSpecies) => {
    setPreselectedSpecies(species);
    setIsNewSpecimenModalOpen(true);
  };

  const activeAlertCount = specimens.filter((s) => !!s.activeAlert).length;

  return (
    <div className="min-h-screen bg-[#e7eee1] text-[#22331d] flex flex-col items-center justify-start sm:py-6 sm:px-4 selection:bg-[#c6dec0]">
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          id="system-notification-toast"
          className="fixed top-5 z-60 bg-[#22331d] text-white px-4 py-2.5 rounded-2xl shadow-xl text-[12.5px] font-medium flex items-center gap-2 border border-[#3e5635] animate-fadeIn"
        >
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container: Diseño Web Responsivo y Amplio */}
      <main
        id="app-main-canvas"
        className="w-full max-w-5xl bg-[#f8faf6] sm:rounded-3xl shadow-xl sm:border border-[#d9e5d2] min-h-[850px] flex flex-col overflow-hidden my-0 sm:my-3"
      >
        {/* Top Header */}
        <Header
          backendConnected={backendConnected}
          onRefreshBackend={verifyBackend}
        />

        {/* Screen Content Area */}
        <div className="flex-1 px-4 sm:px-6 pt-2 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardScreen
              specimens={specimens}
              onOpenAlert={(alert, specimen) => setSelectedAlert({ alert, specimen })}
              onOpenCatalog={() => setActiveTab('catalogo')}
              onOpenNewSpecimen={() => {
                setPreselectedSpecies(null);
                setIsNewSpecimenModalOpen(true);
              }}
              onSelectSpecimen={(specimen) => setSelectedSpecimenForModal(specimen)}
              onNavigateToPlantadas={handleNavigateToPlantadasWithFilter}
              onOpenChatbot={() => setActiveTab('asesor')}
            />
          )}

          {activeTab === 'plantadas' && (
            <SpecimensScreen
              specimens={specimens}
              initialFilter={plantadasFilter}
              onSelectSpecimen={(specimen) => setSelectedSpecimenForModal(specimen)}
              onWaterSpecimen={handleWaterSpecimen}
              onOpenNewSpecimen={() => {
                setPreselectedSpecies(null);
                setIsNewSpecimenModalOpen(true);
              }}
              onRunDiagnosis={handleRunDiagnosisFromSpecimen}
            />
          )}

          {activeTab === 'asesor' && (
            <SedRagScreen
              specimens={specimens}
              selectedSpecimenForDiag={selectedSpecimenForDiag}
              onSpecimenEvaluated={handleSpecimenEvaluated}
              onWaterSpecimen={handleWaterSpecimen}
              onSelectSpecimenForModal={(sp) => setSelectedSpecimenForModal(sp)}
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'catalogo' && (
            <CatalogScreen onSelectSpeciesToPlant={handlePlantFromCatalog} />
          )}
        </div>

        {/* Bottom Navigation Bar */}
        <Navbar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'plantadas') {
              setPlantadasFilter('all');
            }
          }}
          alertCount={activeAlertCount}
        />
      </main>

      {/* MODALS */}
      {/* Alert Detail & SED Rule Modal */}
      <AlertDetailModal
        alert={selectedAlert?.alert || null}
        specimen={selectedAlert?.specimen || null}
        onClose={() => setSelectedAlert(null)}
        onApplyWatering={handleWaterSpecimen}
        onResolvePhyto={handleResolvePhyto}
      />

      {/* Register New Specimen Modal */}
      <NewSpecimenModal
        isOpen={isNewSpecimenModalOpen}
        preselectedSpecies={preselectedSpecies}
        onClose={() => {
          setIsNewSpecimenModalOpen(false);
          setPreselectedSpecies(null);
        }}
        onAddSpecimen={handleAddSpecimen}
      />

      {/* Detalle de Instancia: Telemetría, Evaluación SED, Chat RAG y Bitácora */}
      <SpecimenDetailModal
        specimen={selectedSpecimenForModal}
        onClose={() => setSelectedSpecimenForModal(null)}
        onWaterSpecimen={handleWaterSpecimen}
        onSpecimenEvaluated={handleSpecimenEvaluated}
      />
    </div>
  );
}
