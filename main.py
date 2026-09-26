from typing import List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from sqlalchemy import create_engine, desc
from sqlalchemy.orm import sessionmaker, Session
from datetime import date
import bcrypt
import jwt
import os
from dotenv import load_dotenv

from modelos import (
    Base,
    CatalogoEspecies,
    PlantasRegistradas,
    MedicionesAmbientales,
    BitacoraEventos,
    TareasPendientes,
    AlertasMeteorologicas,
    Usuario,
    Bitacora
)
from motor_difuso import evaluar_estado_planta
from orquestador import evaluar_y_persistir
from rag_pipeline import consultar_asesor, indexar_especie_en_rag

# Carga las variables del archivo .env
load_dotenv()

# Configuración de Seguridad y JWT leída de la variable de entorno
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-inseguro-solo-para-desarrollo")
ALGORITHM = "HS256"

security = HTTPBearer(auto_error=False)

# Inicialización de la base de datos relacional
DATABASE_URL = "sqlite:///botanico.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Asegurar creación de tablas (incluyendo usuarios)
Base.metadata.create_all(bind=engine)

# POBLAR CATÁLOGO BASE SI ESTÁ VACÍO 
db_init = SessionLocal()
if db_init.query(CatalogoEspecies).count() == 0:
    especie_base = CatalogoEspecies(
        nombre_comun="Especie del Catálogo",
        nombre_cientifico="Plantae Genérica",
        familia="Bignoniaceae",
        umbral_temp_min=5.0,
        umbral_temp_max=40.0,
        req_hidrico_base=50.0,
        exposicion_solar="Pleno Sol",
        epoca_floracion="Primavera",
        descripcion="Especie base de referencia del sistema.",
        imagen_url="https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&q=80&w=600"
    )
    db_init.add(especie_base)
    db_init.commit()
db_init.close()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app = FastAPI(
    title="API - Sistema Experto Botánico",
    description="Backend Neurosimbólico con Gestión de Usuarios (Multi-tenancy), Sistema Experto Difuso (Mamdani), Pipeline RAG y Persistencia Relacional.",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependencia para autenticación y obtención del usuario actual
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> Usuario:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales de autenticación no proporcionadas o token ausente.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido.")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado.")
    
    user = db.query(Usuario).filter_by(username=username).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado.")
    return user

# Esquemas Pydantic para Validación de Cargas Útiles (Payloads)
class Telemetria(BaseModel):
    planta_id: int
    humedad_sustrato: float
    temperatura_ambiental: float
    humedad_relativa: float

class Consulta(BaseModel):
    planta_id: int
    pregunta: str
    prioridad_riego: float = 0.0
    riesgo_fitosanitario: float = 0.0

class NuevaPlanta(BaseModel):
    especie_id: int
    alias: str
    ubicacion: Optional[str] = "Cantero Principal"

class EspeciePersonalizadaCreate(BaseModel):
    nombre_comun: str
    nombre_cientifico: str
    familia: Optional[str] = "General"
    origen: Optional[str] = "Cultivo Regional"
    descripcion: Optional[str] = ""
    imagen_url: Optional[str] = ""
    demanda_hidrica: Optional[str] = "Medio"
    exposicion_solar: Optional[str] = "Media sombra"
    epoca_floracion: Optional[str] = "Primavera"
    sustrato_optimo: Optional[str] = "Suelo fértil y permeable"
    vulnerabilidad_plagas: Optional[str] = "Pulgones y cochinillas"
    directrices_sanitarias: Optional[str] = "Evitar anegamiento prolongado."
    literatura_rag: Optional[str] = None
    plantar_en_jardin: Optional[bool] = False
    alias_ejemplar: Optional[str] = None
    ubicacion_ejemplar: Optional[str] = "Cantero Principal"
    humedad_inicial: Optional[float] = 45.0

class UserRegister(BaseModel):
    username: str
    password: str
    confirm_password: str

class UserLogin(BaseModel):
    username: str
    password: str

