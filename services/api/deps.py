from __future__ import annotations

from typing import Generator

from fastapi import Request
from sqlalchemy.orm import Session


def get_db(request: Request) -> Generator[Session, None, None]:
    db = request.app.state.db
    session = db.SessionLocal()
    try:
        yield session
    finally:
        session.close()
