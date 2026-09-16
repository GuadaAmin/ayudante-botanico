import { AlertInfo, CatalogSpecies, RagDocument, SedRule, Specimen } from '../types';

export const INITIAL_SPECIMENS: Specimen[] = [
  {
    id: 'spec-1',
    name: 'Jacaranda 1',
    scientificName: 'Jacaranda mimosifolia',
    commonName: 'Jacarandá',
    family: 'Bignoniaceae',
    status: 'critical',
    location: 'Sector Norte - Vereda Arbolada',
    plantedDate: '2022-04-15',
    irrigationPriority: 81.37,
    phytosanitaryRisk: 70.0,
    soilMoisture: 25.0,
    temperature: 35.0,
    humidity: 40.0,
    lastWatered: 'Hace 5 días',
    imageUrl: 'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?auto=format&fit=crop&w=800&q=80',
    notes: 'Ejemplar en etapa de crecimiento vegetativo previo a floración primaveral. Sufre estrés térmico moderado.',
    activeAlert: {
      id: 'alt-1',
      specimenId: 'spec-1',
      specimenName: 'Jacaranda 1',
      type: 'irrigation',
      label: 'Riego Requerido',
      reason: 'Prioridad calculada por el SED en 81.37% por déficit hídrico y alta temperatura (>65%).',
      irrigationPriority: 81.37,
      phytosanitaryRisk: 70.0,
      severity: 'critical',
      ruleTriggered: 'REG-01'
    },
    history: [
      { id: 'h1', date: '2026-09-09', type: 'riego', description: 'Riego profundo de mantenimiento (45L)', operator: 'Sistema Automatizado' },
      { id: 'h2', date: '2026-08-15', type: 'poda', description: 'Poda de formación de ramas bajas', operator: 'Ing. M. Gómez' }
    ]
  },
  {
    id: 'spec-2',
    name: 'Ceiba 2',
    scientificName: 'Ceiba speciosa',
    commonName: 'Palo Borracho Rosado',
    family: 'Malvaceae',
    status: 'attention',
    location: 'Cantero Central - Glorieta',
    plantedDate: '2020-09-21',
    irrigationPriority: 25.0,
    phytosanitaryRisk: 68.5,
    soilMoisture: 78.0,
    temperature: 24.2,
    humidity: 86.4,
    lastWatered: 'Ayer a las 18:30',
    imageUrl: 'https://images.unsplash.com/photo-1556886955-13c51410cd17?auto=format&fit=crop&w=800&q=80',
    notes: 'Tronco ensanchado reservorio en buen estado. Presencia de humedad relativa alta constante y condensación foliar matutina.',
    activeAlert: {
      id: 'alt-2',
      specimenId: 'spec-2',
      specimenName: 'Ceiba 2',
      type: 'phytosanitary',
      label: 'Revisión Fitosanitaria',
      reason: 'Riesgo fitosanitario elevado (68.5%) por HR alta y suelo saturado.',
      irrigationPriority: 25.0,
      phytosanitaryRisk: 68.5,
      severity: 'attention',
      ruleTriggered: 'REG-12'
    },
    history: [
      { id: 'h3', date: '2026-09-13', type: 'riego', description: 'Riego por goteo programado', operator: 'Sector Cantero' },
      { id: 'h4', date: '2026-07-22', type: 'tratamiento', description: 'Aplicación preventiva de caldo bordelés', operator: 'Téc. F. Ramos' }
    ]
  },
  {
    id: 'spec-3',
    name: 'Lapacho Rosado',
    scientificName: 'Handroanthus impetiginosus',
    commonName: 'Lapacho Rosado / Tajibo',
    family: 'Bignoniaceae',
    status: 'stable',
    location: 'Sector Sur - Parque Abierto',
    plantedDate: '2021-11-10',
    irrigationPriority: 69.2,
    phytosanitaryRisk: 25.0,
    soilMoisture: 22.1,
    temperature: 28.4,
    humidity: 46.0,
    lastWatered: 'Hace 4 días',
    imageUrl: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=800&q=80',
    notes: 'Preparación de yemas florales. Requiere hidratación puntual en base radicular profunda.',
    activeAlert: {
      id: 'alt-3',
      specimenId: 'spec-3',
      specimenName: 'Lapacho Rosado',
      type: 'irrigation',
      label: 'Riego Requerido',
      reason: 'Prioridad calculada en 69.2% por déficit hídrico sostenido.',
      irrigationPriority: 69.2,
      phytosanitaryRisk: 25.0,
      severity: 'critical',
      ruleTriggered: 'REG-02'
    },
    history: [
      { id: 'h5', date: '2026-09-10', type: 'riego', description: 'Riego de auxilio 30L', operator: 'Equipo de Mantenimiento' }
    ]
  },
  {
    id: 'spec-4',
    name: 'Tipa 1',
    scientificName: 'Tipuana tipu',
    commonName: 'Tipa Blanca',
    family: 'Fabaceae',
    status: 'stable',
    location: 'Lindero Este - Cortina de Sombreo',
    plantedDate: '2019-05-18',
    irrigationPriority: 15.0,
    phytosanitaryRisk: 12.0,
    soilMoisture: 52.0,
    temperature: 24.0,
    humidity: 58.0,
    lastWatered: 'Hace 2 días',
    imageUrl: 'https://images.unsplash.com/photo-1528834342297-fdefb9a5a92b?auto=format&fit=crop&w=800&q=80',
    notes: 'Floración amarilla dorada en racimos terminales, fijación simbiótica de nitrógeno activa.',
    activeAlert: null,
    history: [
      { id: 'h6', date: '2026-09-12', type: 'riego', description: 'Riego estándar', operator: 'Sector Riego' }
    ]
  },
  {
    id: 'spec-5',
    name: 'Santa Rita Pérgola',
    scientificName: 'Bougainvillea spectabilis',
    commonName: 'Santa Rita / Buganvilla',
    family: 'Nyctaginaceae',
    status: 'stable',
    location: 'Pérgola Este - Jardín de Entrada',
    plantedDate: '2023-10-05',
    irrigationPriority: 22.0,
    phytosanitaryRisk: 15.0,
    soilMoisture: 42.0,
    temperature: 26.5,
    humidity: 52.0,
    lastWatered: 'Hace 2 días',
    imageUrl: 'https://images.unsplash.com/photo-1562252185-16feebe22b25?auto=format&fit=crop&w=800&q=80',
    notes: 'Espectacular floración fucsia en la pérgola del jardín. Follaje vigoroso y floración continua primavero-estival.',
    activeAlert: null,
    history: [
      { id: 'h7', date: '2026-09-11', type: 'riego', description: 'Riego perimetral moderado', operator: 'Sector Pérgola' },
      { id: 'h8', date: '2026-08-20', type: 'poda', description: 'Poda de guía y despeje de ramas secas', operator: 'Téc. F. Ramos' }
    ]
  }
];

