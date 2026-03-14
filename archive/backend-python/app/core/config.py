
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, EmailStr, validator
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "PMS Backend"
    API_V1_STR: str = "/api/v1"
    
    # SECURITY
    SECRET_KEY: str
    JWT_SECRET: str = "greatstack"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days
    
    # DATABASE
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_SERVER: str
    POSTGRES_PORT: str
    POSTGRES_DB: str
    DATABASE_URL: str
    
    # ADMIN
    ADMIN_EMAIL: str | None = None
    ADMIN_PASSWORD: str | None = None
    
    # AI
    GEMINI_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None
    
    # THIRD PARTY - CLOUDINARY
    CLOUDINARY_NAME: str | None = None
    CLOUDINARY_API_KEY: str | None = None
    CLOUDINARY_SECRET_KEY: str | None = None
    
    # PAYMENTS
    RAZORPAY_KEY_ID: str | None = None
    RAZORPAY_KEY_SECRET: str | None = None
    STRIPE_SECRET_KEY: str | None = None
    
    # WHATSAPP
    WHATSAPP_ACCESS_TOKEN: str | None = None
    WHATSAPP_PHONE_NUMBER_ID: str | None = None
    WHATSAPP_BUSINESS_ACCOUNT_ID: str | None = None
    WHATSAPP_VERIFY_TOKEN: str | None = None
    WHATSAPP_PROVIDER: str | None = "meta"
    
    # EMAIL (BREVO)
    BREVO_API_KEY: str | None = None
    BREVO_SENDER_EMAIL: str | None = None
    BREVO_APP_NAME: str | None = None
    
    # APP SETTINGS
    CURRENCY: str = "INR"
    PLATFORM_FEE_PERCENTAGE: int = 5
    GST_PERCENTAGE: int = 18
    
    # URLS
    FRONTEND_URL: str = "http://localhost:5173"
    ADMIN_URL: str = "http://localhost:5174"
    
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
