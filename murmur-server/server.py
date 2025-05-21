import logging
from dataclasses import asdict, dataclass
from enum import StrEnum
from hashlib import sha256

import numpy as np
import torch
from env import (
  BUFFER_MAX_S,
  BUFFER_MIN_S,
  REDIS_HOST,
  SAMPLE_RATE,
  SILENCE_THRESHOLD_RMS,
)
from fastapi import FastAPI, Response, WebSocket, WebSocketDisconnect, status
from redis import Redis
from transcribe import OpenAITranscriber
from vad import SileroVADProcessor


class Status(StrEnum):
  Success = "success"
  NoVoice = "no_voice_detected"
  Error = "error"


@dataclass(kw_only=True)
class ResponseMessage:
  status: Status
  transcript: str | None = None


app = FastAPI()
redis = Redis(host=REDIS_HOST)

logging.basicConfig(
  level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger()

vad = SileroVADProcessor(
  threshold=0.3,  # More sensitive to detect speech
  min_speech_duration_ms=250,
  min_silence_duration_ms=1000,
  sampling_rate=SAMPLE_RATE,
)

transcriber = OpenAITranscriber(
  sample_rate=SAMPLE_RATE, transcription_dir="./transcriptions"
)


def get_buffer_duration_s(buff: list[torch.Tensor]) -> float:
  return sum(tensor.numel() for tensor in buff) / SAMPLE_RATE


def should_flush(buff: list[torch.Tensor]) -> bool:
  duration = get_buffer_duration_s(buff)

  if duration >= BUFFER_MAX_S:
    return True

  if duration >= BUFFER_MIN_S:
    # Calculate RMS of the last ~200ms to detect silence
    sample_size = min(int(0.2 * SAMPLE_RATE), buff[-1].numel())

    sample = buff[-1][-sample_size:]
    rms = torch.sqrt(torch.mean(sample**2))

    if rms < SILENCE_THRESHOLD_RMS:
      logger.info(
        f"Detected silence at end of audio chunk (RMS: {rms:.4f}), processing buffer ({duration:.2f}s)"
      )

      return True

  return False


@app.websocket("/{api_key}")
async def root(ws: WebSocket, api_key: str):
  api_key_hash = sha256(api_key.encode()).hexdigest()
  user_id = redis.get(f"key:{api_key_hash}")

  if not user_id:
    await ws.close(code=1008)

  await ws.accept()

  buff: list[torch.TensorType] = []

  try:
    while True:
      data = await ws.receive_bytes()
      buff.append(torch.from_numpy(np.frombuffer(data, dtype=np.float32)))

      if not should_flush(buff):
        continue

      redis.hincrbyfloat(f"user:{user_id}", "usage", get_buffer_duration_s(buff))

      cleaned_tensor = vad.process_audio_tensor(torch.cat(buff))
      transcript = transcriber.transcribe_audio_tensor(cleaned_tensor)

      message = (
        ResponseMessage(status=Status.Success, transcript=transcript)
        if transcript
        else ResponseMessage(status=Status.NoVoice, transcript=transcript)
      )

      ws.send_json(asdict(message))

  except WebSocketDisconnect:
    pass
  except Exception as e:
    logger.exception(e)


@app.get("/health")
async def health():
  return {"status": "ok"}