export const CATALOG_SPECIES: CatalogSpecies[] = [
  {
    id: 'cat-1',
    commonName: 'Jacarandá',
    scientificName: 'Jacaranda mimosifolia',
    family: 'Bignoniaceae',
    origin: 'Nativo de las Yungas y Chaco (Argentina, Bolivia, Brasil)',
    description: 'Árbol caducifolio de copa amplia y deslumbrante floración violeta en racimos piramidales. Hojas bipinnadas semejantes a helechos.',
    wateringNeed: 'Medio',
    sunlight: 'Pleno sol',
    growthRate: 'Rápido',
    floweringSeason: 'Primavera tardía (Nov-Dic) y rebrote estival',
    optimalSoil: 'Bien drenado, fértil, ligeramente arenoso o limoso',
    maxHeight: '12 a 15 metros',
    imageUrl: 'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?auto=format&fit=crop&w=800&q=80',
    pestVulnerability: 'Cochinillas blandas en brotes tiernos, oídio con alta humedad estancada.',
    phytosanitaryNotes: 'Tolera sequías temporales en ejemplares maduros. El déficit hídrico excesivo retrasa la apertura de yemas florales.'
  },
  {
    id: 'cat-2',
    commonName: 'Palo Borracho / Samohú',
    scientificName: 'Ceiba speciosa',
    family: 'Malvaceae',
    origin: 'Región Neotropical del centro-este sudamericano',
    description: 'Árbol de porte monumental con tronco ventrudo color verde clorofílico y aguijones cónicos. Flores rosadas grandes con centro blanco amarillento.',
    wateringNeed: 'Bajo',
    sunlight: 'Pleno sol',
    growthRate: 'Rápido',
    floweringSeason: 'Verano tardío hasta otoño',
    optimalSoil: 'Profundo, arenoso o pedregoso, resistente a suelos calcáreos',
    maxHeight: '15 a 20 metros',
    imageUrl: 'https://images.unsplash.com/photo-1556886955-13c51410cd17?auto=format&fit=crop&w=800&q=80',
    pestVulnerability: 'Hongos basidiomicetos si hay anegamiento radicular prolongado, taladro de la madera.',
    phytosanitaryNotes: 'El tronco almacena agua. La alta humedad atmosférica combinada con temperaturas medias favorece la antracnosis foliar.'
  },
  {
    id: 'cat-3',
    commonName: 'Lapacho Rosado',
    scientificName: 'Handroanthus impetiginosus',
    commonNameAlt: 'Tajibo Rosado',
    family: 'Bignoniaceae',
    origin: 'Bosques secos y húmedos subtropicales sudamericanos',
    description: 'Emblemático árbol forestal y ornamental. Pierde completamente sus hojas antes de desplegar una exuberante masa floral rosa violácea.',
    wateringNeed: 'Medio',
    sunlight: 'Pleno sol',
    growthRate: 'Moderado',
    floweringSeason: 'Invierno tardío a inicios de primavera (Julio - Septiembre)',
    optimalSoil: 'Fértil, drenaje expedito, permeable',
    maxHeight: '15 a 25 metros',
    imageUrl: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=800&q=80',
    pestVulnerability: 'Orugas defoliadoras en primavera temprana, royas foliares estacionales.',
    phytosanitaryNotes: 'El estrés hídrico controlado a finales de invierno puede inducir floración uniforme, pero el déficit severo debilita la brotación.'
  },
  {
    id: 'cat-4',
    commonName: 'Tipa / Tipa Blanca',
    scientificName: 'Tipuana tipu',
    family: 'Fabaceae',
    origin: 'Selva de montaña de Tucumán-Bolivia (Yungas)',
    description: 'Árbol corpulento de copa frondosa aparasolada. Flores amarillo-anaranjadas brillantes y frutos en sámaras aladas.',
    wateringNeed: 'Medio',
    sunlight: 'Pleno sol',
    growthRate: 'Rápido',
    floweringSeason: 'Diciembre a Enero',
    optimalSoil: 'Tolerante a suelos pobres y arcillosos urbanos',
    maxHeight: '18 a 22 metros',
    imageUrl: 'https://images.unsplash.com/photo-1528834342297-fdefb9a5a92b?auto=format&fit=crop&w=800&q=80',
    pestVulnerability: 'Chicharrita de la espuma (Cephisus siccifolius), pulgones.',
    phytosanitaryNotes: 'Genera raíces superficiales potentes. Fija nitrógeno al sustrato mejorando suelos degradados.'
  },
  {
    id: 'cat-5',
    commonName: 'Ceibo / Flor Nacional',
    scientificName: 'Erythrina crista-galli',
    family: 'Fabaceae',
    origin: 'Humedales y riberas del Río de la Plata y Paraná',
    description: 'Árbol de porte mediano o arbustivo, corteza rugosa y vistosas flores carmesí aterciopeladas en racimos péndulos.',
    wateringNeed: 'Alto',
    sunlight: 'Pleno sol a media sombra',
    growthRate: 'Moderado',
    floweringSeason: 'Octubre a Marzo',
    optimalSoil: 'Húmedo, inundable, anegable o cercano a cuerpos de agua',
    maxHeight: '6 a 10 metros',
    imageUrl: 'https://images.unsplash.com/photo-1473712453425-001a84125611?auto=format&fit=crop&w=800&q=80',
    pestVulnerability: 'Taladrillo de las ramas, fumagina tras ataques de pulgón.',
    phytosanitaryNotes: 'Demanda aportes constantes de agua edáfica. Muy sensible a sequías en épocas cálidas.'
  },
  {
    id: 'cat-6',
    commonName: 'Timbó / Oreja de Negro',
    scientificName: 'Enterolobium contortisiliquum',
    family: 'Fabaceae',
    origin: 'Regiones cálidas del norte argentino, Paraguay y Brasil',
    description: 'Copa inmensa en forma de sombrilla majestuosa, follaje plumoso y frutos en forma de oreja curvada de color café oscuro brillante.',
    wateringNeed: 'Medio',
    sunlight: 'Pleno sol',
    growthRate: 'Rápido',
    floweringSeason: 'Primavera',
    optimalSoil: 'Húmedo, suelto, rico en materia orgánica',
    maxHeight: '20 a 25 metros',
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
    pestVulnerability: 'Barrenadores del leño en ejemplares añejos, orugas de lepidópteros.',
    phytosanitaryNotes: 'Excelente fijador de suelo y sombra densa. Sensible a heladas tardías cuando es joven.'
  },
  {
    id: 'cat-7',
    commonName: 'Santa Rita / Buganvilla',
    scientificName: 'Bougainvillea spectabilis',
    family: 'Nyctaginaceae',
    origin: 'Bosques tropicales y subtropicales de América del Sur',
    description: 'Arbusto trepador leñoso de floración fucsia y magenta deslumbrante. Ideal para pérgolas, glorietas y cercos en jardines muy soleados.',
    wateringNeed: 'Bajo',
    sunlight: 'Pleno sol',
    growthRate: 'Rápido',
    floweringSeason: 'Primavera, verano y extendido en otoño',
    optimalSoil: 'Muy bien drenado, suelto, soporta sustratos pobres y pedregosos',
    maxHeight: '8 a 12 metros trepando',
    imageUrl: 'https://images.unsplash.com/photo-1562252185-16feebe22b25?auto=format&fit=crop&w=800&q=80',
    pestVulnerability: 'Orugas defoliadoras nocturnas, pulgones en brotes tiernos.',
    phytosanitaryNotes: 'El exceso de riego edáfico fomenta follaje verde pero inhibe la floración; responde favorablemente a riegos espaciados.'
  },
  {
    id: 'cat-8',
    commonName: 'Jazmín del Paraguay',
    scientificName: 'Brunfelsia australis',
    family: 'Solanaceae',
    origin: 'Bosques y selvas de galería del Cono Sur (Argentina, Paraguay, Brasil)',
    description: 'Arbusto ornamental de exquisita fragancia cuyas corolas mudan de color del violeta azulado al celeste lila y finalmente blanco puro.',
    wateringNeed: 'Medio',
    sunlight: 'Media sombra',
    growthRate: 'Moderado',
    floweringSeason: 'Inicios de primavera (Septiembre - Noviembre)',
    optimalSoil: 'Rico en humus, ácido a neutro, fresco y húmedo',
    maxHeight: '2 a 4 metros',
    imageUrl: 'https://images.unsplash.com/photo-1504358031587-0c7faf5b8364?auto=format&fit=crop&w=800&q=80',
    pestVulnerability: 'Clorosis férrica en suelos calcáreos, arañuela roja con calor seco.',
    phytosanitaryNotes: 'Requiere protección contra vientos secos y heladas severas. Mantener humedad constante sin anegamiento.'
  },
  {
    id: 'cat-9',
    commonName: 'Rosa de China / Hibisco',
    scientificName: 'Hibiscus rosa-sinensis',
    family: 'Malvaceae',
    origin: 'Regiones cálidas subtropicales',
    description: 'Arbusto perenne con grandes flores rojas acampanadas y columna estaminal sobresaliente. Muy apreciado en paisajismo y canteros florales.',
    wateringNeed: 'Medio',
    sunlight: 'Pleno sol',
    growthRate: 'Rápido',
    floweringSeason: 'Primavera hasta finales de verano',
    optimalSoil: 'Fértil, permeable y rico en materia orgánica',
    maxHeight: '2 a 5 metros',
    imageUrl: 'https://images.unsplash.com/photo-1453396450673-3fe83d2db2c4?auto=format&fit=crop&w=800&q=80',
    pestVulnerability: 'Pulgones, mosca blanca y cochinilla algodonosa.',
    phytosanitaryNotes: 'Sensible al frío por debajo de 5°C. El estrés hídrico provoca el aborto prematuro de botones florales.'
  },
  {
    id: 'cat-10',
    commonName: 'Azalea de Jardín',
    scientificName: 'Rhododendron simsii',
    family: 'Ericaceae',
    origin: 'Sotobosques húmedos templados y subtropicales',
    description: 'Arbusto de follaje denso cubierto por una profusa masa de flores rosas y púrpuras en primavera. Acentúa senderos y canteros sombreados.',
    wateringNeed: 'Alto',
    sunlight: 'Media sombra',
    growthRate: 'Moderado',
    floweringSeason: 'Finales de invierno a mediados de primavera',
    optimalSoil: 'Sustrato ácido (pH 4.5-5.5), turba y excelente drenaje',
    maxHeight: '1 a 2 metros',
    imageUrl: 'https://images.unsplash.com/photo-1571992049393-827d13da8fe3?auto=format&fit=crop&w=800&q=80',
    pestVulnerability: 'Tigre del rododendro (Stephanitis pyrioides), oídio, podredumbre radicular si se anega.',
    phytosanitaryNotes: 'No tolera aguas duras o con cloro residual alto. Se beneficia de acolchado orgánico de corteza de pino.'
  }
];

