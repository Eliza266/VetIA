import axios from 'axios';
import type { SOAP } from '../types';

/**
 * Generates a SOAP structure from a clinical transcription using Gemini.
 * @param transcription The text transcription of the veterinary consultation
 * @returns The structured SOAP object
 */
export const generateSOAP = async (transcription: string): Promise<any> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API Key no configurada en las variables de entorno.');
  }

  const prompt = `Eres un asistente clínico veterinario experto. Analiza la transcripción de una consulta veterinaria y extrae toda la información disponible.

INSTRUCCIONES:
- Usa ÚNICAMENTE la información presente en la transcripción
- No inventes datos que no se mencionaron
- Si un dato no se menciona, usa null
- Usa terminología veterinaria clínica apropiada
- En el Plan incluye medicamentos con nombre, dosis, vía, frecuencia y duración

Devuelve ÚNICAMENTE un objeto JSON válido sin comentarios ni backticks:
{
  "motivo": "motivo principal de la consulta en una línea",
  "prioridad": "urgente|rutina|seguimiento|brigada",
  "signosVitales": {
    "peso": null,
    "temperatura": null,
    "frecuenciaCardiaca": null,
    "frecuenciaRespiratoria": null,
    "condicionCorporal": null
  },
  "subjetivo": "síntomas y anamnesis reportados",
  "objetivo": "hallazgos del examen físico",
  "analisis": "diagnóstico presuntivo o diferencial",
  "plan": "tratamiento completo con medicamentos y dosis",
  "medicamentosSugeridos": [
    {
      "nombre": "",
      "dosis": "",
      "via": "",
      "frecuencia": "",
      "duracion": "",
      "indicacion": ""
    }
  ]
}

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
    
    console.log('[VetIA] Respuesta raw de Gemini:', textResponse);

    try {
      // Intento 1: extraer JSON con regex
      const match = textResponse.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
      
      // Clean up fallback
      textResponse = textResponse.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      return JSON.parse(textResponse);
    } catch (parseError) {
      console.warn('[VetIA] Error parseando JSON, intentando con prompt simplificado...', parseError);
      
      const simplePrompt = `Extrae esta transcripción en un objeto JSON con este formato estricto sin texto adicional: {"motivo":"","prioridad":"rutina","signosVitales":{},"subjetivo":"","objetivo":"","analisis":"","plan":"","medicamentosSugeridos":[]}. Transcripción: "${transcription}"`;
      
      const retryResponse = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: simplePrompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      const retryText = retryResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log('[VetIA] Respuesta raw (reintento):', retryText);
      const matchRetry = retryText.match(/\{[\s\S]*\}/);
      const jsonStr = matchRetry ? matchRetry[0] : retryText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      
      return JSON.parse(jsonStr);
    }
  } catch (error: any) {
    console.error('Error in Gemini service:', error);
    // Return a fallback structure with the full transcription in subjetivo
    return {
      motivo: "Consulta registrada (no estructurada)",
      prioridad: "rutina",
      signosVitales: {},
      subjetivo: transcription,
      objetivo: '',
      analisis: '',
      plan: '',
      medicamentosSugeridos: []
    };
  }
};