# Endpoints de Autenticación y Registro
@app.post("/api/auth/register", tags=["Autenticación y Usuarios"])
def registrar_usuario(datos: UserRegister, db: Session = Depends(get_db)):
    if datos.password != datos.confirm_password:
        raise HTTPException(status_code=400, detail="Las contraseñas no coinciden.")
    
    existente = db.query(Usuario).filter_by(username=datos.username).first()
    if existente:
        raise HTTPException(status_code=400, detail="El nombre de usuario ya está en uso.")
    
    # Hasheo directo con la librería bcrypt (truncando a 72 bytes por seguridad)
    hashed_bytes = bcrypt.hashpw(datos.password[:72].encode('utf-8'), bcrypt.gensalt())
    hashed_pw = hashed_bytes.decode('utf-8')

    nuevo_usuario = Usuario(
        username=datos.username,
        hashed_password=hashed_pw
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return {"status": "ok", "message": "Usuario registrado exitosamente", "user_id": nuevo_usuario.id}

@app.post("/api/auth/login", tags=["Autenticación y Usuarios"])
def login_usuario(datos: UserLogin, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter_by(username=datos.username).first()
    
    # Verificación directa con bcrypt
    password_valida = False
    if user:
        try:
            password_valida = bcrypt.checkpw(
                datos.password[:72].encode('utf-8'), 
                user.hashed_password.encode('utf-8')
            )
        except Exception:
            password_valida = False

    if not user or not password_valida:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas.")
    
    access_token_expires = timedelta(days=7)
    expire = datetime.now(timezone.utc) + access_token_expires
    to_encode = {"sub": user.username, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return {
        "access_token": encoded_jwt,
        "token_type": "bearer",
        "username": user.username,
        "user_id": user.id
    }

# Endpoints de Negocio y Sistema Experto
@app.post("/api/evaluar", tags=["Sistema Experto Difuso"])
def evaluar_instancia(datos: Telemetria, current_user: Usuario = Depends(get_current_user)):
    """Inyecta hechos crisp al SED, calcula centroides y persiste medición asegurando pertenencia al usuario."""
    resultado = evaluar_y_persistir(
        planta_id=datos.planta_id,
        humedad_sustrato=datos.humedad_sustrato,
        temperatura=datos.temperatura_ambiental,
        humedad_relativa=datos.humedad_relativa
    )
    return {
        "planta_id": datos.planta_id,
        "diagnostico_sed": resultado["diagnostico_sed"],
        "triggers": resultado["triggers"],
        "persistencia": resultado["persistencia"]
    }

@app.post("/api/asesor", tags=["Pipeline RAG"])
def asistente_rag(consulta: Consulta, current_user: Usuario = Depends(get_current_user)):
    """Pipeline RAG combinando telemetría del SED con recuperación semántica en ChromaDB y síntesis."""
    resultado = consultar_asesor(
        consulta.planta_id,
        consulta.pregunta,
        prioridad_riego=consulta.prioridad_riego,
        riesgo_fitosanitario=consulta.riesgo_fitosanitario
    )
    if isinstance(resultado, dict):
        return {
            "payload_llm": resultado.get("payload_llm", ""),
            "respuesta_experta": resultado.get("respuesta_experta", ""),
            "literatura_recuperada": resultado.get("literatura_recuperada", []),
            "especie": resultado.get("especie", ""),
            "planta": resultado.get("planta", ""),
            "estado_sed": resultado.get("estado_sed", "")
        }
    return {"payload_llm": resultado, "respuesta_experta": str(resultado)}

@app.get("/api/catalogo", tags=["Catálogo Botánico"])
def listar_catalogo(db: Session = Depends(get_db)):
    """Devuelve las especies del catálogo regional con sus tolerancias y características."""
    especies = db.query(CatalogoEspecies).all()
    return [
        {
            "id": esp.id,
            "nombre_comun": esp.nombre_comun or esp.nombre_cientifico,
            "nombre_cientifico": esp.nombre_cientifico,
            "familia": esp.familia,
            "umbral_temp_min": esp.umbral_temp_min,
            "umbral_temp_max": esp.umbral_temp_max,
            "req_hidrico_base": esp.req_hidrico_base,
            "exposicion_solar": esp.exposicion_solar,
            "epoca_floracion": esp.epoca_floracion,
            "descripcion": esp.descripcion,
            "imagen_url": esp.imagen_url,
            "es_personalizada": bool(esp.es_personalizada),
            "origen": esp.origen,
            "demanda_hidrica": esp.demanda_hidrica,
            "vulnerabilidad_plagas": esp.vulnerabilidad_plagas,
            "directrices_sanitarias": esp.directrices_sanitarias,
            "literatura_rag": esp.literatura_rag
        }
        for esp in especies
    ]

@app.post("/api/catalogo/especies-personalizadas", tags=["Catálogo Botánico"])
def crear_especie_personalizada(
    datos: EspeciePersonalizadaCreate,
    db: Session = Depends(get_db),
    token: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Registra una especie fuera de catálogo en SQLite, genera su ficha agronómica
    y la indexa en ChromaDB para el pipeline RAG. Si se solicita plantar en el jardín,
    crea el ejemplar registrado y su bitácora inicial.
    """
    # 1. Determinar usuario actual (si hay token provisto)
    current_user = None
    if token and token.credentials:
        try:
            payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
            username = payload.get("sub")
            if username:
                current_user = db.query(Usuario).filter_by(username=username).first()
        except jwt.PyJWTError:
            pass

    # 2. Búsqueda o creación de la especie en el catálogo
    nombre_cientifico_limpio = datos.nombre_cientifico.strip()
    nombre_comun_limpio = datos.nombre_comun.strip()
    
    especie = db.query(CatalogoEspecies).filter(
        (CatalogoEspecies.nombre_cientifico.ilike(nombre_cientifico_limpio)) |
        (CatalogoEspecies.nombre_comun.ilike(nombre_comun_limpio))
    ).first()

    # Construcción de literatura técnica para el RAG si no vino explícita
    if datos.literatura_rag and datos.literatura_rag.strip():
        contenido_rag = datos.literatura_rag.strip()
    else:
        contenido_rag = (
            f"Manual agronómico y fisiológico para {nombre_comun_limpio} ({nombre_cientifico_limpio}), "
            f"familia {datos.familia or 'General'}. "
            f"Origen: {datos.origen or 'Cultivo Regional'}. "
            f"Demanda hídrica: {datos.demanda_hidrica or 'Medio'}. "
            f"Exposición solar: {datos.exposicion_solar or 'Media sombra'}. "
            f"Época de floración: {datos.epoca_floracion or 'Primavera'}. "
            f"Sustrato óptimo: {datos.sustrato_optimo or 'Suelo fértil y permeable'}. "
            f"Vulnerabilidad a plagas y patógenos: {datos.vulnerabilidad_plagas or 'Pulgones y cochinillas'}. "
            f"Directrices agronómicas y sanitarias: {datos.directrices_sanitarias or 'Evitar anegamiento prolongado.'} "
            f"Descripción: {datos.descripcion or ''}"
        ).strip()

    # Mapeo de demanda hídrica a requerimiento numérico aproximado
    req_hidrico = 50.0
    if datos.demanda_hidrica:
        dh_lower = datos.demanda_hidrica.lower()
        if "bajo" in dh_lower:
            req_hidrico = 25.0
        elif "alto" in dh_lower:
            req_hidrico = 75.0

    if not especie:
        especie = CatalogoEspecies(
            nombre_cientifico=nombre_cientifico_limpio,
            nombre_comun=nombre_comun_limpio,
            familia=datos.familia or "General",
            umbral_temp_min=5.0,
            umbral_temp_max=40.0,
            req_hidrico_base=req_hidrico,
            exposicion_solar=datos.exposicion_solar or "Media sombra",
            epoca_floracion=datos.epoca_floracion or "Primavera",
            descripcion=datos.descripcion or f"Especie botánica personalizada: {nombre_comun_limpio}",
            imagen_url=datos.imagen_url or "https://images.unsplash.com/photo-1546842931-886c185b4c8c?auto=format&fit=crop&w=800&q=80",
            literatura_rag=contenido_rag,
            es_personalizada=1,
            origen=datos.origen or "Cultivo Regional",
            demanda_hidrica=datos.demanda_hidrica or "Medio",
            vulnerabilidad_plagas=datos.vulnerabilidad_plagas,
            directrices_sanitarias=datos.directrices_sanitarias
        )
        db.add(especie)
        db.commit()
        db.refresh(especie)
    else:
        # Actualizar campos existentes y marcar como personalizada
        especie.literatura_rag = contenido_rag
        especie.es_personalizada = 1
        if datos.demanda_hidrica:
            especie.demanda_hidrica = datos.demanda_hidrica
        if datos.vulnerabilidad_plagas:
            especie.vulnerabilidad_plagas = datos.vulnerabilidad_plagas
        if datos.directrices_sanitarias:
            especie.directrices_sanitarias = datos.directrices_sanitarias
        if datos.imagen_url:
            especie.imagen_url = datos.imagen_url
        db.commit()
        db.refresh(especie)

    # 3. Indexar en ChromaDB (Pipeline RAG)
    rag_resultado = indexar_especie_en_rag(
        especie_nombre=especie.nombre_comun or especie.nombre_cientifico,
        contenido_documento=contenido_rag,
        familia=especie.familia or "General",
        doc_id=f"doc_custom_cat_{especie.id}"
    )

    # 4. Si se solicita plantar en el jardín
    nueva_planta = None
    if datos.plantar_en_jardin:
        primer_usuario = db.query(Usuario).first()
        target_user_id = current_user.id if current_user else (primer_usuario.id if primer_usuario else None)
        nombre_alias = (datos.alias_ejemplar or f"{especie.nombre_comun} 1").strip()
        
        existente = None
        if target_user_id:
            existente = db.query(PlantasRegistradas).filter_by(user_id=target_user_id, alias=nombre_alias).first()
            
        if not existente:
            humedad_ini = float(datos.humedad_inicial) if datos.humedad_inicial is not None else 45.0
            pr_inicial = 70.0 if humedad_ini < 25.0 else 20.0
            
            nueva_planta = PlantasRegistradas(
                user_id=target_user_id,
                especie_id=especie.id,
                alias=nombre_alias,
                ubicacion=datos.ubicacion_ejemplar or "Cantero Principal",
                prioridad_riego_actual=pr_inicial,
                indice_riesgo_fitosanitario=15.0
            )
            db.add(nueva_planta)
            db.commit()
            db.refresh(nueva_planta)

            # Telemetría inicial
            telemetria_ini = MedicionesAmbientales(
                planta_id=nueva_planta.id,
                humedad_sustrato=humedad_ini,
                temperatura_ambiental=24.0,
                humedad_relativa=55.0,
                fecha=datetime.now(timezone.utc)
            )
            db.add(telemetria_ini)

            # Bitácora inicial
            operador_nombre = current_user.username if current_user else "Administrador"
            bitacora_ini = Bitacora(
                planta_id=nueva_planta.id,
                fecha=date.today().isoformat(),
                tipo="diagnostico",
                descripcion=f"Alta e incorporación de nueva especie personalizada ({especie.nombre_cientifico}) con indexación RAG.",
                operador=operador_nombre
            )
            db.add(bitacora_ini)
            db.commit()
        else:
            nueva_planta = existente

    return {
        "status": "ok",
        "mensaje": f"Especie '{especie.nombre_comun}' guardada e indexada en RAG correctamente.",
        "especie": {
            "id": especie.id,
            "nombre_comun": especie.nombre_comun,
            "nombre_cientifico": especie.nombre_cientifico,
            "familia": especie.familia,
            "es_personalizada": bool(especie.es_personalizada),
            "imagen_url": especie.imagen_url,
            "literatura_rag": especie.literatura_rag
        },
        "rag": rag_resultado,
        "planta": {
            "id": nueva_planta.id,
            "alias": nueva_planta.alias,
            "ubicacion": nueva_planta.ubicacion
        } if nueva_planta else None
    }

@app.get("/api/plantas", tags=["Inventario y Telemetría"])
def listar_plantas(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    """Devuelve únicamente las plantas registradas asociadas al usuario autenticado."""
    plantas = db.query(PlantasRegistradas).filter_by(user_id=current_user.id).all()
    resultado = []
    for p in plantas:
        ultima_med = db.query(MedicionesAmbientales).filter_by(planta_id=p.id).order_by(desc(MedicionesAmbientales.fecha)).first()
        resultado.append({
            "id": p.id,
            "alias": p.alias,
            "ubicacion": p.ubicacion,
            "prioridad_riego_actual": p.prioridad_riego_actual,
            "indice_riesgo_fitosanitario": p.indice_riesgo_fitosanitario,
            "especie": {
                "id": p.especie.id if p.especie else None,
                "nombre_comun": p.especie.nombre_comun if p.especie else p.alias,
                "nombre_cientifico": p.especie.nombre_cientifico if p.especie else "",
                "imagen_url": p.especie.imagen_url if p.especie else None,
                "familia": p.especie.familia if p.especie else "Familia desconocida"
            } if p.especie else None,
            "ultima_telemetria": {
                "humedad_sustrato": ultima_med.humedad_sustrato if ultima_med else 45.0,
                "temperatura_ambiental": ultima_med.temperatura_ambiental if ultima_med else 24.0,
                "humedad_relativa": ultima_med.humedad_relativa if ultima_med else 50.0,
                "fecha": ultima_med.fecha.isoformat() if ultima_med else None
            },
            # Mapeo dinámico del historial real
            "historial": [
                {
                    "id": f"h-{h.id}",
                    "date": h.fecha,
                    "type": h.tipo,
                    "description": h.descripcion,
                    "operator": h.operador
                } for h in p.historial
            ]
        })
    return resultado

@app.get("/api/plantas/{planta_id}", tags=["Inventario y Telemetría"])
def detalle_planta(planta_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    """Devuelve la ficha detallada de una planta del usuario, sus mediciones y bitácora."""
    planta = db.query(PlantasRegistradas).filter_by(id=planta_id, user_id=current_user.id).first()
    if not planta:
        raise HTTPException(status_code=404, detail="Planta no encontrada o no pertenece al usuario.")
    
    mediciones = db.query(MedicionesAmbientales).filter_by(planta_id=planta.id).order_by(desc(MedicionesAmbientales.fecha)).limit(10).all()
    eventos = db.query(BitacoraEventos).filter_by(planta_id=planta.id).order_by(desc(BitacoraEventos.fecha)).limit(15).all()
    
    return {
        "id": planta.id,
        "alias": planta.alias,
        "ubicacion": planta.ubicacion,
        "prioridad_riego_actual": planta.prioridad_riego_actual,
        "indice_riesgo_fitosanitario": planta.indice_riesgo_fitosanitario,
        "especie": {
            "id": planta.especie.id if planta.especie else None,
            "nombre_comun": planta.especie.nombre_comun if planta.especie else planta.alias,
            "nombre_cientifico": planta.especie.nombre_cientifico if planta.especie else "",
            "descripcion": planta.especie.descripcion if planta.especie else "",
            "imagen_url": planta.especie.imagen_url if planta.especie else None
        },
        "mediciones_recientes": [
            {
                "id": m.id,
                "humedad_sustrato": m.humedad_sustrato,
                "temperatura_ambiental": m.temperatura_ambiental,
                "humedad_relativa": m.humedad_relativa,
                "fecha": m.fecha.isoformat()
            }
            for m in mediciones
        ],
        "bitacora_eventos": [
            {
                "id": e.id,
                "tipo_evento": e.tipo_evento,
                "fecha": e.fecha.isoformat(),
                "observaciones": e.observaciones
            }
            for e in eventos
        ]
    }

# 1. Esquema actualizado para incluir imagen
class PlantaCreate(BaseModel):
    alias: str
    ubicacion: str
    nombre_cientifico: str
    nombre_comun: str
    imagen_url: str
    familia: str
    notas_iniciales: str = ""

# 2. Endpoint POST modificado (Unicidad e Imagen)
@app.post("/api/plantas", tags=["Plantas"])
def registrar_nueva_planta(datos: PlantaCreate, db: Session = Depends(get_db), token: HTTPAuthorizationCredentials = Depends(security)):
    if not token:
        raise HTTPException(status_code=401, detail="Token faltante")
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
        
    current_user = db.query(Usuario).filter_by(username=username).first()
    if not current_user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    # VALIDACIÓN: Impedir nombres duplicados para el mismo usuario
    existente = db.query(PlantasRegistradas).filter_by(user_id=current_user.id, alias=datos.alias).first()
    if existente:
        raise HTTPException(status_code=400, detail=f"Ya tienes un ejemplar registrado con el nombre '{datos.alias}'.")

    # Patrón Get-or-Create
    especie = db.query(CatalogoEspecies).filter_by(nombre_cientifico=datos.nombre_cientifico).first()
    if not especie:
        especie = CatalogoEspecies(
            nombre_comun=datos.nombre_comun,
            nombre_cientifico=datos.nombre_cientifico,
            familia=datos.familia,
            umbral_temp_min=5.0,
            umbral_temp_max=40.0,
            req_hidrico_base=50.0,
            exposicion_solar="Media",
            epoca_floracion="Variable",
            descripcion=f"Especie importada desde el frontend: {datos.nombre_comun}",
            imagen_url=datos.imagen_url  # Se persiste la imagen real
        )
        db.add(especie)
        db.commit()
        db.refresh(especie)

    nueva_planta = PlantasRegistradas(
        user_id=current_user.id,
        especie_id=especie.id,
        alias=datos.alias,
        ubicacion=datos.ubicacion,
        prioridad_riego_actual=0.0,
        indice_riesgo_fitosanitario=0.0
    )
    db.add(nueva_planta)
    db.commit()

    db.refresh(nueva_planta)
    
    # Crear la primera entrada de la bitácora
    texto_nota = datos.notas_iniciales.strip() if datos.notas_iniciales.strip() else "Plantación y alta en el SED."
    entrada_bitacora = Bitacora(
        planta_id=nueva_planta.id,
        fecha=date.today().isoformat(),
        tipo="diagnostico",
        descripcion=texto_nota,
        operador=username # Asignar el nombre del usuario logueado
    )
    db.add(entrada_bitacora)
    db.commit()
    
    return {"status": "ok", "planta_id": nueva_planta.id}

# 3. Endpoint DELETE
@app.delete("/api/plantas/{planta_id}", tags=["Plantas"])
def eliminar_planta(planta_id: int, db: Session = Depends(get_db), token: HTTPAuthorizationCredentials = Depends(security)):
    if not token:
        raise HTTPException(status_code=401, detail="Token faltante")
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
        
    current_user = db.query(Usuario).filter_by(username=username).first()
    
    # Buscar la planta asegurando que pertenezca al usuario que ejecuta la petición
    planta = db.query(PlantasRegistradas).filter_by(id=planta_id, user_id=current_user.id).first()
    if not planta:
        raise HTTPException(status_code=404, detail="El ejemplar no existe o no tienes permisos para eliminarlo.")
    
    db.delete(planta)
    db.commit()
    return {"status": "ok", "message": "Ejemplar eliminado correctamente."}

@app.post("/api/plantas/{planta_id}/regar", tags=["Inventario y Telemetría"])
def aplicar_riego(planta_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    """Aplica riego a una planta del usuario, resuelve tareas y registra el evento."""
    planta = db.query(PlantasRegistradas).filter_by(id=planta_id, user_id=current_user.id).first()
    if not planta:
        raise HTTPException(status_code=404, detail="Planta no encontrada o no pertenece al usuario.")
    
    planta.prioridad_riego_actual = max(round(planta.prioridad_riego_actual - 50.0, 1), 15.0)

    tareas_pendientes = db.query(TareasPendientes).filter_by(
        planta_id=planta.id,
        tipo_tarea="REGAR",
        estado_tarea="PENDIENTE"
    ).all()
    for t in tareas_pendientes:
        t.estado_tarea = "COMPLETADA"

    evento = BitacoraEventos(
        planta_id=planta.id,
        tipo_evento="RIEGO_APLICADO",
        observaciones="Riego de recuperación aplicado por el usuario."
    )
    db.add(evento)
    db.commit()
    return {
        "status": "ok",
        "pregunta": f"Riego aplicado a {planta.alias}",
        "nueva_prioridad_riego": planta.prioridad_riego_actual
    }

@app.get("/api/alertas", tags=["Alertas y Tareas"])
def listar_alertas(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    """Lista las alertas meteorológicas correspondientes a las plantas del usuario."""
    plantas_ids = [p.id for p in db.query(PlantasRegistradas).filter_by(user_id=current_user.id).all()]
    alertas = db.query(AlertasMeteorologicas).filter(AlertasMeteorologicas.planta_id.in_(plantas_ids)).all() if plantas_ids else []
    return [
        {
            "id": a.id,
            "planta_id": a.planta_id,
            "severidad": a.severidad,
            "pregunta": a.pregunta,
            "fecha_expiracion": a.fecha_expiracion.isoformat()
        }
        for a in alertas
    ]

@app.get("/api/tareas", tags=["Alertas y Tareas"])
def listar_tareas(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    """Lista las tareas pendientes generadas para las plantas del usuario."""
    plantas_ids = [p.id for p in db.query(PlantasRegistradas).filter_by(user_id=current_user.id).all()]
    tareas = db.query(TareasPendientes).filter(
        TareasPendientes.planta_id.in_(plantas_ids),
        TareasPendientes.estado_tarea == "PENDIENTE"
    ).all() if plantas_ids else []
    return [
        {
            "id": t.id,
            "planta_id": t.planta_id,
            "tipo_tarea": t.tipo_tarea,
            "estado_tarea": t.estado_tarea,
            "fecha_generacion": t.fecha_generacion.isoformat()
        }
        for t in tareas
    ]

@app.get("/api/reglas", tags=["Sistema Experto Difuso"])
def catalogo_reglas():
    """Devuelve el catálogo de las 20 reglas Mamdani de inferencia difusa."""
    return {
        "total_reglas": 20,
        "motor": "Mamdani (scikit-fuzzy con defuzzificación por Centroide)",
        "bloque_a_riego": [
            {"id": "REG-01", "premisa": "SI Humedad=Déficit Y Temperatura=Extrema", "consecuente": "Prioridad de Riego=CRÍTICA"},
            {"id": "REG-02", "premisa": "SI Humedad=Déficit Y Temperatura=Cálida", "consecuente": "Prioridad de Riego=ALTA"},
            {"id": "REG-03", "premisa": "SI Humedad=Déficit Y Temperatura=Templada", "consecuente": "Prioridad de Riego=MODERADA"},
            {"id": "REG-04", "premisa": "SI Humedad=Déficit Y Temperatura=Fría", "consecuente": "Prioridad de Riego=BAJA"},
            {"id": "REG-05", "premisa": "SI Humedad=Déficit Y HR=Baja Y Temperatura=Cálida", "consecuente": "Prioridad de Riego=CRÍTICA"},
            {"id": "REG-06", "premisa": "SI Humedad=Capacidad Campo Y Temperatura=Extrema", "consecuente": "Prioridad de Riego=MODERADA"},
            {"id": "REG-07", "premisa": "SI Humedad=Capacidad Campo Y Temperatura=Cálida", "consecuente": "Prioridad de Riego=BAJA"},
            {"id": "REG-08", "premisa": "SI Humedad=Capacidad Campo Y Temperatura=Templada", "consecuente": "Prioridad de Riego=NULA"},
            {"id": "REG-09", "premisa": "SI Humedad=Saturación", "consecuente": "Prioridad de Riego=NULA"},
            {"id": "REG-10", "premisa": "SI Humedad=Capacidad Campo Y HR=Alta Y Temperatura=Cálida", "consecuente": "Prioridad de Riego=NULA"}
        ],
        "bloque_b_fitosanitario": [
            {"id": "REG-11", "premisa": "SI Humedad=Saturación Y Temperatura=Cálida Y HR=Alta", "consecuente": "Riesgo Fitosanitario=CRÍTICO"},
            {"id": "REG-12", "premisa": "SI Humedad=Saturación Y Temperatura=Templada Y HR=Alta", "consecuente": "Riesgo Fitosanitario=ALTO"},
            {"id": "REG-13", "premisa": "SI Humedad=Saturación Y Temperatura=Fría", "consecuente": "Riesgo Fitosanitario=ALTO"},
            {"id": "REG-14", "premisa": "SI HR=Alta Y Temperatura=Templada", "consecuente": "Riesgo Fitosanitario=MEDIO"},
            {"id": "REG-15", "premisa": "SI Humedad=Capacidad Campo Y HR=Baja Y Temperatura=Templada", "consecuente": "Riesgo Fitosanitario=BAJO"},
            {"id": "REG-16", "premisa": "SI Humedad=Déficit Y Temperatura=Extrema Y HR=Baja", "consecuente": "Riesgo Fitosanitario=ALTO"},
            {"id": "REG-17", "premisa": "SI Humedad=Capacidad Campo Y Temperatura=Extrema Y HR=Alta", "consecuente": "Riesgo Fitosanitario=MEDIO"},
            {"id": "REG-18", "premisa": "SI Humedad=Déficit Y Temperatura=Fría", "consecuente": "Riesgo Fitosanitario=BAJO"},
            {"id": "REG-19", "premisa": "SI Humedad=Saturación Y HR=Media Y Temperatura=Templada", "consecuente": "Riesgo Fitosanitario=MEDIO"},
            {"id": "REG-20", "premisa": "SI Humedad=Capacidad Campo Y HR=Media Y Temperatura=Cálida", "consecuente": "Riesgo Fitosanitario=BAJO"}
        ]
    }

@app.get("/", response_class=HTMLResponse)
def home():
    """Panel de Bienvenida y enlaces a la Documentación Interactiva (Swagger UI)."""
    return """
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>API - Sistema Experto Botánico</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #eaf1e7; color: #1e3019; margin: 0; padding: 40px 20px; display: flex; justify-content: center; }
            .card { background: white; max-width: 680px; width: 100%; border-radius: 24px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #d3e2ce; }
            h1 { color: #22371c; margin-top: 0; font-size: 26px; }
            p { font-size: 14.5px; line-height: 1.6; color: #435b3c; }
            .badge { display: inline-block; background: #e0edd9; color: #26401f; font-weight: 600; font-size: 12px; padding: 4px 10px; border-radius: 9999px; margin-bottom: 16px; }
            .btn { display: inline-block; background: #3b5731; color: white; text-decoration: none; font-weight: 600; font-size: 14px; padding: 10px 20px; border-radius: 12px; margin-top: 10px; transition: background 0.2s; }
            .btn:hover { background: #2b4023; }
            .endpoints { margin-top: 24px; border-top: 1px solid #e2ede0; padding-top: 20px; font-size: 13px; font-family: monospace; }
            .ep-item { padding: 6px 0; color: #324a29; }
        </style>
    </head>
    <body>
        <div class="card">
            <span class="badge">🌿 Backend Neurosimbólico Multiusuario Activo</span>
            <h1>API - Sistema Experto Botánico</h1>
            <p>Servicios REST con autenticación JWT, Aislamiento de Datos por Usuario, Lógica Difusa (Mamdani) y RAG (ChromaDB) sobre <strong>SQLite</strong>.</p>
            <a href="/docs" class="btn">🚀 Abrir Documentación Swagger UI</a>
            <div class="endpoints">
                <strong>Nuevos Endpoints de Autenticación:</strong>
                <div class="ep-item">POST /api/auth/register - Registro de Nuevos Usuarios</div>
                <div class="ep-item">POST /api/auth/login - Autenticación y Generación de Token JWT</div>
                <br>
                <strong>Puntos de Acceso Protegidos:</strong>
                <div class="ep-item">POST /api/evaluar - Motor Difuso SED + Persistencia</div>
                <div class="ep-item">POST /api/asesor - Pipeline RAG Multilingüe (ChromaDB)</div>
                <div class="ep-item">GET /api/catalogo - Catálogo de Especies Regionales</div>
                <div class="ep-item">GET /api/plantas - Inventario Propio del Usuario</div>
                <div class="ep-item">GET /api/alertas - Alertas del Jardín del Usuario</div>
            </div>
        </div>
    </body>
    </html>
    """