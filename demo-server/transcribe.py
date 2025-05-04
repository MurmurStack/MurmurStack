import openai
import numpy as np
import os
import tempfile
from constants import SAMPLE_RATE_HZ
import wave

def get_transcript(buff: bytes) -> str:
  openai.api_key = os.environ.get('API_KEY_OPENAI')

  buff = (
    np.frombuffer(buff, dtype=np.float32) * np.iinfo(np.int16).max
  ).astype(np.int16).tobytes()

  if buff.size < 100:
    return ""

  with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as file:
    with wave.open(file.name, "wb") as wav:
      wav.setnchannels(1)
      wav.setsampwidth(2)
      wav.setframerate(SAMPLE_RATE_HZ)
      wav.writeframes(buff)

    with open(file.name, "rb") as wav:
      transcript = openai.audio.transcriptions.create(
          model="whisper-1",
          file=wav,
          response_format="text"
      )

  return transcript