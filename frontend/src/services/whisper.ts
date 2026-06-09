import axios from 'axios';

/**
 * Transcribes an audio blob using OpenAI's Whisper API.
 * @param audioBlob The recorded audio blob (usually webm or wav)
 * @returns The transcribed text
 */
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API Key no configurada en las variables de entorno.');
  }

  const formData = new FormData();
  // Whisper accepts webm, mp3, wav, m4a, etc.
  // We use webm as default for MediaRecorder output
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-1');
  formData.append('language', 'es'); // Default to Spanish for VetIA

  try {
    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.text || '';
  } catch (error: any) {
    console.error('Error in Whisper transcription:', error);
    const details = error.response?.data?.error?.message || error.message;
    throw new Error(`Error al transcribir el audio: ${details}`);
  }
};
