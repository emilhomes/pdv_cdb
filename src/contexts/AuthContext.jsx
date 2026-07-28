import { createContext, useState, useEffect } from 'react';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (userFirebase) => {
      if (userFirebase) {
        let perfil = 'funcionario';
        let nome = userFirebase.email;

        try {
          const docRef = doc(db, 'usuarios', userFirebase.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            perfil = docSnap.data().role || 'funcionario';
            nome = docSnap.data().nome || userFirebase.email;
          }
        } catch (e) {
          console.error("Erro ao buscar permissão", e);
        }

        setUsuario({
          uid: userFirebase.uid,
          email: userFirebase.email,
          nome: nome,
          role: perfil
        });
      } else {
        setUsuario(null);
      }
      setLoadingAuth(false);
    });

    return () => unsub();
  }, []);

  const login = async (email, senha) => {
    await signInWithEmailAndPassword(auth, email, senha);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ logado: !!usuario, usuario, login, logout, loadingAuth }}>
      {children}
    </AuthContext.Provider>
  );
}