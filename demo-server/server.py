from fastapi import FastAPI, Request, Response, WebSocket, status, WebSocketDisconnect
from fastapi.responses import JSONResponse
from enum import StrEnum
import requests
from transcribe import get_transcript
from constants import SAMPLE_RATE_HZ
from dataclasses import dataclass, asdict
from collections import defaultdict
import websockets
import asyncio
from datetime import datetime
import os

class Status(StrEnum):
  Success = "success"
  NoSpeech = "no_voice_detected"
  Error = "error"

@dataclass(kw_only=True)
class MurmurMetric():
  total_audio_seconds: float
  processed_audio_seconds: float
  optimization_percentage: float
  seconds_saved: float
  session_duration: float

@dataclass(kw_only=True)
class ServiceMetric():
  connected_time: datetime | None = None
  first_response_time: datetime | None = None
  sent_audio_seconds: float = 0.0

@dataclass(kw_only=True)
class SessionMetric():
  murmur = ServiceMetric()
  control = ServiceMetric()

@dataclass(kw_only=True)
class TranscriptMessage():
  status: Status
  transcription: str | None = None

class Env(StrEnum):
  Dev = "dev"
  Prod = "prod"

env = Env(os.environ.get("ENV") or "dev")
ws_url = "ws://localhost:8000/ws/" if env == Env.Dev else "wss://api.murmurstack.com/ws/"
http_url = "http://localhost:8000/" if env == Env.Dev else "https://api.murmurstack.com/"

app = FastAPI()

buffs = defaultdict(bytes)
MAX_BUFFER_SIZE_S = 5.0

metrics = defaultdict(SessionMetric)

def get_buffer_size_s(buff: bytes) -> float:
  return len(buff) / SAMPLE_RATE_HZ # this may not be right

@app.websocket("/ws/murmur/{client_id}")
async def upgrade_murmur(ws: WebSocket, client_id: str):
  await ws.accept()

  metrics[client_id].murmur.connected_time = datetime.now()

  try:
    async with websockets.connect(ws_url + client_id) as murmur_ws:
      async def handle_audio():
            async for data in ws.iter_bytes():
                await murmur_ws.send(data)

      async def handle_transcript():
          async for transcript in murmur_ws:
            if metrics[client_id].murmur.first_response_time is None:
              metrics[client_id].murmur.first_response_time = datetime.now()

            await ws.send_text(transcript)

      await asyncio.gather(handle_audio(), handle_transcript())
    
  except WebSocketDisconnect:
    print(f"{client_id} disconnected")


@app.websocket("/ws/control/{client_id}")
async def upgrade_control(ws: WebSocket, client_id: str):
  await ws.accept()

  metrics[client_id].control.connected_time = datetime.now()

  try:
    while True:
      data = await ws.receive_bytes()
      buffs[client_id] += data

      if get_buffer_size_s(buffs[client_id]) >= MAX_BUFFER_SIZE_S:
        transcript = get_transcript(buffs[client_id])
        print(transcript)
        metrics[client_id].control.sent_audio_seconds += get_buffer_size_s(buffs[client_id])
        buffs[client_id] = b''

        if transcript:
          await ws.send_json(asdict(TranscriptMessage(status=Status.Success, transcription=transcript)))

          if metrics[client_id].control.first_response_time is None:
            metrics[client_id].control.first_response_time = datetime.now()

        else:
          await ws.send_json(asdict(TranscriptMessage(status=Status.NoSpeech)))

  except WebSocketDisconnect:
    print(f"{client_id} disconnected")


@app.get("/get-metrics/{client_id}")
async def get_metrics(req: Request, client_id: str):
  metric = metrics.get(client_id)

  if metric is None:
    return Response(status_code=status.HTTP_404_NOT_FOUND)
  
  response = requests.get(f"{http_url}/metrics/{client_id}")
  murmur_metric = MurmurMetric(**response.json())
  metric.murmur.sent_audio_seconds = murmur_metric.processed_audio_seconds
  
  return { 
    "murmurFirstResponseTime": (metric.murmur.first_response_time - metric.murmur.connected_time).total_seconds() * 1000,
    "controlFirstResponseTime": (metric.control.first_response_time - metric.control.connected_time).total_seconds() * 1000,
    "percentOptimized": (metric.murmur.sent_audio_seconds / metric.control.sent_audio_seconds) * 100
  }


@app.get("/health")
def health():
  return Response(status_code=status.HTTP_200_OK)
