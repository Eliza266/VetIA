import axios from 'axios';
import type { SOAP } from '../types';

/**
 * Generates a SOAP structure from a clinical transcription using Gemini.
 * @param transcription The text transcription of the veterinary consultation
 * @returns The structured SOAP object
 */
export const generateSOAP = async (transcription: string): Promise<SOAP> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API Key no configurada en las variables de entorno.');
  }

  const prompt = `Eres un asistente clínico veterinario experto. Analiza la siguiente transcripción de una consulta veterinaria y genera una nota clínica estructurada en formato SOAP en español.

INSTRUCCIONES:
- Usa ÚNICAMENTE la información presente en la transcripción
- No inventes datos que no se mencionaron
- Usa terminología veterinaria clínica apropiada
- Si no hay información para un campo escribe "No reportado en la consulta"
- En el Plan incluye medicamentos con nombre, dosis, vía de administración, frecuencia y duración
- En medicamentosSugeridos sugiere medicamentos veterinarios apropiados basándote en el análisis clínico, incluso si no se mencionaron explícitamente en la transcripción
- Sé conciso pero completo

Devuelve ÚNICAMENTE un objeto JSON válido sin comentarios ni backticks:
{"subjetivo":"...","objetivo":"...","analisis":"...","plan":"...","medicamentosSugeridos":[{"nombre":"...","dosis":"...","via":"...","frecuencia":"...","duracion":"...","indicacion":"..."}]}

Transcripción:
"${transcription}"
`;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const candidates = response.data?.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No se recibió respuesta de Gemini.');
    }

    let textResponse = candidates[0].content?.parts?.[0]?.text || '';
    
    // Clean up Markdown backticks if Gemini ignored the instruction
    textResponse = textResponse.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();

    const soap: SOAP = JSON.parse(textResponse);
    return {
      subjetivo: soap.subjetivo || '',
      objetivo: soap.objetivo || '',
      analisis: soap.analisis || '',
      plan: soap.plan || '',
      medicamentosSugeridos: soap.medicamentosSugeridos || []
    };
  } catch (error: any) {
    console.error('Error in Gemini service:', error);
    // Return a fallback structure in case of JSON parsing or API failure
    return {
      subjetivo: `Error al procesar con IA. Transcripción original: ${transcription}`,
      objetivo: 'No se pudo generar automáticamente.',
      analisis: 'No se pudo generar automáticamente.',
      plan: 'No se pudo generar automáticamente.',
      medicamentosSugeridos: []
    };
  }
};
