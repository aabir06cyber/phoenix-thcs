from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    jwt_access_key: str
    database_url: str
    algorithm: str

    gee_project: str
    gee_service_account_json: str|None = None
    firms_map_key: str
    
    class Config:
        env_file = ".env"
        
settings = Settings()
