from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Media Platform"
    
    # Secret key for JWT
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY_FOR_JWT_SIGNING_CHANGEME"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # Database configuration
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgrespassword@localhost:5432/media_platform"
    
    # AWS configuration for S3
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: str = "media-platform-bucket"

    # AWS SES configuration
    SES_SENDER_EMAIL: str = "noreply@appcreators.com"

    # Frontend URL for password reset links
    FRONTEND_URL: str = "https://appcreators.com"

    class Config:
        env_file = ".env"

settings = Settings()
