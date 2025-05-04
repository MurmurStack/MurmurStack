from fastapi import FastAPI, Request, Response, WebSocket, status
from enum import Enum
from transcribe import get_transcript
from dataclasses import dataclass
from collections import defaultdict

class Status(Enum):
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
  sample_rate = 16000
  return len(buff) / sample_rate # this may not be right

@app.websocket("/ws-murmur")
async def upgrade_murmur(ws: WebSocket):
  client_id = ws.headers.get("client-id")

  if client_id is None:
    await ws.close(code=status.WS_1008_POLICY_VIOLATION)

  await ws.close(code=status.HTTP_501_NOT_IMPLEMENTED)


@app.websocket("/ws-control")
async def upgrade_control(ws: WebSocket):
  client_id = ws.headers.get("client-id")

  if client_id is None:
    await ws.close(code=status.WS_1008_POLICY_VIOLATION)

  await ws.accept()

  while True:
    data = await ws.receive_bytes()
    buffs[client_id] += data

    if get_buffer_size_s(buffs[client_id]) >= MAX_BUFFER_SIZE_S:
      try:
        transcript = get_transcript(data)
        buffs[client_id] = b''
      except:
        await ws.send_json(TranscriptMessage(status=Status.Error))

      if transcript:
        await ws.send_json(TranscriptMessage(status=Status.Success, transcript=transcript))
      else:
        await ws.send_json(TranscriptMessage(status=Status.NoSpeech))


@app.get("/get-metrics")
async def get_metrics(req: Request):
  client_id = req.headers.get("client-id")

  if client_id is None:
    return Response(status_code=status.HTTP_401_UNAUTHORIZED)
  
  return Response(status_code=status.HTTP_501_NOT_IMPLEMENTED)


@app.get("/health")
def health():
  return Response(status_code=status.HTTP_200_OK)
