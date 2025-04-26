import React, { useState, useEffect, useRef } from 'react';
import '../styles/TranscriptionApp.css';

const TranscriptionApp = () => {
  // Configuration
  const SERVER_URL = process.env.REACT_APP_API_WS_URL || 'ws://localhost:8000/ws/';
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/';
  const CLIENT_ID = 'browser-' + Math.floor(Math.random() * 1000);
  const SAMPLE_RATE = 16000;
  const BUFFER_SIZE = 4096;

  // State
  const [status, setStatus] = useState('Disconnected');
  const [statusColor, setStatusColor] = useState('red');
  const [isRecording, setIsRecording] = useState(false);
  const [transcripts, setTranscripts] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [showMetrics, setShowMetrics] = useState(false);

  // Refs
  const websocketRef = useRef(null);
  const audioContextRef = useRef(null);
  const microphoneRef = useRef(null);
  const processorRef = useRef(null);
  const transcriptAreaRef = useRef(null);
  const isRecordingRef = useRef(false); // Add a ref to track recording state for callbacks
  const clientIdRef = useRef(CLIENT_ID); // Store the client ID in a ref to ensure consistency
  const streamRef = useRef(null); // Store the media stream to stop tracks later

  // Connect to WebSocket
  const connectWebSocket = () => {
    const url = SERVER_URL + clientIdRef.current;
    updateStatus('Connecting to server...', 'blue');
    
    websocketRef.current = new WebSocket(url);
    
    websocketRef.current.onopen = () => {
      updateStatus('Connected. Ready to stream audio.', 'green');
    };
    
    websocketRef.current.onclose = () => {
      updateStatus('Disconnected from server', 'red');
      stopRecording();
    };
    
    websocketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      updateStatus('WebSocket error', 'red');
      stopRecording();
    };
    
    websocketRef.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleServerMessage(message);
      } catch (error) {
        console.error('Error parsing server message:', error);
      }
    };
  };

  // Handle server messages
  const handleServerMessage = (message) => {
    console.log('Server message:', message);
    
    if (message.status === 'success' && message.transcription) {
      setTranscripts(prev => [...prev, message.transcription]);
      
      // Auto-scroll to the bottom
      if (transcriptAreaRef.current) {
        transcriptAreaRef.current.scrollTop = transcriptAreaRef.current.scrollHeight;
      }
    } else if (message.status === 'error') {
      console.error('Server error:', message.message);
      updateStatus('Server error: ' + message.message, 'red');
    }
  };

  // Fetch optimization metrics
  const fetchOptimizationMetrics = () => {
    // Show metrics UI immediately (even during loading)
    setShowMetrics(true);
    
    // Clear any previous metrics
    setMetrics(null);
    
    // Log the fetch URL for debugging
    const metricsUrl = `${API_BASE_URL}metrics/${clientIdRef.current}`;
    console.log('Fetching metrics from:', metricsUrl);
    
    // Display loading status
    updateStatus('Loading metrics...', 'blue');
    
    fetch(metricsUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        console.log('Metrics response received:', response);
        return response.json();
      })
      .then(metricsData => {
        console.log('Metrics data received:', metricsData);
        
        // Validate the metrics data
        if (!metricsData || 
            typeof metricsData.total_audio_seconds === 'undefined' || 
            typeof metricsData.processed_audio_seconds === 'undefined') {
          throw new Error('Invalid metrics data received');
        }
        
        // Update state with the metrics
        setMetrics(metricsData);
        updateStatus('Metrics loaded', 'green');
      })
      .catch(error => {
        console.error('Error fetching metrics:', error);
        updateStatus('Error loading metrics: ' + error.message, 'red');
      });
  };

  // Start recording
  const startRecording = async () => {
    try {
      // Check if the browser supports the Web Audio API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        updateStatus('Your browser does not support audio recording', 'red');
        return;
      }
      
      // Connect to the WebSocket server if not already connected
      if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
        connectWebSocket();
        // Wait a bit for the connection to establish
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
          updateStatus('Could not connect to server', 'red');
          return;
        }
      }
      
      // Request access to the microphone
      updateStatus('Requesting microphone access...', 'blue');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Store the stream in a ref so we can stop it later
      streamRef.current = stream;
      
      // Create the audio context
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: SAMPLE_RATE
      });
      
      // Create a microphone input source
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      // Create a script processor node for raw audio data
      processorRef.current = audioContextRef.current.createScriptProcessor(BUFFER_SIZE, 1, 1);
      
      // Set the recording state ref to true before setting up the audio processor
      isRecordingRef.current = true;
      
      // Set up the audio processing callback
      processorRef.current.onaudioprocess = (e) => {
        // Use the isRecordingRef instead of state to avoid closure issues
        if (isRecordingRef.current && websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
          // Get the raw audio data
          const inputData = e.inputBuffer.getChannelData(0);
          
          // Send the raw audio data to the server
          websocketRef.current.send(inputData.buffer);
        }
      };
      
      // Connect the audio graph
      microphoneRef.current.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);
      
      // Update UI
      setIsRecording(true);
      updateStatus('Recording...', 'green');
      
      // Clear transcript
      setTranscripts([]);
      
      // Hide metrics during recording
      setShowMetrics(false);
      setMetrics(null);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      updateStatus('Error starting recording: ' + error.message, 'red');
    }
  };

  // Stop recording
  const stopRecording = () => {
    // First update ref to stop audio processing
    isRecordingRef.current = false;
    
    if (isRecording) {
      // Disconnect the audio graph
      if (microphoneRef.current && processorRef.current) {
        microphoneRef.current.disconnect(processorRef.current);
        processorRef.current.disconnect();
      }
      
      // Close audio context
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      
      // Stop all tracks from the media stream to fully release the microphone
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        streamRef.current = null;
      }
      
      // Update UI
      setIsRecording(false);
      updateStatus('Stopped recording', 'blue');
      
      // Get final metrics
      fetchOptimizationMetrics();
    }
  };

  // Update status
  const updateStatus = (message, color) => {
    setStatus(message);
    setStatusColor(color);
    console.log('Status:', message);
  };

  // Auto-connect WebSocket on component mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    console.log('Component mounted. Client ID:', clientIdRef.current);
    connectWebSocket();
    
    // Cleanup on unmount
    return () => {
      isRecordingRef.current = false; // Ensure we stop recording on unmount
      if (websocketRef.current) {
        websocketRef.current.close();
      }
      if (isRecording) {
        stopRecording();
      }
    };
  }, []);

  return (
    <div className="container">
      <header>
        <h1>Optimized Audio Transcription</h1>
        <p className="tagline">Advanced voice processing with real-time optimization metrics</p>
      </header>

      <div className="controls">
        <button 
          id="startButton" 
          onClick={startRecording} 
          disabled={isRecording}
        >
          Start Recording
        </button>
        <button 
          id="stopButton" 
          onClick={stopRecording} 
          disabled={!isRecording}
        >
          Stop Recording
        </button>
      </div>

      <div id="status" style={{ color: statusColor }}>{status}</div>

      {showMetrics && (
        <div id="metrics" className="metrics-box">
          {!metrics ? (
            <p>Loading optimization metrics...</p>
          ) : (
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
          )}
        </div>
      )}

      <h2>Transcription</h2>
      <div id="transcript" className="card" ref={transcriptAreaRef}>
        {transcripts.map((transcript, index) => (
          <p key={index}>{transcript}</p>
        ))}
      </div>

      <div className="footer">
        <p>Powered by SileroVAD + NoiseReduce + OpenAI Whisper</p>
      </div>
    </div>
  );
};

export default TranscriptionApp; 