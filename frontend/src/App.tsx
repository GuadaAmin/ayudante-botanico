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
import { AuthScreen } from './components/AuthScreen';
import { NewCustomSpeciesModal } from './components/NewCustomSpeciesModal';
import { RagDocumentModal } from './components/RagDocumentModal';
import { AlertInfo, CatalogSpecies, PlantStatus, Specimen, RagDocument } from './types';
import { INITIAL_SPECIMENS } from './data/botanicalData';
import { checkBackendHealth, apiClient } from './services/api';
import { getAllCatalogSpecies, deleteCustomSpecies } from './services/customBotanicalStorage';
import { LogOut } from 'lucide-react';

export default function App() {
  // Estado de Autenticación Multi-tenancy
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  // Navigation: Abre en el Dashboard o Chatbot
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [plantadasFilter, setPlantadasFilter] = useState<'all' | PlantStatus>('all');

  // Backend Connectivity
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);

  // Garden Data State: Inicializa con ejemplares para que nunca esté vacío
  const [specimens, setSpecimens] = useState<Specimen[]>(() => {
    try {
      const saved = localStorage.getItem('botanico_specimens_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_SPECIMENS;
  });

  // Modals & Selected items
  const [selectedAlert, setSelectedAlert] = useState<{
    alert: AlertInfo;
    specimen: Specimen;
  } | null>(null);

  const [selectedSpecimenForModal, setSelectedSpecimenForModal] = useState<Specimen | null>(null);
  const [selectedSpecimenForDiag, setSelectedSpecimenForDiag] = useState<Specimen | null>(null);

  // Catálogo unificado (Base + Personalizadas fuera de catálogo)
  const [catalogSpecies, setCatalogSpecies] = useState<CatalogSpecies[]>(() => getAllCatalogSpecies());

  const [isNewSpecimenModalOpen, setIsNewSpecimenModalOpen] = useState(false);
  const [isCustomSpeciesModalOpen, setIsCustomSpeciesModalOpen] = useState(false);
  const [ragModalData, setRagModalData] = useState<{ species: CatalogSpecies; ragDoc: RagDocument } | null>(null);
  const [preselectedSpecies, setPreselectedSpecies] = useState<CatalogSpecies | null>(null);

  // Quick feedback toast/notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Función para obtener las plantas del usuario autenticado desde el backend FastAPI
  const fetchUserPlantas = async () => {
    try {
      const response = await apiClient.get('/api/plantas');
      const backendPlantas = response.data.map((p: any) => {
        const pr = p.prioridad_riego_actual ?? 0;
        const rf = p.indice_riesgo_fitosanitario ?? 0;
        
        let currentStatus: PlantStatus = 'stable';
        let currentAlert: AlertInfo | null = null;

        if (pr > 65) {
          currentStatus = pr > 80 ? 'critical' : 'attention';
          currentAlert = {
            id: `alt-${p.id}-${Date.now()}`,
            specimenId: String(p.id),
            specimenName: p.alias,
            type: 'irrigation',
            label: 'Riego Requerido',
            reason: `Prioridad de riego calculada por el SED en ${pr}% (>65%). Disparador de riego activado.`,
            irrigationPriority: pr,
            phytosanitaryRisk: rf,
            severity: currentStatus,
            ruleTriggered: pr > 80 ? 'REG-01' : 'REG-02',
          };
        } else if (rf > 75) {
          currentStatus = 'critical';
          currentAlert = {
            id: `alt-${p.id}-${Date.now()}`,
            specimenId: String(p.id),
            specimenName: p.alias,
            type: 'phytosanitary',
            label: 'Revisión Fitosanitaria',
            reason: `Riesgo fitosanitario elevado (${rf}% > 75%). Iniciar protocolo preventivo.`,
            irrigationPriority: pr,
            phytosanitaryRisk: rf,
            severity: 'critical',
            ruleTriggered: 'REG-11',
          };
        } else if (rf > 60) {
          currentStatus = 'attention';
        }

        return {
          id: String(p.id),
          name: p.alias,
          scientificName: p.especie?.nombre_cientifico || 'Especie Registrada',
          commonName: p.especie?.nombre_comun || p.alias,
          family: p.especie?.familia || 'Desconocida',
          location: p.ubicacion || 'Cantero Principal',
          soilMoisture: p.ultima_telemetria?.humedad_sustrato ?? 45,
          temperature: p.ultima_telemetria?.temperatura_ambiental ?? 24,
          humidity: p.ultima_telemetria?.humedad_relativa ?? 50,
          irrigationPriority: pr,
          phytosanitaryRisk: rf,
          status: currentStatus,
          lastWatered: 'Hace un tiempo',
          imageUrl: p.especie?.imagen_url || 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&q=80&w=600',
          history: p.historial || [],
          activeAlert: currentAlert // Ko'ápe oñemoĩ pe alerta teete
        };
      });
      setSpecimens(backendPlantas);
    } catch (err) {
      console.error('Error al obtener las plantas del usuario:', err);
    }
  };

  // Sincronizar ejemplares con localStorage
  useEffect(() => {
    try {
      if (specimens.length > 0) {
        localStorage.setItem('botanico_specimens_v1', JSON.stringify(specimens));
      }
    } catch (e) {
      console.error('Error guardando ejemplares en localStorage:', e);
    }
  }, [specimens]);

  // Verificar token inicial al montar la aplicación
  useEffect(() => {
    const token = localStorage.getItem('token_autenticacion');
    if (token) {
      setIsAuthenticated(true);
      
      // Extraer el nombre de usuario decodificando el payload del JWT
      try {
        const base64Payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          window.atob(base64Payload)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const decoded = JSON.parse(jsonPayload);
        
        if (decoded.sub) {
          setCurrentUsername(decoded.sub);
        }
      } catch (err) {
        console.error('Error al decodificar el token JWT en el cliente:', err);
      }

      fetchUserPlantas();
    }
  }, []);

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
    if (isAuthenticated) {
      verifyBackend();
    }
  }, [isAuthenticated]);

  const handleLoginSuccess = (token: string, username: string) => {
    localStorage.setItem('token_autenticacion', token);
    setIsAuthenticated(true);
    setCurrentUsername(username);
    fetchUserPlantas();
    showToast(`👋 ¡Bienvenido de nuevo, ${username}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token_autenticacion');
    setIsAuthenticated(false);
    setCurrentUsername(null);
    setSpecimens([]);
    showToast('🔒 Sesión cerrada correctamente');
  };

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

  const handleWaterSpecimen = (specimenId: string) => {
    setSpecimens((prev) =>
      prev.map((s) => {
        if (s.id !== specimenId) return s;

        const newMoisture = Math.min(s.soilMoisture + 45, 88);
        const newIrrigationPriority = Math.max(Math.round(s.irrigationPriority - 55), 12);
        
        let newAlert = s.activeAlert;
        if (newAlert && newAlert.type === 'irrigation') {
          newAlert = null;
        }

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

  const handleAddSpecimen = async (newSpecimen: Specimen) => {
    // Validación frontend O(n)
    const nombreDuplicado = specimens.some(
      (s) => s.name.toLowerCase() === newSpecimen.name.toLowerCase()
    );
    if (nombreDuplicado) {
      // Arrojar el error detiene la ejecución y lo envía al catch del Modal
      throw new Error(`El nombre "${newSpecimen.name}" ya está en uso. Por favor, elige un alias distinto.`);
    }

    try {
      await apiClient.post('/api/plantas', {
        alias: newSpecimen.name,
        ubicacion: newSpecimen.location,
        nombre_cientifico: newSpecimen.scientificName,
        nombre_comun: newSpecimen.commonName,
        imagen_url: newSpecimen.imageUrl,
        familia: newSpecimen.family,
        notas_iniciales: newSpecimen.notes || ''
      });
      fetchUserPlantas(); 
      showToast(`🌱 ¡${newSpecimen.name} incorporado exitosamente!`);
    } catch (err: any) {
      console.warn('Backend no disponible o sin autenticación remota. Guardando localmente:', err);
      // Fallback local: guardar directamente en el jardín para modo libre
      setSpecimens((prev) => [newSpecimen, ...prev]);
      showToast(`🌱 ¡${newSpecimen.name} guardado en tu jardín local!`);
    }
  };

  const handleDeleteSpecimen = async (specimenId: string) => {
    try {
      await apiClient.delete(`/api/plantas/${specimenId}`);
      fetchUserPlantas();
    } catch (err: any) {
      console.warn('Eliminación local (backend no disponible o sin auth):', err);
    }
    // Siempre remover del estado local
    setSpecimens((prev) => prev.filter((s) => s.id !== specimenId));
    setSelectedSpecimenForModal(null);
    showToast('🗑️ Ejemplar eliminado del jardín.');
  };

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

  // Manejo de incorporación de especies personalizadas
  const handleSpeciesAdded = async (species: CatalogSpecies, plantedSpecimen?: Specimen, ragDoc?: RagDocument) => {
    // 1. Recargar lista completa de catálogo
    setCatalogSpecies(getAllCatalogSpecies());

    // 2. Si se plantó de forma inmediata, registrarlo
    if (plantedSpecimen) {
      try {
        await handleAddSpecimen(plantedSpecimen);
        showToast(` ¡${species.commonName} registrada en catálogo y plantada en el jardín!`);
      } catch (e: any) {
        // Fallback local si backend no responde
        setSpecimens((prev) => [plantedSpecimen, ...prev]);
        showToast(` ¡${species.commonName} agregada al catálogo y guardada en el jardín!`);
      }
    } else {
      showToast(` ¡${species.commonName} agregada al catálogo y a la base RAG!`);
    }
  };

  const handleDeleteCustomSpecies = (speciesId: string) => {
    deleteCustomSpecies(speciesId);
    setCatalogSpecies(getAllCatalogSpecies());
    showToast('🗑️ Especie eliminada del catálogo personalizado');
  };

  const handleOpenRagModal = (species: CatalogSpecies, doc: RagDocument) => {
    setRagModalData({ species, ragDoc: doc });
  };

  const activeAlertCount = specimens.filter((s) => !!s.activeAlert).length;

  // SI EL USUARIO NO ESTÁ AUTENTICADO: Renderiza exclusivamente la pantalla de Login/Registro
  if (!isAuthenticated) {
    return (
      <>
        {toastMessage && (
          <div className="fixed top-5 z-60 bg-[#22331d] text-white px-4 py-2.5 rounded-2xl shadow-xl text-[12.5px] font-medium flex items-center gap-2 border border-[#3e5635] animate-fadeIn">
            <span>{toastMessage}</span>
          </div>
        )}
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  // SI ESTÁ AUTENTICADO: Renderiza el sistema completo con barra de sesión
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

      {/* Barra superior de control de usuario multi-tenancy */}
      <div className="w-full max-w-5xl flex justify-end px-2 sm:px-0 mb-2">
        <div className="bg-white/80 backdrop-blur-xs px-4 py-1.5 rounded-2xl border border-[#d9e5d2] shadow-xs flex items-center gap-3 text-[12px]">
          <span className="text-[#556d4e]">Sesión activa: <strong className="text-[#22331d]">{currentUsername || 'Usuario'}</strong></span>
          <button
            onClick={handleLogout}
            className="bg-[#fee2e2] hover:bg-[#fecaca] text-[#991b1b] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 transition-all cursor-pointer border border-[#fca5a5]"
            title="Cerrar sesión"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Salir</span>
          </button>
        </div>
      </div>

      {/* Main Container: Diseño Web Responsivo y Amplio */}
      <main
        id="app-main-canvas"
        className="w-full max-w-5xl bg-[#f8faf6] sm:rounded-3xl shadow-xl sm:border border-[#d9e5d2] min-h-[850px] flex flex-col relative my-0 sm:my-1"
      >
        {/* Top Header */}
        <Header
          backendConnected={backendConnected}
          onRefreshBackend={verifyBackend}
        />

        {/* Screen Content Area */}
        <div className="flex-1 px-4 sm:px-6 pt-2 pb-6">
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
            <CatalogScreen 
              catalogSpecies={catalogSpecies}
              onSelectSpeciesToPlant={handlePlantFromCatalog}
              onOpenNewCustomSpeciesModal={() => setIsCustomSpeciesModalOpen(true)}
              onOpenRagDocModal={handleOpenRagModal}
              onDeleteCustomSpecies={handleDeleteCustomSpecies}
            />
          )}
        </div>

        {/* Bottom Navigation Bar: Se mantiene fija y visible mientras se scrolea */}
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
      <AlertDetailModal
        alert={selectedAlert?.alert || null}
        specimen={selectedAlert?.specimen || null}
        onClose={() => setSelectedAlert(null)}
        onApplyWatering={handleWaterSpecimen}
        onResolvePhyto={handleResolvePhyto}
      />

      <NewSpecimenModal
        isOpen={isNewSpecimenModalOpen}
        catalogSpeciesList={catalogSpecies}
        preselectedSpecies={preselectedSpecies}
        onClose={() => {
          setIsNewSpecimenModalOpen(false);
          setPreselectedSpecies(null);
        }}
        onAddSpecimen={handleAddSpecimen}
        onOpenCustomSpeciesModal={() => setIsCustomSpeciesModalOpen(true)}
      />

      <SpecimenDetailModal
        specimen={selectedSpecimenForModal}
        onClose={() => setSelectedSpecimenForModal(null)}
        onWaterSpecimen={handleWaterSpecimen}
        onSpecimenEvaluated={handleSpecimenEvaluated}
        onDeleteSpecimen={handleDeleteSpecimen}
      />

      {/* Modal para Crear Nueva Especie Fuera de Catálogo */}
      <NewCustomSpeciesModal
        isOpen={isCustomSpeciesModalOpen}
        onClose={() => setIsCustomSpeciesModalOpen(false)}
        onSpeciesAdded={handleSpeciesAdded}
      />

      {/* Modal para Visualizar Ficha de Literatura RAG y Código ChromaDB */}
      <RagDocumentModal
        isOpen={!!ragModalData}
        species={ragModalData?.species || null}
        ragDoc={ragModalData?.ragDoc || null}
        onClose={() => setRagModalData(null)}
      />
    </div>
  );
}