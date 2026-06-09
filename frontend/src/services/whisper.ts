const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const base64Audio = await blobToBase64(audioBlob);
  const base64Data = base64Audio.split(',')[1];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: 'audio/webm',
                data: base64Data
              }
            },
            {
              text: 'Transcribe exactamente lo que se dice en este audio de una consulta veterinaria. Solo devuelve la transcripción, sin comentarios adicionales.'
            }
          ]
        }]
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Error en transcripción: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
};

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}