import { CatalogSpecies, RagDocument, Specimen } from '../types';
import { CATALOG_SPECIES, RAG_DOCUMENTS } from '../data/botanicalData';

const STORAGE_CUSTOM_SPECIES_KEY = 'botanico_custom_species_v1';
const STORAGE_CUSTOM_RAG_DOCS_KEY = 'botanico_custom_rag_docs_v1';

/**
 * Obtiene las especies personalizadas almacenadas en LocalStorage
 */
export function getCustomSpecies(): CatalogSpecies[] {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_SPECIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Error leyendo especies personalizadas de localStorage:', err);
    return [];
  }
}

/**
 * Obtiene todo el catálogo combinado (Especies base del TP2 + Especies personalizadas del usuario)
 */
export function getAllCatalogSpecies(): CatalogSpecies[] {
  const custom = getCustomSpecies();
  return [...CATALOG_SPECIES, ...custom];
}

/**
 * Guarda una nueva especie en el catálogo personalizado y genera su documento RAG
 */
export function saveCustomSpecies(
  newSpecies: CatalogSpecies,
  createRAGDoc: boolean = true
): { species: CatalogSpecies; ragDoc?: RagDocument } {
  const current = getCustomSpecies();
  
  // Evitar duplicados por ID
  const filtered = current.filter((s) => s.id !== newSpecies.id);
  filtered.push(newSpecies);
  
  try {
    localStorage.setItem(STORAGE_CUSTOM_SPECIES_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Error guardando especie personalizada en localStorage:', err);
  }

  let generatedDoc: RagDocument | undefined;
  if (createRAGDoc) {
    generatedDoc = generateRAGDocumentFromSpecies(newSpecies);
    saveCustomRAGDocument(generatedDoc);
  }

  return { species: newSpecies, ragDoc: generatedDoc };
}

/**
 * Elimina una especie personalizada y su documento RAG asociado
 */
export function deleteCustomSpecies(speciesId: string): void {
  try {
    const current = getCustomSpecies();
    const updated = current.filter((s) => s.id !== speciesId);
    localStorage.setItem(STORAGE_CUSTOM_SPECIES_KEY, JSON.stringify(updated));

    const currentDocs = getCustomRAGDocuments();
    const updatedDocs = currentDocs.filter((d) => d.id !== `rag-custom-${speciesId}`);
    localStorage.setItem(STORAGE_CUSTOM_RAG_DOCS_KEY, JSON.stringify(updatedDocs));
  } catch (err) {
    console.error('Error eliminando especie personalizada:', err);
  }
}

/**
 * Obtiene los documentos RAG personalizados creados por el usuario
 */
export function getCustomRAGDocuments(): RagDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_RAG_DOCS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Error leyendo documentos RAG de localStorage:', err);
    return [];
  }
}

/**
 * Guarda un documento RAG en el almacenamiento local
 */