export const SED_RULES: SedRule[] = [
  // Bloque A: Prioridad de Riego (Reglas 1 a 10)
  {
    id: 'rule-1',
    code: 'REG-01',
    name: 'Déficit Hídrico con Temperatura Extrema',
    category: 'Riego',
    antecedent: 'SI (HVS es Déficit) Y (TA es Extrema)',
    consequent: 'ENTONCES Prioridad_Riego es Crítica',
    weight: 1.0,
    explanation: 'Déficit hídrico combinado con temperatura extrema incrementa fuertemente la demanda de agua y el estrés de la planta.',
    recommendedAction: 'Aplicar riego urgente e inmediato por goteo profundo y prever cobertura/malla sombra.'
  },
  {
    id: 'rule-2',
    code: 'REG-02',
    name: 'Déficit Hídrico con Temperatura Cálida',
    category: 'Riego',
    antecedent: 'SI (HVS es Déficit) Y (TA es Cálida)',
    consequent: 'ENTONCES Prioridad_Riego es Alta',
    weight: 0.9,
    explanation: 'La mayor demanda evaporativa puede acelerar la pérdida de agua cuando existe poca disponibilidad en el sustrato.',
    recommendedAction: 'Programar riego de recuperación en las próximas 6 a 12 horas en horario vespertino.'
  },
  {
    id: 'rule-3',
    code: 'REG-03',
    name: 'Déficit Hídrico con Temperatura Templada',
    category: 'Riego',
    antecedent: 'SI (HVS es Déficit) Y (TA es Templada)',
    consequent: 'ENTONCES Prioridad_Riego es Moderada',
    weight: 0.8,
    explanation: 'El déficit hídrico requiere reposición, aunque la demanda ambiental es menor que en condiciones cálidas o extremas.',
    recommendedAction: 'Programar riego regular de reposición dentro de las 24 horas.'
  },
  {
    id: 'rule-4',
    code: 'REG-04',
    name: 'Déficit Hídrico con Temperatura Fría',
    category: 'Riego',
    antecedent: 'SI (HVS es Déficit) Y (TA es Fría)',
    consequent: 'ENTONCES Prioridad_Riego es Baja',
    weight: 0.7,
    explanation: 'La demanda hídrica suele ser menor en condiciones frías, por lo que la prioridad relativa de riego disminuye.',
    recommendedAction: 'Monitorear humedad edáfica sin forzar riegos que reduzcan temperatura radicular.'
  },
  {
    id: 'rule-5',
    code: 'REG-05',
    name: 'Déficit con Baja Humedad Relativa y Temp. Cálida',
    category: 'Riego',
    antecedent: 'SI (HVS es Déficit) Y (HR es Baja) Y (TA es Cálida)',
    consequent: 'ENTONCES Prioridad_Riego es Crítica',
    weight: 1.0,
    explanation: 'La combinación de baja humedad relativa, temperatura cálida y déficit de sustrato dispara el déficit de presión de vapor (VPD).',
    recommendedAction: 'Ejecutar riego radicular profundo inmediato y humidificación microclimática.'
  },
  {
    id: 'rule-6',
    code: 'REG-06',
    name: 'Capacidad de Campo con Temperatura Extrema',
    category: 'Riego',
    antecedent: 'SI (HVS es Capacidad_Campo) Y (TA es Extrema)',
    consequent: 'ENTONCES Prioridad_Riego es Moderada',
    weight: 0.75,
    explanation: 'Aunque existe agua disponible, una temperatura extrema acelera rápidamente el consumo hídrico transpiratorio.',
    recommendedAction: 'Supervisar reserva hídrica con mayor frecuencia durante las horas de pico térmico.'
  },
  {
    id: 'rule-7',
    code: 'REG-07',
    name: 'Capacidad de Campo con Temperatura Cálida',
    category: 'Riego',
    antecedent: 'SI (HVS es Capacidad_Campo) Y (TA es Cálida)',
    consequent: 'ENTONCES Prioridad_Riego es Baja',
    weight: 0.6,
    explanation: 'El sustrato mantiene disponibilidad adecuada de agua; la temperatura cálida requiere monitorización continua.',
    recommendedAction: 'Mantener pauta estándar de monitoreo sin irrigación inmediata.'
  },
  {
    id: 'rule-8',
    code: 'REG-08',
    name: 'Capacidad de Campo con Temperatura Templada',
    category: 'Riego',
    antecedent: 'SI (HVS es Capacidad_Campo) Y (TA es Templada)',
    consequent: 'ENTONCES Prioridad_Riego es Nula',
    weight: 0.5,
    explanation: 'Condición ambiental de equilibrio óptimo con disponibilidad hídrica adecuada y baja tasa de estrés.',
    recommendedAction: 'Estado hídrico óptimo. No requiere intervención de riego.'
  },
  {
    id: 'rule-9',
    code: 'REG-09',
    name: 'Saturación de Sustrato',
    category: 'Riego',
    antecedent: 'SI (HVS es Saturación)',
    consequent: 'ENTONCES Prioridad_Riego es Nula',
    weight: 1.0,
    explanation: 'Presencia de agua en exceso. No se requiere riego adicional y existe riesgo de hipoxia radicular.',
    recommendedAction: 'Suspender totalmente todo riego y facilitar el drenaje superficial.'
  },
  {
    id: 'rule-10',
    code: 'REG-10',
    name: 'Capacidad de Campo con HR Alta y Temperatura Cálida',
    category: 'Riego',
    antecedent: 'SI (HVS es Capacidad_Campo) Y (HR es Alta) Y (TA es Cálida)',
    consequent: 'ENTONCES Prioridad_Riego es Nula',
    weight: 0.7,
    explanation: 'La disponibilidad de agua y la elevada humedad ambiental reducen drásticamente la tasa de transpiración.',
    recommendedAction: 'No regar. La planta mantiene turgencia plena con mínima transpiración.'
  },

  // Bloque B: Riesgo Fitosanitario (Reglas 11 a 20)
  {
    id: 'rule-11',
    code: 'REG-11',
    name: 'Saturación Hídrica con Calor y Alta Humedad Relativa',
    category: 'Fitosanitario',
    antecedent: 'SI (HVS es Saturación) Y (TA es Cálida) Y (HR es Alta)',
    consequent: 'ENTONCES Riesgo_Fitosanitario es Crítico',
    weight: 1.0,
    explanation: 'Exceso de agua edáfica más calor y humedad atmosférica generan caldo de cultivo perfecto para Phytophthora y patógenos radiculares.',
    recommendedAction: 'Suspender riegos, ventilar cantero, aplicar fungicida sistémico/cobre preventivo.'
  },
  {
    id: 'rule-12',
    code: 'REG-12',
    name: 'Saturación Hídrica con Clima Templado y HR Alta',
    category: 'Fitosanitario',
    antecedent: 'SI (HVS es Saturación) Y (TA es Templada) Y (HR es Alta)',
    consequent: 'ENTONCES Riesgo_Fitosanitario es Alto',
    weight: 0.85,
    explanation: 'Humedad persistente en suelo y follaje favorece la esporulación de conidios fúngicos foliares.',
    recommendedAction: 'Inspección minuciosa del haz y envés foliar; suspender aspersión aérea.'
  },
  {
    id: 'rule-13',
    code: 'REG-13',
    name: 'Saturación Hídrica con Temperatura Fría',
    category: 'Fitosanitario',
    antecedent: 'SI (HVS es Saturación) Y (TA es Fría)',
    consequent: 'ENTONCES Riesgo_Fitosanitario es Alto',
    weight: 0.85,
    explanation: 'Exceso de agua con baja temperatura reduce la oxigenación y respiración celular de la rizosfera (asfixia radicular).',
    recommendedAction: 'Escarificar sustrato para favorecer aireación y proteger contra encharcamiento prolongado.'
  },
  {
    id: 'rule-14',
    code: 'REG-14',
    name: 'Alta Humedad Relativa con Temperatura Templada',
    category: 'Fitosanitario',
    antecedent: 'SI (HR es Alta) Y (TA es Templada)',
    consequent: 'ENTONCES Riesgo_Fitosanitario es Medio',
    weight: 0.75,
    explanation: 'Microclima propicio para mildiu, oídio y manchas foliares si existe condensación persistente.',
    recommendedAction: 'Monitorear follaje para detectar manchas tempranas de patógenos fúngicos.'
  },
  {
    id: 'rule-15',
    code: 'REG-15',
    name: 'Capacidad de Campo con Clima Seco y Templado',
    category: 'Fitosanitario',
    antecedent: 'SI (HVS es Capacidad_Campo) Y (HR es Baja) Y (TA es Templada)',
    consequent: 'ENTONCES Riesgo_Fitosanitario es Bajo',
    weight: 0.6,
    explanation: 'Condiciones sanitarias estables sin factores desencadenantes de proliferación patógena.',
    recommendedAction: 'Continuar con inspecciones de rutina sin acciones fitosanitarias de urgencia.'
  },
  {
    id: 'rule-16',
    code: 'REG-16',
    name: 'Estrés Térmico e Hídrico con Clima Seco',
    category: 'Fitosanitario',
    antecedent: 'SI (HVS es Déficit) Y (TA es Extrema) Y (HR es Baja)',
    consequent: 'ENTONCES Riesgo_Fitosanitario es Alto',
    weight: 0.85,
    explanation: 'El estrés termo-hídrico severo debilita la inmunidad de la planta y favorece la proliferación de plagas oportunistas como la arañuela roja (Tetranychus urticae).',
    recommendedAction: 'Hidratar de inmediato y monitorear presencia de ácaros o arañuela en envés foliar.'
  },
  {
    id: 'rule-17',
    code: 'REG-17',
    name: 'Capacidad de Campo con Temperatura Extrema y HR Alta',
    category: 'Fitosanitario',
    antecedent: 'SI (HVS es Capacidad_Campo) Y (TA es Extrema) Y (HR es Alta)',
    consequent: 'ENTONCES Riesgo_Fitosanitario es Medio',
    weight: 0.7,
    explanation: 'Ambiente sofocante; la temperatura extrema estresa tejidos y la humedad ambiental puede activar hongos termófilos.',
    recommendedAction: 'Aumentar ventilación perimetral y observar yemas florales.'
  },
  {
    id: 'rule-18',
    code: 'REG-18',
    name: 'Déficit Hídrico con Clima Frío',
    category: 'Fitosanitario',
    antecedent: 'SI (HVS es Déficit) Y (TA es Fría)',
    consequent: 'ENTONCES Riesgo_Fitosanitario es Bajo',
    weight: 0.5,
    explanation: 'Bajo riesgo de patógenos por temperatura reducida, aunque la planta ralentiza su tasa metabólica.',
    recommendedAction: 'Mantener seguimiento sin aplicaciones químicas preventivas.'
  },
  {
    id: 'rule-19',
    code: 'REG-19',
    name: 'Saturación Hídrica con HR Media y Clima Templado',
    category: 'Fitosanitario',
    antecedent: 'SI (HVS es Saturación) Y (HR es Media) Y (TA es Templada)',
    consequent: 'ENTONCES Riesgo_Fitosanitario es Medio',
    weight: 0.7,
    explanation: 'Sustrato anegado afecta el intercambio gaseoso radicular a mediano plazo.',
    recommendedAction: 'Verificar drenaje del cantero o macetón; espaciar riegos.'
  },
  {
    id: 'rule-20',
    code: 'REG-20',
    name: 'Capacidad de Campo con HR Media y Clima Cálido',
    category: 'Fitosanitario',
    antecedent: 'SI (HVS es Capacidad_Campo) Y (HR es Media) Y (TA es Cálida)',
    consequent: 'ENTONCES Riesgo_Fitosanitario es Bajo',
    weight: 0.5,
    explanation: 'Balance fisiológico favorable con disponibilidad hídrica adecuada y riesgo patógeno contenido.',
    recommendedAction: 'Condición ideal de crecimiento. Continuar con monitoreo telemétrico normal.'
  }
];

