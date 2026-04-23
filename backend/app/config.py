from dotenv import load_dotenv
import os

load_dotenv()

# Core security settings
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
	raise ValueError("SECRET_KEY must be set")

# Provide defaults to prevent crashes if .env is missing these keys
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRATION = int(os.getenv("ACCESS_TOKEN_EXPIRATION", "30"))
QR_TOKEN_TTL_MINUTES = int(os.getenv("QR_TOKEN_TTL_MINUTES", "10"))

# Database connection string
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
	raise ValueError("DATABASE_URL must be set")