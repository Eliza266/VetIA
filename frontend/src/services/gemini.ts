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

  const prompt = `
Eres un asistente veterinario experto de VetIA. Tu tarea es analizar la transcripción de una consulta clínica veterinaria y estructurarla en el formato SOAP (Subjetivo, Objetivo, Análisis, Plan) en idioma español.

La estructura debe ser la siguiente:
- Subjetivo (S): Motivo de consulta, historia clínica contada por el dueño, síntomas reportados, actitud del paciente, etc.
- Objetivo (O): Resultados del examen físico, constantes fisiológicas (frecuencia cardíaca, respiratoria, temperatura, peso), hallazgos medibles u observables.
- Análisis (A): Diagnóstico presuntivo, diagnósticos diferenciales, evaluación clínica basada en S y O.
- Plan (P): Tratamiento médico, dosis recomendadas, exámenes complementarios solicitados, recomendaciones para el hogar y fecha de próxima revisión.

Por favor, devuelve el resultado ÚNICAMENTE como un objeto JSON válido con las siguientes propiedades: "subjetivo", "objetivo", "analisis" y "plan".
No agregues comentarios ni explicaciones adicionales. No envuelvas el JSON en bloques markdown (como \`\`\`json). Devuelve únicamente la cadena JSON pura.

Transcripción de la consulta:
"${transcription}"
`;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
      plan: soap.plan || ''
    };
  } catch (error: any) {
    console.error('Error in Gemini service:', error);
    // Return a fallback structure in case of JSON parsing or API failure
    return {
      subjetivo: `Error al procesar con IA. Transcripción original: ${transcription}`,
      objetivo: 'No se pudo generar automáticamente.',
      analisis: 'No se pudo generar automáticamente.',
      plan: 'No se pudo generar automáticamente.'
    };
  }
};
