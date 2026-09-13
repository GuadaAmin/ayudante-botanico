from datetime import datetime, timezone
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class CatalogoEspecies(Base):
    __tablename__ = 'catalogo_especies'
    id = Column(Integer, primary_key=True, index=True)
    nombre_cientifico = Column(String(150), nullable=False, unique=True)
    umbral_temp_min = Column(Float, nullable=False)
    req_hidrico_base = Column(Float, nullable=False)

class PlantasRegistradas(Base):
    __tablename__ = 'plantas_registradas'
    id = Column(Integer, primary_key=True, index=True)
    especie_id = Column(Integer, ForeignKey('catalogo_especies.id'), nullable=False)
    alias = Column(String(100), nullable=False)
    indice_riesgo_fitosanitario = Column(Float, default=0.0)
    prioridad_riego_actual = Column(Float, default=0.0)
    especie = relationship("CatalogoEspecies")

class BitacoraEventos(Base):
    __tablename__ = 'bitacora_eventos'
    id = Column(Integer, primary_key=True, index=True)
    planta_id = Column(Integer, ForeignKey('plantas_registradas.id'), nullable=False)
    tipo_evento = Column(String(50), nullable=False)
    fecha = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    observaciones = Column(Text, nullable=True)

class TareasPendientes(Base):
    __tablename__ = 'tareas_pendientes'
    id = Column(Integer, primary_key=True, index=True)
    planta_id = Column(Integer, ForeignKey('plantas_registradas.id'), nullable=False)
    tipo_tarea = Column(String(50), nullable=False)
    estado_tarea = Column(String(20), default='PENDIENTE')
    fecha_generacion = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class AlertasMeteorologicas(Base):
    __tablename__ = 'alertas_meteorologicas'
    id = Column(Integer, primary_key=True, index=True)
    planta_id = Column(Integer, ForeignKey('plantas_registradas.id'), nullable=False)
    severidad = Column(String(20), nullable=False)
    mensaje = Column(Text, nullable=False)
    fecha_expiracion = Column(DateTime(timezone=True), nullable=False)

class MedicionesAmbientales(Base):
    __tablename__ = 'mediciones_ambientales'
    id = Column(Integer, primary_key=True, index=True)
    planta_id = Column(Integer, ForeignKey('plantas_registradas.id'), nullable=False)
    humedad_sustrato = Column(Float, nullable=False)
    temperatura_ambiental = Column(Float, nullable=False)
    humedad_relativa = Column(Float, nullable=False)
    fecha = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))