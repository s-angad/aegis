from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    app_name: str = "AEGIS AI"
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 8000
    city_center_lat: float = 28.6139
    city_center_lng: float = 77.2090
    cell_size_meters: float = 500.0
    grid_rows: int = 16
    grid_cols: int = 16
    tick_interval_seconds: float = 3.0
    max_timeline_ticks: int = 20

    class Config:
        env_file = ".env"

settings = Settings()
