import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, extendTheme, ColorModeScript } from '@chakra-ui/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

// Custom theme with AMOLED dark mode default
const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  colors: {
    brand: {
      50: '#e3f2fd',
      100: '#bbdefb',
      200: '#90caf9',
      300: '#64b5f6',
      400: '#42a5f5',
      500: '#2196f3',
      600: '#1e88e5',
      700: '#1976d2',
      800: '#1565c0',
      900: '#0d47a1',
    },
    gray: {
      700: '#1a1a1a',
      800: '#121212',
      900: '#000000',
    }
  },
  styles: {
    global: {
      body: {
        bg: 'gray.900',
        color: 'white',
      },
    },
  },
  components: {
    Card: {
      baseStyle: {
        container: {
          backgroundColor: 'gray.800',
          borderColor: 'gray.700',
        }
      }
    },
    Input: {
      defaultProps: {
        focusBorderColor: 'brand.400',
      }
    },
    Select: {
      defaultProps: {
        focusBorderColor: 'brand.400',
      }
    },
    Textarea: {
      defaultProps: {
        focusBorderColor: 'brand.400',
      }
    }
  }
});

// Route guard for auth pages
const AuthRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

const App = () => (
  <>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route 
              path="/login" 
              element={
                <AuthRoute>
                  <LoginForm />
                </AuthRoute>
              } 
            />
            <Route 
              path="/signup" 
              element={
                <AuthRoute>
                  <SignupForm />
                </AuthRoute>
              } 
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/" 
              element={<Navigate to="/dashboard" replace />} 
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ChakraProvider>
  </>
);

export default App;
