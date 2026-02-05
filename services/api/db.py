from __future__ import annotations

import os
from dataclasses import dataclass

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from .models import Base


DEFAULT_DB_URL = os.getenv(
    "DATABASE_URL", "postgresql+psycopg://disaster:disaster@localhost:5432/disasterprotek"
)


@dataclass
class Database:
    url: str = DEFAULT_DB_URL

    def __post_init__(self) -> None:
        connect_args = {}
        if self.url.startswith("sqlite"):
            connect_args = {"check_same_thread": False}
        self.engine = create_engine(self.url, future=True, connect_args=connect_args)
        self.SessionLocal = sessionmaker(bind=self.engine, class_=Session, autoflush=False, autocommit=False)

    def create_all(self) -> None:
        Base.metadata.create_all(self.engine)
