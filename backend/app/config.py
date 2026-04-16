from dotenv import load_dotenv
import os

load_dotenv()

# Core security settings
SECRET_KEY = os.getenv("SECRET_KEY")
<<<<<<< HEAD
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRATION = int(os.getenv("ACCESS_TOKEN_EXPIRATION"))
=======
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# Token expiration (default = 30 minutes if missing)
ACCESS_TOKEN_EXPIRATION = int(os.getenv("ACCESS_TOKEN_EXPIRATION", "30"))

# Database
>>>>>>> 6f8a4b6 (Edited backend structure with models and schema)
DATABASE_URL = os.getenv("DATABASE_URL")