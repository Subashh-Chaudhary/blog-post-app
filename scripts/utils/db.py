from pymongo import MongoClient
from pymongo.database import Database
from utils.config import config
from utils.logger import get_logger

logger = get_logger("db")

class DBConnection:
    _instance = None
    _client = None
    _db = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DBConnection, cls).__new__(cls)
            cls._instance._connect()
        return cls._instance

    def _connect(self):
        try:
            self._client = MongoClient(config["MONGODB_URI"])
            # Assuming the DB name is provided in the URI
            self._db = self._client.get_default_database()
            # Just to test connection
            self._client.admin.command('ping')
        except Exception as e:
            logger.error(f"[bold red]Failed to connect to MongoDB: {e}[/bold red]")
            raise e

    @property
    def db(self) -> Database:
        return self._db

    def close(self):
        if self._client:
            self._client.close()

def get_db() -> Database:
    return DBConnection().db

def close_db():
    DBConnection().close()
