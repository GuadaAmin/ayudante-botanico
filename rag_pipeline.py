import chromadb
from chromadb.utils import embedding_functions
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from modelos import PlantasRegistradas

# 1. Configuración de ChromaDB con soporte multilingüe
funcion_embedding = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="paraphrase-multilingual-MiniLM-L12-v2")
chroma_client = chromadb.PersistentClient(path="./botanico_vectores")

# Purgar colección anterior si existe para evitar conflictos de dimensión vectorial
try:
    chroma_client.delete_collection(name="manuales_botanicos")
except Exception:
    pass

coleccion = chroma_client.get_or_create_collection(
    name="manuales_botanicos",
    embedding_function=funcion_embedding,
    metadata={"hnsw:space": "cosine"} # Corrección técnica: Similitud del coseno
)

# 2. Vectorización de la Base de Conocimiento (Mock de documentos botánicos)
documentos = [
    "El Jacarandá requiere suelos bien drenados. El exceso de agua provoca hipoxia y posterior pudrición radicular por Phytophthora.",
    "Para mitigar el estrés térmico severo, se recomienda aplicar riegos profundos al atardecer y proporcionar malla sombra.",
    "La arañuela roja (Tetranychus urticae) prolifera en ambientes de baja humedad y altas temperaturas. Aumentar la humedad relativa previene su expansión."
]
ids = ["doc_jacaranda_1", "doc_estres_1", "doc_plagas_1"]

coleccion.upsert(documents=documentos, ids=ids)

def consultar_asesor(planta_id: int, consulta_usuario: str):
    """Ejecuta el pipeline RAG combinando telemetría del SED y similitud semántica."""
    
    # 3. Recuperación de contexto relacional
    engine = create_engine("sqlite:///botanico.db", connect_args={"check_same_thread": False})
    Session = sessionmaker(bind=engine)
    session = Session()
    
    planta = session.query(PlantasRegistradas).filter_by(id=planta_id).first()
    if not planta:
        return "Error: Instancia de planta no localizada en la base de datos."
        
    estado_sed = f"Prioridad de riego actual: {planta.prioridad_riego_actual}%. Riesgo fitosanitario: {planta.indice_riesgo_fitosanitario}%."
    
    # 4. Recuperación semántica multilingüe
    resultados_rag = coleccion.query(
        query_texts=[consulta_usuario],
        n_results=2
    )
    # Concatenación de los fragmentos recuperados para inyección
    fragmento_recuperado = "\n- ".join(resultados_rag['documents'][0])
    fragmento_recuperado = "- " + fragmento_recuperado
    
    # 5. Inyección en el System Prompt
    system_prompt = f"""Eres un experto agronómico evaluando un ejemplar específico.
    
    Contexto Transaccional del Ejemplar (SED):
    {estado_sed}
    
    Literatura Botánica Recuperada (Base de Conocimiento):
    {fragmento_recuperado}
    
    Instrucción:
    Responde a la consulta del usuario fundamentando tu consejo estrictamente en la literatura botánica recuperada, pero adaptando la urgencia según el contexto transaccional del SED.
    """
    
    print("--- INYECCIÓN AL LLM (PAYLOAD) ---")
    print("SYSTEM PROMPT:")
    print(system_prompt)
    print(f"USER PROMPT: {consulta_usuario}")
    print("----------------------------------")
    return system_prompt

if __name__ == "__main__":
    consulta = "¿Qué consecuencias tiene regar en exceso esta especie?"
    consultar_asesor(planta_id=1, consulta_usuario=consulta)