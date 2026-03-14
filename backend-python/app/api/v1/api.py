
from fastapi import APIRouter
from app.api.v1.endpoints import users, login, specialties, hospitals

api_router = APIRouter()

api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(specialties.router, prefix="/specialty", tags=["specialties"])
api_router.include_router(hospitals.router, prefix="/hospital-tieup", tags=["hospitals"])
