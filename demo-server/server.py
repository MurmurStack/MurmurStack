from fastapi import FastAPI, Request, Response, WebSocket, status, WebSocketDisconnect
from enum import StrEnum
from transcribe import get_transcript
from constants import SAMPLE_RATE_HZ
from dataclasses import dataclass, asdict
from collections import defaultdict

class Status(StrEnum):
  Success = "success"
  NoSpeech = "no_voice_detected"
  Error = "error"

@dataclass
class TranscriptMessage():
  status: Status
  transcript: str | None = None

app = FastAPI()

buffs = defaultdict(bytes)
MAX_BUFFER_SIZE_S = 5.0

def get_buffer_size_s(buff: bytes) -> float:
  return len(buff) / SAMPLE_RATE_HZ # this may not be right

@app.websocket("/ws-murmur")
async def upgrade_murmur(ws: WebSocket):
  client_id = ws.headers.get("client-id")

  if client_id is None:
    await ws.close(code=status.WS_1008_POLICY_VIOLATION)

  await ws.close(code=status.HTTP_501_NOT_IMPLEMENTED)


@app.websocket("/ws-control/{client_id}")
async def upgrade_control(ws: WebSocket, client_id: str):
  await ws.accept()

  try:
    while True:
      data = await ws.receive_bytes()

      if len(data) < 400:
        continue

      buffs[client_id] += data

      if get_buffer_size_s(buffs[client_id]) >= MAX_BUFFER_SIZE_S:
        try:
          transcript = get_transcript(buffs[client_id])
          buffs[client_id] = b''
        except:
          await ws.send_json(asdict(TranscriptMessage(status=Status.Error)))

        if transcript:
          await ws.send_json(asdict(TranscriptMessage(status=Status.Success, transcript=transcript)))
        else:
          await ws.send_json(asdict(TranscriptMessage(status=Status.NoSpeech)))

  except WebSocketDisconnect:
    print(f"{client_id} disconnected")


@app.get("/get-metrics")
async def get_metrics(req: Request):
  client_id = req.headers.get("client-id")

  if client_id is None:
    return Response(status_code=status.HTTP_401_UNAUTHORIZED)
  
  return Response(status_code=status.HTTP_501_NOT_IMPLEMENTED)


@app.get("/health")
def health():
  return Response(status_code=status.HTTP_200_OK)
