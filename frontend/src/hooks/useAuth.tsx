import { createContext, useContext, useEffect, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../services/firebase';
import type { Veterinario } from '../types';

interface AuthContextType {
  user: Veterinario | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<Veterinario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setLoading(true);
      if (fUser) {
        setFirebaseUser(fUser);
        
        // Try to fetch or create the Veterinario doc in Firestore
        const vetDocRef = doc(db, 'veterinarios', fUser.uid);
        try {
          const vetDocSnap = await getDoc(vetDocRef);
          
          if (vetDocSnap.exists()) {
            const data = vetDocSnap.data();
            setUser({
              uid: data.uid,
              nombre: data.nombre,
              email: data.email,
              foto: data.foto,
              // Convert Firestore Timestamp to JS Date
              creadoEn: data.creadoEn?.toDate ? data.creadoEn.toDate() : new Date(data.creadoEn)
            });
          } else {
            // Create a new Veterinario record
            const newVet: Veterinario = {
              uid: fUser.uid,
              nombre: fUser.displayName || 'Veterinario',
              email: fUser.email || '',
              foto: fUser.photoURL || undefined,
              creadoEn: new Date()
            };
            await setDoc(vetDocRef, newVet);
            setUser(newVet);
          }
        } catch (error) {
          console.error('Error fetching or creating veterinarian record:', error);
          // Fallback user state if Firestore fails but Auth succeeded
          setUser({
            uid: fUser.uid,
            nombre: fUser.displayName || 'Veterinario',
            email: fUser.email || '',
            foto: fUser.photoURL || undefined,
            creadoEn: new Date()
          });
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error logging in with Google:', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
      setLoading(false);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