export function saveCustomRAGDocument(doc: RagDocument): void {
  try {
    const current = getCustomRAGDocuments();
    const filtered = current.filter((d) => d.id !== doc.id);
    filtered.push(doc);
    localStorage.setItem(STORAGE_CUSTOM_RAG_DOCS_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Error guardando documento RAG en localStorage:', err);
  }
}

/**
 * Obtiene la base de conocimiento RAG completa (21 documentos base + los creados por el usuario)
 */
export function getAllRAGDocuments(): RagDocument[] {
  const custom = getCustomRAGDocuments();
  return [...RAG_DOCUMENTS, ...custom];
}

/**
 * Genera automáticamente un documento científico RAG estructurado a partir de los datos ingresados
 */
export function generateRAGDocumentFromSpecies(species: CatalogSpecies): RagDocument {
  const content = `El ejemplar ${species.commonName} (${species.scientificName}), perteneciente a la familia ${species.family}, posee una demanda hídrica clasificada como ${species.wateringNeed} y requiere exposición a ${species.sunlight}. Sustrato óptimo: ${species.optimalSoil}. Durante la etapa de floración y crecimiento (${species.floweringSeason}), el balance hídrico debe ser monitoreado rigurosamente. Principales amenazas sanitarias: ${species.pestVulnerability}. Directrices agronómicas y fitosanitarias de manejo: ${species.phytosanitaryNotes || 'Mantener monitoreo telemétrico continuo de humedad y temperatura para evitar estrés.'}`;

  return {
    id: `rag-custom-${species.id}`,
    title: `Manual de Manejo Fisiológico y Sanitario: ${species.scientificName}`,
    section: `Requerimientos Edafo-climáticos y Sanidad en ${species.commonName}`,
    source: 'Catálogo Botánico Personalizado (Ingreso de Usuario)',
    year: new Date().getFullYear(),
    content,
    tags: [
      species.commonName,
      species.scientificName,
      species.family,
      species.wateringNeed === 'Bajo' ? 'Sequía' : 'Riego',
      'Fitosanitario',
      'Personalizada'
    ]
  };
}

/**
 * Estructura la información en el formato exacto que ChromaDB y el backend esperan para una futura indexación
 */
export function formatChromaDBPayload(species: CatalogSpecies, doc: RagDocument) {
  return {
    documento_id: doc.id,
    texto_conocimiento: doc.content,
    metadatos: {
      especie: species.commonName,
      nombre_cientifico: species.scientificName,
      familia: species.family,
      categoria: 'Especie Personalizada',
      origen: species.origin,
      req_riego: species.wateringNeed,
      exposicion_solar: species.sunlight,
      fecha_indexacion: new Date().toISOString()
    },
    codigo_python_insercion: `# Código listo para agregar en rag_pipeline.py (ChromaDB):
coleccion.add(
    documents=["${doc.content.replace(/"/g, '\\"')}"],
    metadatas=[{
        "especie": "${species.commonName}",
        "categoria": "Especie Personalizada",
        "familia": "${species.family}"
    }],
    ids=["${doc.id}"]
)`
  };
}

/**
 * Presets botánicos rápidos con fotos e información lista para usar en 1 clic
 */
export const BOTANICAL_PRESETS: Partial<CatalogSpecies>[] = [
  {
    commonName: 'Monstera Deliciosa',
    scientificName: 'Monstera deliciosa',
    family: 'Araceae',
    origin: 'Selvas tropicales de México y Centroamérica',
    description: 'Planta trepadora ornamental con grandes hojas perforadas y fenestradas características. Aporta un porte exuberante a canteros protegidos y jardines de sombra.',
    wateringNeed: 'Medio',
    sunlight: 'Media sombra',
    growthRate: 'Rápido',
    floweringSeason: 'Verano (en exteriores cálidos)',
    optimalSoil: 'Rico en turba, perlita y corteza con excelente drenaje',
    maxHeight: '2 a 3 metros',
    imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=800&q=80',
    pestVulnerability: 'Cochinilla algodonosa en el envés foliar y ácaros en ambientes con baja humedad.',
    phytosanitaryNotes: 'Sensible al encharcamiento que causa manchas negras necróticas. Pulverizar follaje si la humedad ambiental baja del 40%.'
  },
  {
    commonName: 'Lavanda Francesa',
    scientificName: 'Lavandula dentata',
    family: 'Lamiaceae',
    origin: 'Región mediterránea occidental',
    description: 'Arbusto aromático perenne de hojas dentadas verde grisáceas y espigas florales violetas muy fragantes. Gran atractor de polinizadores.',
    wateringNeed: 'Bajo',
    sunlight: 'Pleno sol',
    growthRate: 'Moderado',
    floweringSeason: 'Primavera hasta finales de verano',
    optimalSoil: 'Poco fértil, calcáreo, arenoso y perfectamente drenado',
    maxHeight: '0.8 a 1 metro',
    imageUrl: 'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?auto=format&fit=crop&w=800&q=80',
    pestVulnerability: 'Pudrición radicular por asfixia si el sustrato retiene demasiada agua.',
    phytosanitaryNotes: 'Tolera sequías prolongadas. Suspender riegos en épocas frías o de alta humedad para prevenir hongos de raíz.'
  },
  {
    commonName: 'Ficus Lyrata / Hoja de Violín',
    scientificName: 'Ficus lyrata',
    family: 'Moraceae',
    origin: 'Bosques tropicales húmedos de África Occidental',
    description: 'Árbol perennifolio de grandes hojas coriáceas en forma de lira. Estructura escultural muy valorada en diseño de paisajes y galerías protegidas.',
    wateringNeed: 'Medio',
    sunlight: 'Pleno sol a media sombra',
    growthRate: 'Moderado',
    floweringSeason: 'Rara fuera de su hábitat silvestre',
    optimalSoil: 'Fértil, rico en materia orgánica, poroso y bien aireado',
    maxHeight: '3 a 5 metros',
    imageUrl: 'https://images.unsplash.com/photo-1597055181300-e3633a917c9c?auto=format&fit=crop&w=800&q=80',
    pestVulnerability: 'Arañuela roja, trips y caída de hojas por estrés termo-hídrico repentino.',
    phytosanitaryNotes: 'No tolera corrientes de aire seco ni encharcamiento. Limpiar polvo de las hojas para optimizar fotosíntesis.'
  },
  {
    commonName: 'Sansevieria / Lengua de Suegra',
    scientificName: 'Dracaena trifasciata',
    family: 'Asparagaceae',
    origin: 'África tropical occidental',
    description: 'Planta rizomatosa crasa de hojas rígidas erectas verde oscuro con franjas transversales y márgenes amarillos. Extremadamente rústica y purificadora.',
    wateringNeed: 'Bajo',
    sunlight: 'Pleno sol a media sombra',
    growthRate: 'Lento',
    floweringSeason: 'Primavera tardía con flores blanquecinas discretas',
    optimalSoil: 'Sustrato para cactus y suculentas con grava y arena gruesa',
    maxHeight: '0.8 a 1.2 metros',
    imageUrl: 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=800&q=80',
    pestVulnerability: 'Cochinilla algodonosa en la base de las hojas si hay hacinamiento.',
    phytosanitaryNotes: 'El exceso de agua es su mayor enemigo; los tallos se vuelven blandos y amarillos ante saturación radicular.'
  }
];
