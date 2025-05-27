// types.ts
import { createContext } from 'react';

export interface AuthContextType {
  /**
   * Chama quando o usuário faz login: 
   * recebe o token e atualiza o estado global/contexto
   */
  signIn: (token: string) => void;
  /**
   * Chama quando o usuário faz logout:
   * remove o token e volta para a tela de Login
   */
  signOut: () => void;
}

/**
 * Contexto de autenticação padrão.
 * Você pode importar daqui em todas as telas:
 * import { AuthContext } from '../types';
 */
export const AuthContext = createContext<AuthContextType>({
  signIn: () => {},
  signOut: () => {},
});
