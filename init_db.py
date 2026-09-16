from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from modelos import Base, CatalogoEspecies

# Conexión local a SQLite
DATABASE_URL = "sqlite:///botanico.db"

# check_same_thread=False previene errores de hilos si se implementa concurrencia posteriormente
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    if session.query(CatalogoEspecies).count() == 0:
        from seed_db import seed_database
        seed_database()
    session.close()
    print("Migración exitosa: Esquema de base de datos local (SQLite) creado y verificado.")

if __name__ == "__main__":
    init_db()