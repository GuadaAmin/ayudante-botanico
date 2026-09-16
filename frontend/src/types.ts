export type PlantStatus = 'stable' | 'attention' | 'critical';

export interface AlertInfo {
  id: string;
  specimenId: string;
  specimenName: string;
  type: 'irrigation' | 'phytosanitary';
  label: 'Riego Requerido' | 'Revisión Fitosanitaria';
  reason: string;
  irrigationPriority: number; // e.g. 81.37%
  phytosanitaryRisk: number;  // e.g. 70.0%
  severity: 'critical' | 'attention';
  ruleTriggered: string;
}

export interface Specimen {
  id: string;
  name: string;
  scientificName: string;
  commonName: string;
  family: string;
  status: PlantStatus;
  location: string;
  plantedDate: string;
  irrigationPriority: number; // Salida SED: Prioridad de Riego (0-100)
  phytosanitaryRisk: number;  // Salida SED: Riesgo Fitosanitario (0-100)
  soilMoisture: number;       // Entrada SED: HVS - Humedad Volumétrica del Sustrato (0-100)
  temperature: number;        // Entrada SED: TA - Temperatura Ambiental (-10 a 50 °C)
  humidity: number;           // Entrada SED: HR - Humedad Relativa (0-100)
  lastWatered: string;
  imageUrl: string;
  activeAlert?: AlertInfo | null;
  notes: string;
  history: {
    id: string;
    date: string;
    type: 'riego' | 'tratamiento' | 'poda' | 'diagnostico';
    description: string;
    operator: string;
  }[];
}

export interface CatalogSpecies {
  id: string;
  commonName: string;
  commonNameAlt?: string;
  scientificName: string;
  family: string;
  origin: string;
  description: string;
  wateringNeed: 'Bajo' | 'Medio' | 'Alto';
  sunlight: 'Pleno sol' | 'Media sombra' | 'Sombra' | 'Pleno sol a media sombra';
  growthRate: 'Rápido' | 'Moderado' | 'Lento';
  floweringSeason: string;
  optimalSoil: string;
  maxHeight: string;
  imageUrl: string;
  pestVulnerability: string;
  phytosanitaryNotes: string;
}

export interface SedRule {
  id: string;
  code: string;
  name: string;
  category: 'Riego' | 'Fitosanitario';
  antecedent: string;
  consequent: string;
  weight: number;
  explanation: string;
  recommendedAction: string;
}

export interface RagDocument {
  id: string;
  title: string;
  section: string;
  source: string;
  year: number;
  content: string;
  tags: string[];
}
