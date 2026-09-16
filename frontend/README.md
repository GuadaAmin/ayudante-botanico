# Sistema Experto Botánico - Frontend (SED + RAG)

Este repositorio contiene la capa de interfaz de usuario de una arquitectura neurosimbólica diseñada para el diagnóstico y gestión agronómica de flora regional. La aplicación web interactúa con el Sistema Experto Difuso (SED) para evaluar magnitudes físicas continuas en tiempo real y consume el orquestador RAG para brindar asesoramiento botánico contextualizado a partir de literatura especializada indexada vectorialmente.

## Arquitectura Tecnológica
*   **Framework UI:** React 19 (con tipado estático en TypeScript)
*   **Herramienta de Construcción (Bundler):** Vite 6
*   **Estilos:** Tailwind CSS v4
*   **Iconografía:** Lucide React
*   **Comunicación API:** Cliente HTTP tipado con soporte para proxy inverso en desarrollo (`/api`)
*   **Consumo Backend:** FastAPI (`http://127.0.0.1:8000`)

---

## 🚀 Instrucciones de Configuración y Ejecución

Para levantar la interfaz gráfica en tu máquina local y comenzar a consumir los endpoints del backend, ejecuta los siguientes pasos:

### 1. Instalar dependencias
Abre tu terminal, sitúate en el directorio del proyecto e instala los paquetes necesarios:

```bash
cd sistema-experto-botanico
npm install
```

### 2. Verificar que el Backend esté en ejecución
Asegúrate de que el servidor de FastAPI (`ayudante-botanico`) esté corriendo en el puerto 8000 en otra terminal:

```bash
cd ../ayudante-botanico
source venv/bin/activate     # En Windows: venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

### 3. Levantar el Servidor de Desarrollo del Frontend
Una vez instalado, inicia el servidor de desarrollo local de Vite:

```bash
npm run dev
```

La aplicación quedará accesible de inmediato en tu navegador en:  
👉 **[http://localhost:3000](http://localhost:3000)**

*(La cabecera de la aplicación detectará automáticamente el backend y mostrará la píldora verde `🟢 Backend FastAPI (8000)`).*

---

## 🖥️ Módulos y Pantallas del Sistema

La interfaz está estructurada para cumplir estrictamente con los requerimientos funcionales del TP2:

### 1. Dashboard Global (Hub)
* **Semáforo General:** Vista analítica rápida con el conteo y distribución de ejemplares (Estables, En Atención, Críticos).
* **Panel de Acciones del SED:** Lista de tareas prioritarias generadas automáticamente (ej. riego requerido si Prioridad $> 65\%$, o alertas fitosanitarias si Riesgo $> 75\%$).
* **Acceso Directo:** Botón de incorporación rápida de ejemplares y acceso directo al Catálogo Regional.

### 2. Sección de Seguimiento ("Plantadas")
* Grilla de ejemplares registrados con metadatos rápidos y sus 3 entradas crisp (HVS, TA, HR) y 2 salidas difusas (PR, RF).
* Filtro instantáneo por severidad fisiológica (*Todos*, *Críticos*, *Atención*, *Estables*).
* Al hacer clic sobre cualquier ejemplar, se despliega el **Detalle de Instancia**.

### 3. Detalle de Instancia (Ficha de la Planta)
* **Controles de Estado (SED):** Sliders interactivos para calibrar la Humedad Volumétrica del Sustrato (HVS), Temperatura Ambiental (TA) y Humedad Relativa (HR) in situ, con botón **`⚡ Evaluar Estado con SED (/api/evaluar)`** que calcula el centroide en vivo mediante `scikit-fuzzy`.
* **Disparador de Acciones:** Botón **`💧 Aplicar Riego`** que resuelve tareas pendientes, eleva la humedad del sustrato y actualiza el semáforo.
* **Chat RAG Contextualizado:** Chatbot específico para la planta seleccionada que inyecta su ID y su telemetría actual en el System Prompt.
* **Bitácora de Intervenciones:** Trazabilidad histórica de riegos, podas y diagnósticos con registro de fecha y operador.

### 4. Asesor General (Chatbot RAG)
* Chatbot botánico global para consultas abiertas en lenguaje natural no vinculadas a un solo ejemplar.
* Recupera fragmentos de literatura botánica de ChromaDB por similitud de coseno.
* **Auditoría Neurosimbólica:** Modal desplegable para inspeccionar el *System Prompt* exacto (`payload_llm`) devuelto por el backend.
* **Base de Conocimiento:** Explorador y buscador de las **20 reglas formales de inferencia de Mamdani**.

### 5. Catálogo Regional
* Exploración de la base de conocimiento botánica con especies adaptadas al clima subtropical y templado (Jacarandá, Ceiba, Lapacho Rosado, Tipa, etc.).
* Funcionalidad para seleccionar una especie y darla de alta en el inventario activo.

---

## 📡 Documentación de Consumo de API

El frontend se conecta a los endpoints del servidor FastAPI a través del proxy de Vite configurado en `vite.config.ts`:

#### `POST /api/evaluar`
* **Uso:** Inyecta datos *crisp* de la telemetría en el motor difuso (`motor_difuso.py`).
* **Payload enviado (JSON):**
  ```json
  {
    "planta_id": 1,
    "humedad_sustrato": 25.0,
    "temperatura_ambiental": 35.0,
    "humedad_relativa": 40.0
  }
  ```
* **Respuesta procesada:** Muestra los porcentajes exactos del centroide (`prioridad_riego: 81.37%`, `riesgo_fitosanitario: 70.0%`) y actualiza el semáforo.

#### `POST /api/asesor`
* **Uso:** Envía consultas en lenguaje natural al pipeline RAG (`rag_pipeline.py`).
* **Payload enviado (JSON):**
  ```json
  {
    "planta_id": 1,
    "mensaje": "¿Qué consecuencias tiene regar en exceso esta especie?",
    "prioridad_riego": 81.37,
    "riesgo_fitosanitario": 70.0
  }
  ```
* **Respuesta procesada:** Renderiza en el chat la recomendación fundamentada en la literatura de ChromaDB y permite auditar el System Prompt inyectado.

---

## 🌿 Flujo de Trabajo y Ramas (Git)

Siguiendo el flujo de integración con el repositorio principal:

1. El desarrollo del cliente se integra en la rama `frontend-ui` del repositorio `ayudante-botanico`.
2. Las pruebas de integración se verifican ejecutando `npm run lint` y `npm run build`.
3. Una vez validada la conexión sin errores de CORS con el backend, la rama se fusiona a `main`.

```bash
# Comandos de verificación previa a commit:
npm run lint      # Chequeo estricto de tipos TypeScript
npm run build     # Verificación de bundling de producción con Vite
```
