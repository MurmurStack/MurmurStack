import os

SAMPLE_RATE = int(os.environ.get("SAMPLE_RATE"))
REDIS_HOST = os.environ.get("REDIS_HOST")
BUFFER_MIN_S = float(os.environ.get("BUFFER_MIN_S"))
BUFFER_MAX_S = float(os.environ.get("BUFFER_MAX_S"))
SILENCE_THRESHOLD_RMS = float(os.environ.get("SILENCE_THRESHOLD_RMS"))
