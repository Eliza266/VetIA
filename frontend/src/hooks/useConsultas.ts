import { useState, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  orderBy 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebase';
import { useAuth } from './useAuth';
import type { Consulta } from '../types';
import { transcribeAudio } from '../services/whisper';
import { generateSOAP } from '../services/gemini';

export const useConsultas = () => {
  const { user } = useAuth();
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConsultasPorPaciente = useCallback(async (pacienteId: string) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, 'consultas'),
        where('pacienteId', '==', pacienteId),
        where('veterinarioId', '==', user.uid),
        orderBy('fechaHora', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const list: Consulta[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          pacienteId: data.pacienteId,
          veterinarioId: data.veterinarioId,
          fechaHora: data.fechaHora?.toDate ? data.fechaHora.toDate() : new Date(data.fechaHora),
          audioUrl: data.audioUrl,
          transcripcion: data.transcripcion,
          soap: data.soap,
          estado: data.estado,
          creadoEn: data.creadoEn?.toDate ? data.creadoEn.toDate() : new Date(data.creadoEn)
        } as Consulta);
      });
      setConsultas(list);
      return list;
    } catch (err: any) {
      console.error('Error fetching consultations:', err);
      setError('Error al cargar las consultas.');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchTodasConsultas = useCallback(async () => {
    if (!user) return [];
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, 'consultas'),
        where('veterinarioId', '==', user.uid),
        orderBy('fechaHora', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const list: Consulta[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          pacienteId: data.pacienteId,
          veterinarioId: data.veterinarioId,
          fechaHora: data.fechaHora?.toDate ? data.fechaHora.toDate() : new Date(data.fechaHora),
          audioUrl: data.audioUrl,
          transcripcion: data.transcripcion,
          soap: data.soap,
          estado: data.estado,
          creadoEn: data.creadoEn?.toDate ? data.creadoEn.toDate() : new Date(data.creadoEn)
        } as Consulta);
      });
      setConsultas(list);
      return list;
    } catch (err: any) {
      console.error('Error fetching all consultations:', err);
      setError('Error al cargar la lista general de consultas.');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getConsulta = async (id: string): Promise<Consulta | null> => {
    setError(null);
    try {
      const docRef = doc(db, 'consultas', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Security check
        if (data.veterinarioId !== user?.uid) {
          throw new Error('No tienes permiso para acceder a esta consulta.');
        }

        return {
          id: docSnap.id,
          pacienteId: data.pacienteId,
          veterinarioId: data.veterinarioId,
          fechaHora: data.fechaHora?.toDate ? data.fechaHora.toDate() : new Date(data.fechaHora),
          audioUrl: data.audioUrl,
          transcripcion: data.transcripcion,
          soap: data.soap,
          estado: data.estado,
          creadoEn: data.creadoEn?.toDate ? data.creadoEn.toDate() : new Date(data.creadoEn)
        } as Consulta;
      }
      return null;
    } catch (err: any) {
      console.error('Error fetching single consultation:', err);
      setError(err.message || 'Error al obtener la consulta.');
      return null;
    }
  };

  const crearConsulta = async (pacienteId: string): Promise<string | null> => {
    if (!user) {
      setError('Debes iniciar sesión para crear consultas.');
      return null;
    }
    setError(null);
    try {
      const nuevaConsulta: Omit<Consulta, 'id'> = {
        pacienteId,
        veterinarioId: user.uid,
        fechaHora: new Date(),
        estado: 'borrador',
        creadoEn: new Date()
      };
      
      const docRef = await addDoc(collection(db, 'consultas'), nuevaConsulta);
      return docRef.id;
    } catch (err: any) {
      console.error('Error creating consultation:', err);
      setError('Error al iniciar la consulta.');
      return null;
    }
  };

  const actualizarConsulta = async (id: string, campos: Partial<Consulta>): Promise<boolean> => {
    setError(null);
    try {
      const docRef = doc(db, 'consultas', id);
      await updateDoc(docRef, campos);
      return true;
    } catch (err: any) {
      console.error('Error updating consultation:', err);
      setError('Error al guardar la consulta.');
      return false;
    }
  };

  /**
   * Process recorded audio: Uploads to Firebase storage, transcribes with Whisper, and structures SOAP with Gemini.
   */
  const procesarAudioConsulta = async (consultaId: string, audioBlob: Blob): Promise<boolean> => {
    if (!user) return false;
    setError(null);
    
    try {
      // 1. Set status to processing
      await actualizarConsulta(consultaId, { estado: 'procesando' });

      // 2. Upload to Storage: audios/{veterinarioId}/{consultaId}
      const audioPath = `audios/${user.uid}/${consultaId}.webm`;
      const storageRef = ref(storage, audioPath);
      const uploadResult = await uploadBytes(storageRef, audioBlob);
      const downloadUrl = await getDownloadURL(uploadResult.ref);

      // Save audio url
      await actualizarConsulta(consultaId, { audioUrl: downloadUrl });

      // 3. Transcribe audio using Whisper
      let transcriptionText = '';
      try {
        transcriptionText = await transcribeAudio(audioBlob);
        await actualizarConsulta(consultaId, { transcripcion: transcriptionText });
      } catch (txErr) {
        console.error('Whisper transcription failed:', txErr);
        await actualizarConsulta(consultaId, { 
          estado: 'error', 
          transcripcion: 'Error durante la transcripción del audio.' 
        });
        throw txErr;
      }

      // 4. Generate SOAP using Gemini
      try {
        const soapResult = await generateSOAP(transcriptionText);
        await actualizarConsulta(consultaId, { 
          soap: soapResult,
          estado: 'borrador' // Default to draft for veterinarian review
        });
      } catch (geminiErr) {
        console.error('Gemini SOAP generation failed:', geminiErr);
        await actualizarConsulta(consultaId, { 
          estado: 'error'
        });
        throw geminiErr;
      }

      return true;
    } catch (err: any) {
      console.error('Error in complete audio processing flow:', err);
      setError(err.message || 'Error al procesar el audio e IA.');
      return false;
    }
  };

  return {
    consultas,
    loading,
    error,
    fetchConsultasPorPaciente,
    fetchTodasConsultas,
    getConsulta,
    crearConsulta,
    actualizarConsulta,
    procesarAudioConsulta
  };
};
