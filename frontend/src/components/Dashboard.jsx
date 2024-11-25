import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  VStack as Stack,
  HStack,
  Text,
  Heading,
  Spinner,
  Badge,
  Alert,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // TODO: Implement API call to fetch dashboard data based on user role
        setIsLoading(false);
      } catch (error) {
        setError('Failed to load dashboard data');
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Stack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Box>
            <Heading size="lg">Welcome Back!</Heading>
            <Text mt={2}>
              Role: <Badge colorScheme="blue">{user?.role}</Badge>
            </Text>
          </Box>
          <Button colorScheme="red" onClick={handleLogout}>
            Logout
          </Button>
        </HStack>

        {error && (
          <Alert status="error">
            {error}
          </Alert>
        )}

        {/* TODO: Add role-specific dashboard content */}
        <Box p={6} borderWidth={1} borderRadius="lg">
          <Heading size="md" mb={4}>
            Dashboard Content
          </Heading>
          <Text>Your role-specific content will appear here.</Text>
        </Box>
      </Stack>
    </Container>
  );
};

export default Dashboard;
