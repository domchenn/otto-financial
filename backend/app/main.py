from fastapi import FastAPI

from app.core.config import get_settings
from app.core.logging import configure_logging
from app.modules.accounts.router import router as accounts_router
from app.modules.benefits.router import router as benefits_router
from app.modules.budgets.router import router as budgets_router
from app.modules.identity.router import router as identity_router
from app.modules.points.router import router as points_router
from app.modules.system.router import router as system_router


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_level)
    app = FastAPI(
        title="Otto API",
        version="0.1.0",
        docs_url="/docs" if settings.environment in ("local", "test") else None,
        redoc_url=None,
    )
    app.include_router(system_router)
    app.include_router(identity_router)
    app.include_router(accounts_router)
    app.include_router(benefits_router)
    app.include_router(budgets_router)
    app.include_router(points_router)
    return app


app = create_app()
