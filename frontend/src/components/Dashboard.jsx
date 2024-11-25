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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Card,
  CardHeader,
  CardBody,
  useColorModeValue,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getHelpRequests } from '../api/helpRequests';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [helpRequests, setHelpRequests] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBgColor = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    const fetchHelpRequests = async () => {
      try {
        const data = await getHelpRequests();
        setHelpRequests(data);
        setIsLoading(false);
      } catch (error) {
        setError('Failed to load help requests');
        setIsLoading(false);
      }
    };

    fetchHelpRequests();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <Container centerContent>
        <Spinner size="xl" />
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={5}>
      <Card mb={5} bg={cardBgColor} borderColor={borderColor} boxShadow="md">
        <CardHeader>
          <HStack justify="space-between" align="center">
            <Box>
              <Heading size="md" color={textColor}>Welcome, {user?.name || 'User'}</Heading>
              <Badge 
                colorScheme={user?.role === 'admin' ? 'red' : user?.role === 'moderator' ? 'purple' : 'green'}
                fontSize="sm"
                mt={2}
              >
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
              </Badge>
            </Box>
            <Button colorScheme="red" onClick={handleLogout}>
              Logout
            </Button>
          </HStack>
        </CardHeader>
        <CardBody>
          {error && (
            <Alert status="error" mb={4} borderRadius="md">
              {error}
            </Alert>
          )}
          <Card bg={bgColor} borderColor={borderColor} boxShadow="sm">
            <CardHeader>
              <Heading size="md" color={textColor}>Help Requests</Heading>
            </CardHeader>
            <CardBody>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th color={textColor}>ID</Th>
                    <Th color={textColor}>Title</Th>
                    <Th color={textColor}>Status</Th>
                    <Th color={textColor}>Created At</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {helpRequests.map((request) => (
                    <Tr key={request.id}>
                      <Td color={textColor}>{request.id}</Td>
                      <Td color={textColor}>{request.title}</Td>
                      <Td>
                        <Badge
                          colorScheme={
                            request.status === 'pending'
                              ? 'yellow'
                              : request.status === 'approved'
                              ? 'green'
                              : 'red'
                          }
                        >
                          {request.status}
                        </Badge>
                      </Td>
                      <Td color={textColor}>
                        {new Date(request.created_timestamp).toLocaleDateString()}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        </CardBody>
      </Card>
    </Container>
  );
};

export default Dashboard;