export const RAG_DOCUMENTS: RagDocument[] = [
  {
    id: 'rag-1',
    title: 'Manual de Manejo Silvícola Urbano: Jacaranda mimosifolia',
    section: 'Requerimientos Hídricos y Estrés Térmico en Zonas Urbanas',
    source: 'Boletín Botánico Neotropical',
    year: 2024,
    content: 'El Jacarandá mimosifolia requiere en sus primeros 3 a 5 años aportes de agua sostenidos durante la primavera previa a la brotación floral. Si el contenido hídrico volumétrico cae bajo el 20%, la caída prematura de botones florales es inminente. El riego por goteo lento en corona (a 1.2m del tronco) optimiza la absorción capilar sin mojar la base del fuste.',
    tags: ['Jacaranda', 'Riego', 'Bignoniaceae', 'Estrés hídrico']
  },
  {
    id: 'rag-2',
    title: 'Patologías Fúngicas y Factores Microclimáticos en Bombacáceas / Malváceas',
    section: 'Prevención de Antracnosis y Podredumbres en Ceiba speciosa',
    source: 'Revista Latinoamericana de Fitopatología Forestal',
    year: 2023,
    content: 'Ceiba speciosa (Palo Borracho) cuenta con tejido parenquimático cortical fotosintético muy sensible a la condensación líquida persistente. Cuando la humedad relativa supera el 80% con temperaturas de 22-26°C por más de 18 horas acumuladas, la proliferación de Colletotrichum sp. se eleva dramáticamente al 68-75%. Se recomienda aireación periférica y evitar mojar la corteza verde.',
    tags: ['Ceiba', 'Fitosanitario', 'Humedad relativa', 'Antracnosis']
  },
  {
    id: 'rag-3',
    title: 'Guía de Dinámica Fisiológica de Handroanthus impetiginosus',
    section: 'Balance Hídrico Previo a la Antesis en Lapacho Rosado',
    source: 'Centro de Investigaciones Ecológicas Subtropicales',
    year: 2024,
    content: 'El Lapacho Rosado (Handroanthus impetiginosus) presenta una curva de sensibilidad hídrica bifásica. Un período corto de sequedad induce la defoliación y apertura de yemas, pero si el suelo se reseca por debajo de 22% durante más de 96 horas continuas, el ejemplar sufre desecamiento apical de brotes nuevos. Se aconseja pulso de hidratación de 30-40L cuando la prioridad de riego supera el 65%.',
    tags: ['Lapacho', 'Riego', 'Floración', 'Fisiología']
  },
  {
    id: 'rag-4',
    title: 'Atlas de Flora Arbórea y Arbustiva Nativa del Cono Sur',
    section: 'Compatibilidad de Especies en Canteros Urbanos y Pérgolas',
    source: 'Sociedad Botánica Regional',
    year: 2022,
    content: 'La combinación de árboles de dosel medio y alto como Tipuana tipu y Jacaranda mimosifolia genera un microclima amortiguado contra ráfagas de viento seco. Para optimizar el monitoreo por sensores telemétricos (SED), se recomienda distanciar los nodos capacitivos entre 60cm y 120cm del cuello radicular a 25cm de profundidad.',
    tags: ['Catálogo', 'Sensores', 'Microclima', 'Tipa']
  }
];

