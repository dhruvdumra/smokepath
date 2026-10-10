"""Static configuration: model domain, time conventions, data endpoints."""
import os
from datetime import timedelta, timezone

# Model domain: Punjab + Haryana + Delhi NCR + western UP, on the CAMS-global 0.4 degree lattice.
GRID = {"lat_min": 27.0, "lat_max": 32.6, "lon_min": 73.6, "lon_max": 79.6, "step": 0.4}

# Delhi NCR (Delhi, Gurugram, Faridabad, Noida, Ghaziabad): lat_min, lon_min, lat_max, lon_max.
NCR_BBOX = (28.35, 76.80, 28.95, 77.55)

# Wider box used to pull CPCB stations for bias correction.
STATION_BBOX = (27.0, 73.6, 32.6, 79.6)

IST = timezone(timedelta(hours=5, minutes=30))

# Bundle time window relative to t0 (hours).
PAST_HOURS = 24
FUTURE_HOURS = 48

# Wind level used for smoke transport (stubble smoke travels inside the boundary layer, ~0.5-1.5 km).
WIND_LEVEL_HPA = 925

OPENMETEO_AQ = "https://air-quality-api.open-meteo.com/v1/air-quality"
OPENMETEO_GFS = "https://api.open-meteo.com/v1/gfs"
OPENMETEO_GFS_HISTORICAL = "https://historical-forecast-api.open-meteo.com/v1/forecast"
OPENAQ_API = "https://api.openaq.org/v3"
OPENAQ_ARCHIVE_BUCKET = "openaq-data-archive"
FIRMS_BASE = "https://firms.modaps.eosdis.nasa.gov"


def env(name, default=None):
    return os.environ.get(name, default)
