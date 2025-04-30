import { useState, useRef, useCallback } from 'react'
import '../styles/TranscriptionApp.css'

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext
  }
}

type Metrics = {
  total_audio_seconds: number,
  processed_audio_seconds: number,
  optimization_percentage: number
  seconds_saved: number,
  session_duration: number
}

type Message = {
  status: string,
  transcription: string
}

enum State { NotRecording, Recording, DoneRecording }

const WS_URL = (process.env.REACT_APP_ENV === 'production' ? 
  process.env.REACT_APP_PROD_API_WS_URL : 
  process.env.REACT_APP_DEV_API_WS_URL) ||'ws://localhost:8000/ws/'

const REST_URL = (process.env.REACT_APP_ENV === 'production' ? 
  process.env.REACT_APP_PROD_API_BASE_URL : 
  process.env.REACT_APP_DEV_API_BASE_URL) || 'http://localhost:8000/'

const CLIENT_ID = crypto.randomUUID()

const BUFFER_SIZE = 4096
const SAMPLE_RATE = 16000

const DemoApp = () => {
  const [state, setState] = useState<State>(State.NotRecording)

  const [transcript, setTranscript] = useState<string>('')
  const [metrics, setMetrcis] = useState<Metrics | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)

  const fetchMetrics = useCallback(async () => {
    const response = await fetch(`${REST_URL}metrics/${CLIENT_ID}`)

    const metrics = await response.json() as Metrics
    setMetrcis(metrics)
  }, [])

  const startRecording = useCallback(async () => {
    setTranscript("")

    wsRef.current = new WebSocket(WS_URL + CLIENT_ID)
    streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: SAMPLE_RATE
    })
    microphoneRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current)
    processorRef.current = audioContextRef.current.createScriptProcessor(BUFFER_SIZE, 1, 1)
    processorRef.current.onaudioprocess = (event) => {
      const inputData = event.inputBuffer.getChannelData(0)
      wsRef.current?.send(inputData.buffer)
    }
    
    microphoneRef.current.connect(processorRef.current)
    processorRef.current.connect(audioContextRef.current.destination)

    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data) as Message

      if(message.status === "success") {
        setTranscript(transcript => transcript + " " + message.transcription)
      }
    }

    setState(State.Recording)
  }, [setState, setTranscript, wsRef, streamRef, audioContextRef, microphoneRef, processorRef])

  const stopRecording = useCallback(async () => {
    if (processorRef.current != null)
      microphoneRef.current?.disconnect(processorRef.current)
    audioContextRef.current?.close()
    streamRef.current?.getTracks().forEach(track => { track.stop() })
    wsRef.current?.close()

    await fetchMetrics()
    setState(State.DoneRecording)
  }, [setState, fetchMetrics])

  return (
    <div className="container">
      <header>
        <h1>Optimized Audio Transcription</h1>
        <p className="tagline">Advanced voice processing with real-time optimization metrics</p>
      </header>

      <div className="controls">
        <button id="startButton"  onClick={startRecording} disabled={state === State.Recording}>
          Start Recording
        </button>

        <button id="stopButton" onClick={stopRecording} disabled={state !== State.Recording}>
          Stop Recording
        </button>
      </div>

      <h2>Transcription</h2>
      <div id="transcript" className="card">
        <p>{transcript}</p>
      </div>

      {state === State.DoneRecording  && (
        <div id="metrics" className="metrics-box">
          {metrics != null ? (
            <>
              <h3 className="metrics-title">Audio Optimization Metrics</h3>
              
              <div className="metrics-value">
                <span>Total Audio:</span>
                <span className="metrics-highlight">{metrics.total_audio_seconds.toFixed(1)}s</span>
              </div>
              
              <div className="metrics-value">
                <span>Processed Audio:</span>
                <span className="metrics-highlight">{metrics.processed_audio_seconds.toFixed(1)}s</span>
              </div>
              
              <div className="metrics-progress">
                <div className="metrics-progress-bar" style={{ width: `${metrics.optimization_percentage}%` }}></div>
              </div>
              
              <div className="savings-info">
                {metrics.seconds_saved.toFixed(1)}s saved ({metrics.optimization_percentage.toFixed(1)}% optimization)
              </div>
            </>
          ) : <p>Loading optimization metrics...</p>}
        </div>
      )}
    </div>
  )
}

export default DemoApp