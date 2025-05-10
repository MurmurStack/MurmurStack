import os
import logging
import tempfile
import torch
import torchaudio
import openai
from datetime import datetime
from typing import AsyncGenerator, Dict, Any
import asyncio

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('transcription')

class OpenAITranscriber:
    """
    A processor that uses OpenAI's Whisper API to transcribe audio.
    """
    
    def __init__(self, api_key: str = None, sample_rate: int = 16000, transcription_dir: str = "./transcriptions"):
        """
        Initialize the OpenAI transcriber.
        
        Args:
            api_key: OpenAI API key (if None, will use OPENAI_API_KEY environment variable)
            sample_rate: Sample rate of the audio
            transcription_dir: Directory to save transcription files
        """
        logger.info("Initializing OpenAI transcriber")
        
        # Set API key from parameter or environment variable
        if api_key:
            openai.api_key = api_key
        else:
            if 'OPENAI_API_KEY' not in os.environ:
                error_msg = "No OpenAI API key provided. Set OPENAI_API_KEY environment variable or pass api_key parameter."
                logger.error(error_msg)
                raise ValueError(error_msg)
            openai.api_key = os.environ['OPENAI_API_KEY']
            
        self.sample_rate = sample_rate
        
        # Create transcription directory if it doesn't exist
        self.transcription_dir = transcription_dir
        os.makedirs(self.transcription_dir, exist_ok=True)
        logger.info(f"Transcriptions will be saved to {self.transcription_dir}")
    
    async def transcribe_audio_tensor(self, audio_tensor: torch.Tensor) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Transcribe an audio tensor using OpenAI's Whisper API.
        
        Args:
            audio_tensor: Tensor containing audio data
            
        Yields:
            Dictionary containing transcription chunks and metadata
        """
        if audio_tensor.numel() == 0:
            logger.warning("Empty audio tensor, skipping transcription")
            yield {"status": "error", "message": "Empty audio tensor"}
            return
        
        try:
            # Create temporary WAV file
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
                temp_path = temp_file.name
                
                # Reshape tensor if needed to match torchaudio.save expectations
                if audio_tensor.dim() == 1:
                    audio_tensor = audio_tensor.unsqueeze(0)
                
                # Save tensor to WAV file
                torchaudio.save(temp_path, audio_tensor, self.sample_rate)
                
                logger.info(f"Sending audio to OpenAI Whisper API (file size: {os.path.getsize(temp_path)/1024:.2f} KB)")
                
                # Send to OpenAI for transcription
                with open(temp_path, "rb") as audio_file:
                    response = openai.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        response_format="text"
                    )
                
                transcription = response
                
                # Save the transcription to a file with timestamp
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                transcription_file = os.path.join(self.transcription_dir, f"transcription_{timestamp}.txt")
                
                with open(transcription_file, "w") as f:
                    f.write(transcription)
                
                logger.info(f"Transcription saved to {transcription_file}")
                
                # Clean up the temporary file
                os.unlink(temp_path)
                
                # Split transcription into words and stream them
                words = transcription.split()
                chunk_size = 1  # Number of words per chunk
                
                for i in range(0, len(words), chunk_size):
                    chunk = " ".join(words[i:i + chunk_size])
                    yield {
                        "status": "success",
                        "text": chunk,
                        "is_final": i + chunk_size >= len(words)
                    }
                    # Add a small delay between chunks to simulate streaming
                    await asyncio.sleep(0.1)
                
        except Exception as e:
            logger.error(f"Error transcribing audio: {e}", exc_info=True)
            yield {"status": "error", "message": str(e)} 