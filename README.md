# Sistema Experto Botánico - Backend (SED + RAG)

Este repositorio contiene la capa de backend de una arquitectura neurosimbólica diseñada para el diagnóstico y gestión agronómica. El sistema integra un Sistema Experto Difuso (SED) para el procesamiento de telemetría y un motor de Generación Aumentada por Recuperación (RAG) basado en similitud del coseno para la inyección de contexto botánico.

## Arquitectura Tecnológica
*   **Framework API:** FastAPI / Uvicorn
*   **Persistencia Relacional:** SQLite (mediante ORM SQLAlchemy)
*   **Motor de Inferencia Difusa:** `scikit-fuzzy` (Controladores Mamdani)
*   **Base de Datos Vectorial:** ChromaDB (Integración local)
*   **Modelo Multilingüe (Embeddings):** `paraphrase-multilingual-MiniLM-L12-v2` (`sentence-transformers`)

---

## 🚀 Instrucciones de Configuración (Para Desarrollo Frontend)

La base de datos vectorial y el entorno virtual no están incluidos en este repositorio por control de versiones. Para desplegar la API en tu máquina local y comenzar a consumir los endpoints desde el frontend, ejecuta los siguientes pasos:

### 1. Clonar el repositorio y configurar el entorno
Abre tu terminal y ejecuta:

```bash
# 1. Clonar el proyecto
git clone [https://github.com/GuadaAmin/ayudante-botanico.git](https://github.com/GuadaAmin/ayudante-botanico.git)
cd ayudante-botanico

# 2. Crear el entorno virtual
python -m venv venv

# 3. Activar el entorno virtual
# En Windows:
venv\Scripts\activate
# En macOS/Linux:
source venv/bin/activate

# 4. Instalar las dependencias exactas
pip install -r requirements.txt

```

### 2. Inicializar la Base de Datos Vectorial

Antes de levantar el servidor, **es obligatorio** reconstruir el espacio vectorial de ChromaDB, ya que el directorio fue excluido en el `.gitignore`. Ejecuta el siguiente script; la primera vez demorará unos minutos porque descargará el modelo de lenguaje de Hugging Face (~450 MB):

```bash
python rag_pipeline.py

```

*Si la consola arroja un error `[WinError 10054]`, el script aplicará reintentos automáticos hasta reconstruir los tensores.*

### 3. Levantar el Servidor Local

Una vez regenerados los vectores, inicia el servidor ASGI de FastAPI:

```bash
uvicorn main:app --reload

```

---

## 📡 Documentación de la API (Endpoints)

Con el servidor en ejecución, puedes acceder a la interfaz interactiva de Swagger UI para probar las peticiones HTTP y revisar los esquemas Pydantic exactos que debe enviar el frontend:
👉 **[http://127.0.0.1:8000/docs](https://www.google.com/search?q=http://127.0.0.1:8000/docs)**

### Endpoints principales a consumir:

#### `POST /api/evaluar`

* **Uso:** Inyecta datos *crisp* de los sensores (telemetría) en el motor de inferencia.
* **Payload esperado (JSON):** `planta_id`, `humedad_sustrato`, `temperatura_ambiental`, `humedad_relativa`.
* **Respuesta:** Retorna el cálculo del centroide con los porcentajes exactos de `prioridad_riego` y `riesgo_fitosanitario`.

#### `POST /api/asesor`

* **Uso:** Envía consultas en lenguaje natural al orquestador RAG.
* **Payload esperado (JSON):** `planta_id`, `pregunta`.
* **Respuesta:** Retorna el *System Prompt* completo, concatenando las variables del SED (memoria transaccional) y los fragmentos de literatura botánica recuperados mediante similitud del coseno, listo para ser consumido por un LLM en el frontend.

---

## 🌿 Flujo de Trabajo y Ramas (Git)

Para evitar conflictos de código mientras se desarrolla la interfaz gráfica:

1. Crea una nueva rama para el desarrollo del cliente: `git checkout -b frontend-ui`
2. Construye los archivos del cliente (React, HTML/JS, etc.) en esa rama.
3. Realiza commits regulares.
4. Las fusiones (merges) a la rama `main` se realizarán únicamente cuando los componentes visuales logren consumir la API sin errores de CORS o esquemas.

```

```
