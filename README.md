# Optimized Audio Transcription System

This system provides real-time audio transcription with advanced optimization features that significantly reduce the amount of audio data sent to OpenAI's API, resulting in cost savings and improved efficiency.

## Features

- **Voice Activity Detection (VAD)**: Uses Silero VAD to identify and extract only speech segments
- **Noise Reduction**: Applies adaptive noise reduction to clean up the audio
- **Real-time Optimization Metrics**: Shows how much audio data was saved by the optimization pipeline
- **WebSocket-based Communication**: Enables real-time streaming of audio from the browser to the server
- **Modern UI**: Clean, responsive interface for audio recording and transcription display

## How It Works

1. The client captures audio from your microphone and sends it to the server via WebSocket
2. The server applies a processing pipeline:
   - Buffers incoming audio until a reasonable chunk is available
   - Applies Voice Activity Detection to identify speech segments
   - Applies Noise Reduction to clean the audio
   - Sends only the processed audio to OpenAI's Whisper API for transcription
3. The server tracks optimization metrics (total audio vs processed audio)
4. The client displays transcription results and optimization metrics in real-time

## Installation

### Prerequisites

- Python 3.7+
- PyTorch 1.7+
- FFmpeg (for audio processing)

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/MurmurStack/MurmurStack
   cd sestream
   ```

2. Install backend dependencies:
   ```
   pip install -r backend/requirements.txt
   ```

3. Setup OpenAI API key:
   ```
   export OPENAI_API_KEY="your-api-key"
   ```

## Usage

### Starting the Backend

```bash
# Navigate to the project directory
cd sestream

# Start the backend server
python backend/main.py
```

The backend server will start on `http://localhost:8000`.

### Starting the Frontend

You can use Python's built-in HTTP server:

```bash
# In a new terminal, navigate to the project directory
cd sestream

# Start a simple HTTP server
python -m http.server 8080
```

Then open your browser at http://localhost:8080

### Using the Application

1. Click "Start Recording" to begin and speak into your microphone
2. View transcriptions in real-time and observe the optimization metrics
3. Click "Stop Recording" when finished

## Optimization Metrics

The system tracks and displays several key metrics:

- **Total Audio**: The total duration of audio captured from your microphone
- **Processed Audio**: The actual duration of audio sent to OpenAI after optimization
- **Audio Saved**: The difference between total and processed audio
- **Optimization Percentage**: The percentage of audio that was filtered out

These metrics help you understand the system's efficiency and the potential cost savings.

## System Architecture

```
┌─────────────┐    WebSocket    ┌─────────────┐    API    ┌─────────────┐
│   Browser   │◄──────────────►│    Server    │◄────────►│   OpenAI    │
│  (Client)   │   (Audio data)  │  (Processing)│  (Audio)  │  (Whisper)  │
└─────────────┘                 └─────────────┘           └─────────────┘
```

## Technical Details

- The audio is captured at 16kHz (16-bit) mono PCM
- Voice Activity Detection uses the Silero VAD model
- Noise reduction is performed using the NoiseReduce library
- Transcription uses OpenAI's Whisper API
- The frontend is built with vanilla HTML, CSS, and JavaScript
- The backend uses FastAPI for the WebSocket and REST API endpoints

## License

MIT License
