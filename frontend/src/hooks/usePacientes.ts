import { useState, useEffect, useCallback } from 'react';
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
import { db } from '../services/firebase';
import { useAuth } from './useAuth';
import type { Paciente } from '../types';

export const usePacientes = () => {
  const { user } = useAuth();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPacientes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, 'pacientes'),
        where('veterinarioId', '==', user.uid),
        orderBy('creadoEn', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const list: Paciente[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          ...data,
          creadoEn: data.creadoEn?.toDate ? data.creadoEn.toDate() : new Date(data.creadoEn)
        } as Paciente);
      });
      setPacientes(list);
    } catch (err: any) {
      console.error('Error fetching patients:', err);
      setError('Error al cargar la lista de pacientes.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load patients on mount / user change
  useEffect(() => {
    if (user) {
      fetchPacientes();
    } else {
      setPacientes([]);
    }
  }, [user, fetchPacientes]);

  const getPaciente = async (id: string): Promise<Paciente | null> => {
    setError(null);
    try {
      const docRef = doc(db, 'pacientes', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Security check: ensure this patient belongs to the logged-in vet
        if (data.veterinarioId !== user?.uid) {
          throw new Error('No tienes permiso para ver este paciente.');
        }

        return {
          id: docSnap.id,
          ...data,
          creadoEn: data.creadoEn?.toDate ? data.creadoEn.toDate() : new Date(data.creadoEn)
        } as Paciente;
      }
      return null;
    } catch (err: any) {
      console.error('Error fetching single patient:', err);
      setError(err.message || 'Error al cargar los datos del paciente.');
      return null;
    }
  };

  const agregarPaciente = async (nuevoPaciente: Omit<Paciente, 'veterinarioId' | 'creadoEn'>): Promise<string | null> => {
    if (!user) {
      setError('Debes iniciar sesión para agregar pacientes.');
      return null;
    }
    setError(null);
    try {
      const pacienteDoc: Omit<Paciente, 'id'> = {
        ...nuevoPaciente,
        veterinarioId: user.uid,
        creadoEn: new Date()
      };
      
      const docRef = await addDoc(collection(db, 'pacientes'), pacienteDoc);
      await fetchPacientes(); // Refresh list
      return docRef.id;
    } catch (err: any) {
      console.error('Error adding patient:', err);
      setError('Error al agregar el paciente.');
      return null;
    }
  };

  const actualizarPaciente = async (id: string, camposActualizados: Partial<Paciente>): Promise<boolean> => {
    setError(null);
    try {
      const docRef = doc(db, 'pacientes', id);
      await updateDoc(docRef, camposActualizados);
      await fetchPacientes(); // Refresh list
      return true;
    } catch (err: any) {
      console.error('Error updating patient:', err);
      setError('Error al actualizar los datos del paciente.');
      return false;
    }
  };

  return {
    pacientes,
    loading,
    error,
    fetchPacientes,
    getPaciente,
    agregarPaciente,
    actualizarPaciente
  };
};
