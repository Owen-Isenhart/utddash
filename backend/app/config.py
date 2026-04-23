from dotenv import load_dotenv
import os

load_dotenv()

# Core security settings
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# Token expiration (default = 30 minutes if missing)
ACCESS_TOKEN_EXPIRATION = int(os.getenv("ACCESS_TOKEN_EXPIRATION", "30"))

# Database
DATABASE_URL = os.getenv("DATABASE_URL")