from sqlalchemy import create_engine
from modelos import Base

# Conexión local a SQLite
DATABASE_URL = "sqlite:///botanico.db"

# check_same_thread=False previene errores de hilos si se implementa concurrencia posteriormente
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

def init_db():
    Base.metadata.create_all(bind=engine)
    print("Migración exitosa: Esquema de base de datos local (SQLite) creado.")

if __name__ == "__main__":
    init_db()