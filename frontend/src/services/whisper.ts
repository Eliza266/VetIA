import axios from 'axios';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Converts a Blob to a base64 string.
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const base64Data = reader.result.split(',')[1];
        resolve(base64Data);
      } else {
        reject(new Error('Error al convertir blob a base64'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
};

/**
 * Transcribes an audio blob using Gemini 1.5 Flash.
 * @param audioBlob The recorded audio blob (usually webm)
 * @returns The transcribed text
 */
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API Key no configurada en las variables de entorno.');
  }

  try {
    const base64Data = await blobToBase64(audioBlob);

    const payload = {
      contents: [
        {
          parts: [
            {
              text: "Transcribe exactamente lo que se dice en este audio de una consulta veterinaria. Solo devuelve la transcripción, sin comentarios adicionales."
            },
            {
              inlineData: {
                mimeType: "audio/webm",
                data: base64Data
              }
            }
          ]
        }
      ]
    };

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const candidates = response.data?.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No se recibió respuesta de Gemini.');
    }

    const textResponse = candidates[0].content?.parts?.[0]?.text;
    return textResponse ? textResponse.trim() : '';
  } catch (error: any) {
    console.error('Error in Gemini audio transcription:', error);
    const details = error.response?.data?.error?.message || error.message;
    throw new Error(`Error al transcribir el audio con Gemini: ${details}`);
  }
};