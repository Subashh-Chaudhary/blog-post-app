import os
import sys
from dotenv import load_dotenv
from utils.logger import get_logger

logger = get_logger("config")

def load_config():
    # Attempt to load .env from the root directory
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    env_path = os.path.join(root_dir, ".env")
    
    if os.path.exists(env_path):
        load_dotenv(env_path)
    else:
        logger.warning(f"No .env file found at {env_path}. Relying on existing environment variables.")

    node_env = os.environ.get("NODE_ENV", "development").lower()
    if node_env == "production":
        logger.error("[bold red]CRITICAL: Refusing to run seeding script in production environment![/bold red]")
        sys.exit(1)

    mongo_uri = os.environ.get("MONGODB_URI")
    if not mongo_uri:
        logger.error("[bold red]MONGODB_URI not found in environment variables. Cannot connect to database.[/bold red]")
        sys.exit(1)

    return {
        "MONGODB_URI": mongo_uri,
        "NODE_ENV": node_env
    }

config = load_config()
