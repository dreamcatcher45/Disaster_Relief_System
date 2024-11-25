import { createContext, useContext, useState, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';
import { setAuthToken } from '../api/auth';

const AuthContext = createContext(null);
const TOKEN_KEY = import.meta.env.VITE_JWT_KEY;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = Cookies.get(TOKEN_KEY);
    if (token) {
      try {
        setAuthToken(token);
        return jwtDecode(token);
      } catch (error) {
        Cookies.remove(TOKEN_KEY);
        setAuthToken(null);
        return null;
      }
    }
    return null;
  });

  const login = useCallback((token) => {
    Cookies.set(TOKEN_KEY, token, { 
      expires: 1, 
      secure: true,
      sameSite: 'strict'
    });
    setAuthToken(token);
    const decodedUser = jwtDecode(token);
    setUser(decodedUser);
  }, []);

  const logout = useCallback(() => {
    Cookies.remove(TOKEN_KEY);
    setAuthToken(null);
    setUser(null);
  }, []);

  const getToken = useCallback(() => {
    return Cookies.get(TOKEN_KEY);
  }, []);

  const value = {
    user,
    login,
    logout,
    getToken,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