/**
 * Determina qué reglas de producción del SED se activan dadas las entradas crisp (HVS, TA, HR)
 */
export function determinarReglasDisparadas(hvs: number, ta: number, hr: number): SedRule[] {
  const activadas: SedRule[] = [];

  // Riego
  if (hvs < 25 && ta >= 34) {
    const r = SED_RULES.find((x) => x.code === 'REG-01');
    if (r) activadas.push(r);
  } else if (hvs < 25 && ta >= 25) {
    const r = SED_RULES.find((x) => x.code === 'REG-02');
    if (r) activadas.push(r);
  } else if (hvs < 25 && ta >= 15) {
    const r = SED_RULES.find((x) => x.code === 'REG-03');
    if (r) activadas.push(r);
  } else if (hvs < 25) {
    const r = SED_RULES.find((x) => x.code === 'REG-04');
    if (r) activadas.push(r);
  }

  if (hvs < 30 && hr < 45 && ta >= 25) {
    const r = SED_RULES.find((x) => x.code === 'REG-05');
    if (r && !activadas.some((x) => x.code === 'REG-05')) activadas.push(r);
  }

  if (hvs >= 30 && hvs <= 70) {
    if (ta >= 35) {
      const r = SED_RULES.find((x) => x.code === 'REG-06');
      if (r) activadas.push(r);
    } else if (ta >= 25) {
      const r = SED_RULES.find((x) => x.code === 'REG-07');
      if (r) activadas.push(r);
    } else if (ta >= 15) {
      const r = SED_RULES.find((x) => x.code === 'REG-08');
      if (r) activadas.push(r);
    }
  }

  if (hvs > 75) {
    const r = SED_RULES.find((x) => x.code === 'REG-09');
    if (r) activadas.push(r);
  }

  // Fitosanitario
  if (hvs > 70 && ta >= 24 && hr > 75) {
    const r = SED_RULES.find((x) => x.code === 'REG-11');
    if (r) activadas.push(r);
  } else if (hvs > 70 && ta >= 15 && hr > 75) {
    const r = SED_RULES.find((x) => x.code === 'REG-12');
    if (r) activadas.push(r);
  } else if (hvs > 70 && ta < 15) {
    const r = SED_RULES.find((x) => x.code === 'REG-13');
    if (r) activadas.push(r);
  }

  if (hr > 80 && ta >= 15 && ta < 26) {
    const r = SED_RULES.find((x) => x.code === 'REG-14');
    if (r && !activadas.some((x) => x.code === 'REG-14')) activadas.push(r);
  }

  if (hvs < 30 && ta >= 32 && hr < 50) {
    const r = SED_RULES.find((x) => x.code === 'REG-16');
    if (r && !activadas.some((x) => x.code === 'REG-16')) activadas.push(r);
  }

  if (activadas.length === 0) {
    const r20 = SED_RULES.find((x) => x.code === 'REG-20');
    if (r20) activadas.push(r20);
  }

  return activadas;
}
