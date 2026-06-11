import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './useAuth';
import type { Brigada } from '../types';

export const useBrigadas = () => {
  const { user } = useAuth();
  const [brigadas, setBrigadas] = useState<Brigada[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const listarBrigadas = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, 'brigadas'),
        where('veterinarioIds', 'array-contains', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const list: Brigada[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          ...data,
          creadoEn: data.creadoEn?.toDate ? data.creadoEn.toDate() : new Date(data.creadoEn)
        } as Brigada);
      });
      list.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setBrigadas(list);
      return list;
    } catch (err: any) {
      console.error('Error listing brigadas:', err);
      setError('Error al cargar la lista de brigadas.');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load brigadas on mount / user change
  useEffect(() => {
    if (user) {
      listarBrigadas();
    } else {
      setBrigadas([]);
    }
  }, [user, listarBrigadas]);

  const getBrigada = async (id: string): Promise<Brigada | null> => {
    setError(null);
    try {
      const docRef = doc(db, 'brigadas', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const vIds: string[] = data.veterinarioIds || [];
        
        // Security check: ensure this vet is part of this brigada
        if (!vIds.includes(user?.uid || '')) {
          throw new Error('No tienes permiso para ver esta brigada.');
        }

        return {
          id: docSnap.id,
          ...data,
          creadoEn: data.creadoEn?.toDate ? data.creadoEn.toDate() : new Date(data.creadoEn)
        } as Brigada;
      }
      return null;
    } catch (err: any) {
      console.error('Error fetching single brigada:', err);
      setError(err.message || 'Error al cargar los datos de la brigada.');
      return null;
    }
  };

  const crearBrigada = async (nuevaBrigada: Omit<Brigada, 'creadoEn'>): Promise<string | null> => {
    if (!user) {
      setError('Debes iniciar sesión para crear brigadas.');
      return null;
    }
    setError(null);
    try {
      // Ensure the current user's UID is in the list of veterinarians
      const vIds = nuevaBrigada.veterinarioIds || [];
      if (!vIds.includes(user.uid)) {
        vIds.push(user.uid);
      }

      const brigadaDoc: Omit<Brigada, 'id'> = {
        ...nuevaBrigada,
        veterinarioIds: vIds,
        creadoEn: new Date()
      };
      
      const docRef = await addDoc(collection(db, 'brigadas'), brigadaDoc);
      await listarBrigadas(); // Refresh list
      return docRef.id;
    } catch (err: any) {
      console.error('Error adding brigada:', err);
      setError('Error al agregar la brigada.');
      return null;
    }
  };

  const actualizarBrigada = async (id: string, camposActualizados: Partial<Brigada>): Promise<boolean> => {
    setError(null);
    try {
      const docRef = doc(db, 'brigadas', id);
      await updateDoc(docRef, camposActualizados);
      await listarBrigadas(); // Refresh list
      return true;
    } catch (err: any) {
      console.error('Error updating brigada:', err);
      setError('Error al actualizar los datos de la brigada.');
      return false;
    }
  };

  return {
    brigadas,
    loading,
    error,
    listarBrigadas,
    getBrigada,
    crearBrigada,
    actualizarBrigada
  };
};
