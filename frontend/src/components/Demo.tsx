import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/solid';

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

export default function Demo() {
  const [state, setState] = useState<State>(State.NotRecording)
  const [transcript, setTranscript] = useState<string>('')
  const [metrics, setMetrics] = useState<Metrics | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)

  const fetchMetrics = useCallback(async () => {
    const response = await fetch(`${REST_URL}metrics/${CLIENT_ID}`)
    const metrics = await response.json() as Metrics
    setMetrics(metrics)
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
  }, [])

  const stopRecording = useCallback(async () => {
    if (processorRef.current != null)
      microphoneRef.current?.disconnect(processorRef.current)
    audioContextRef.current?.close()
    streamRef.current?.getTracks().forEach(track => { track.stop() })
    wsRef.current?.close()

    await fetchMetrics()
    setState(State.DoneRecording)
  }, [fetchMetrics])

  return (
    <div id="demo" className="section-padding bg-gray-50">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Try It Live
          </h2>
          <p className="mt-2 text-lg leading-8 text-gray-600">
            Experience real-time audio optimization and transcription
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mx-auto mt-10 max-w-3xl"
        >
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="flex justify-center space-x-4 mb-8">
              <button
                onClick={startRecording}
                disabled={state === State.Recording}
                className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                  state === State.Recording
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                <MicrophoneIcon className="h-5 w-5 mr-2" />
                Start Recording
              </button>

              <button
                onClick={stopRecording}
                disabled={state !== State.Recording}
                className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                  state !== State.Recording
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                <StopIcon className="h-5 w-5 mr-2" />
                Stop Recording
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Transcription</h3>
                <div className="bg-gray-50 rounded-lg p-4 min-h-[100px]">
                  <p className="text-gray-700">{transcript || 'Your transcription will appear here...'}</p>
                </div>
              </div>

              {state === State.DoneRecording && metrics && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-primary-50 rounded-lg p-6"
                >
                  <h3 className="text-lg font-semibold text-primary-900 mb-4">Optimization Metrics</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-500">Total Audio</p>
                      <p className="text-2xl font-bold text-primary-600">{metrics.total_audio_seconds.toFixed(1)}s</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-500">Processed Audio</p>
                      <p className="text-2xl font-bold text-primary-600">{metrics.processed_audio_seconds.toFixed(1)}s</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Optimization Progress</span>
                      <span className="font-medium text-primary-600">{metrics.optimization_percentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${metrics.optimization_percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-primary-600"
                      />
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-primary-600 font-medium">
                    {metrics.seconds_saved.toFixed(1)}s saved through optimization
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 