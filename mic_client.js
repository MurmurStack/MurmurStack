/**
 * Real-time Audio Transcription Client
 * This script captures audio from the microphone and sends it to a WebSocket server.
 */

// Configuration
const SERVER_URL = 'ws://localhost:8000/ws/';
const API_BASE_URL = 'http://localhost:8000/';
const CLIENT_ID = 'browser-' + Math.floor(Math.random() * 1000);
const SAMPLE_RATE = 16000; // Must match server's sample rate
const BUFFER_SIZE = 4096;

// Global variables
let audioContext;
let microphone;
let processor;
let websocket;
let isRecording = false;

// DOM elements
let status, startButton, stopButton, transcriptArea, metricsArea;

// Initialize on page load
window.addEventListener('load', () => {
    // Get DOM elements
    status = document.getElementById('status');
    startButton = document.getElementById('startButton');
    stopButton = document.getElementById('stopButton');
    transcriptArea = document.getElementById('transcript');
    metricsArea = document.getElementById('metrics');

    // Add event listeners to buttons
    startButton.addEventListener('click', startRecording);
    stopButton.addEventListener('click', stopRecording);

    // Initialize UI
    status.textContent = 'Disconnected';
    status.style.color = 'red';
    stopButton.disabled = true;
    
    // Hide metrics initially
    if (metricsArea) {
        metricsArea.style.display = 'none';
    }
});

/**
 * Connect to the WebSocket server
 */
function connectWebSocket() {
    const url = SERVER_URL + CLIENT_ID;
    updateStatus('Connecting to server...', 'blue');
    
    websocket = new WebSocket(url);
    
    websocket.onopen = (event) => {
        updateStatus('Connected. Ready to stream audio.', 'green');
        startButton.disabled = false;
    };
    
    websocket.onclose = (event) => {
        updateStatus('Disconnected from server', 'red');
        stopRecording();
    };
    
    websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        updateStatus('WebSocket error', 'red');
        stopRecording();
    };
    
    websocket.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            handleServerMessage(message);
        } catch (error) {
            console.error('Error parsing server message:', error);
        }
    };
}

/**
 * Handle messages from the server
 */
function handleServerMessage(message) {
    console.log('Server message:', message);
    
    if (message.status === 'success' && message.transcription) {
        // Add the transcription to the transcript area
        const transcriptEl = document.createElement('p');
        transcriptEl.textContent = message.transcription;
        transcriptArea.appendChild(transcriptEl);
        
        // Auto-scroll to the bottom
        transcriptArea.scrollTop = transcriptArea.scrollHeight;
    } else if (message.status === 'error') {
        console.error('Server error:', message.message);
        updateStatus('Server error: ' + message.message, 'red');
    }
}

/**
 * Fetch and display optimization metrics
 */
function fetchOptimizationMetrics() {
    // Show a loading indicator in the metrics area
    if (metricsArea) {
        metricsArea.innerHTML = '<p>Loading optimization metrics...</p>';
        metricsArea.style.display = 'block';
    }
    
    fetch(`${API_BASE_URL}metrics/${CLIENT_ID}`)
        .then(response => response.json())
        .then(metrics => {
            // Format numbers for display
            const totalSeconds = metrics.total_audio_seconds.toFixed(1);
            const processedSeconds = metrics.processed_audio_seconds.toFixed(1);
            const savedSeconds = metrics.seconds_saved.toFixed(1);
            const optimizationPct = metrics.optimization_percentage.toFixed(1);
            
            metricsArea.innerHTML = `
                <h3 class="metrics-title">Audio Optimization Metrics</h3>
                
                <div class="metrics-value">
                    <span>Total Audio:</span>
                    <span class="metrics-highlight">${totalSeconds}s</span>
                </div>
                
                <div class="metrics-value">
                    <span>Processed Audio:</span>
                    <span class="metrics-highlight">${processedSeconds}s</span>
                </div>
                
                <div class="metrics-progress">
                    <div class="metrics-progress-bar" style="width: ${metrics.optimization_percentage}%"></div>
                </div>
                
                <div class="savings-info">
                    ${savedSeconds}s saved (${optimizationPct}% optimization)
                </div>
            `;
        })
        .catch(error => {
            console.error('Error fetching metrics:', error);
            if (metricsArea) {
                metricsArea.innerHTML = '<p>Error loading metrics. Please try again.</p>';
            }
        });
}

/**
 * Start recording audio from the microphone
 */
async function startRecording() {
    try {
        // Check if the browser supports the Web Audio API
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            updateStatus('Your browser does not support audio recording', 'red');
            return;
        }
        
        // Connect to the WebSocket server if not already connected
        if (!websocket || websocket.readyState !== WebSocket.OPEN) {
            connectWebSocket();
            // Wait a bit for the connection to establish
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (!websocket || websocket.readyState !== WebSocket.OPEN) {
                updateStatus('Could not connect to server', 'red');
                return;
            }
        }
        
        // Request access to the microphone
        updateStatus('Requesting microphone access...', 'blue');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Create the audio context
        audioContext = new (window.AudioContext || window.webkitAudioContext)({
            sampleRate: SAMPLE_RATE
        });
        
        // Create a microphone input source
        microphone = audioContext.createMediaStreamSource(stream);
        
        // Create a script processor node for raw audio data
        processor = audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);
        
        // Set up the audio processing callback
        processor.onaudioprocess = (e) => {
            if (isRecording && websocket && websocket.readyState === WebSocket.OPEN) {
                // Get the raw audio data
                const inputData = e.inputBuffer.getChannelData(0);
                
                // Send the raw audio data to the server
                websocket.send(inputData.buffer);
            }
        };
        
        // Connect the audio graph
        microphone.connect(processor);
        processor.connect(audioContext.destination);
        
        // Update UI
        isRecording = true;
        startButton.disabled = true;
        stopButton.disabled = false;
        updateStatus('Recording...', 'green');
        
        // Clear transcript
        transcriptArea.innerHTML = '';
        
        // Hide metrics during recording
        if (metricsArea) {
            metricsArea.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error starting recording:', error);
        updateStatus('Error starting recording: ' + error.message, 'red');
    }
}

/**
 * Stop recording audio
 */
function stopRecording() {
    if (isRecording) {
        // Disconnect the audio graph
        if (microphone && processor) {
            microphone.disconnect(processor);
            processor.disconnect();
        }
        
        // Close audio context
        if (audioContext && audioContext.state !== 'closed') {
            audioContext.close();
        }
        
        // Update UI
        isRecording = false;
        startButton.disabled = false;
        stopButton.disabled = true;
        updateStatus('Stopped recording', 'blue');
        
        // Get final metrics
        fetchOptimizationMetrics();
    }
}

/**
 * Update the status display
 */
function updateStatus(message, color) {
    if (status) {
        status.textContent = message;
        status.style.color = color || 'black';
    }
    console.log('Status:', message);
}

// If browser is closing or refreshing, clean up resources
window.addEventListener('beforeunload', () => {
    stopRecording();
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.close();
    }
}); 