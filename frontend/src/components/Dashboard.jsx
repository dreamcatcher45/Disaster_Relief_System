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
  IconButton,
  Grid,
  GridItem,
  List,
  ListItem,
  Divider,
} from '@chakra-ui/react';
import { ViewIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getHelpRequests } from '../api/helpRequests';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [helpRequests, setHelpRequests] = useState([]);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
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

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setViewMode('card');
  };

  const handleBackToTable = () => {
    setSelectedRequest(null);
    setViewMode('table');
  };

  if (isLoading) {
    return (
      <Container centerContent>
        <Spinner size="xl" />
      </Container>
    );
  }

  const renderTableView = () => (
    <Card bg={cardBgColor} borderColor={borderColor} boxShadow="sm">
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
              <Th color={textColor}>Actions</Th>
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
                <Td>
                  <IconButton
                    icon={<ViewIcon />}
                    colorScheme="blue"
                    aria-label="View details"
                    onClick={() => handleViewRequest(request)}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </CardBody>
    </Card>
  );

  const renderCardView = () => (
    <Card bg={cardBgColor} borderColor={borderColor} boxShadow="sm">
      <CardHeader>
        <HStack justify="space-between" align="center">
          <Button
            leftIcon={<ArrowBackIcon />}
            onClick={handleBackToTable}
            colorScheme="blue"
            variant="ghost"
          >
            Back to Table
          </Button>
          <Heading size="md" color={textColor}>Request Details</Heading>
        </HStack>
      </CardHeader>
      <CardBody>
        <Grid templateColumns="repeat(2, 1fr)" gap={6}>
          <GridItem>
            <Text fontWeight="bold" mb={2}>ID</Text>
            <Text color={textColor}>{selectedRequest.id}</Text>
          </GridItem>
          <GridItem>
            <Text fontWeight="bold" mb={2}>Title</Text>
            <Text color={textColor}>{selectedRequest.title}</Text>
          </GridItem>
          <GridItem>
            <Text fontWeight="bold" mb={2}>Status</Text>
            <Badge
              colorScheme={
                selectedRequest.status === 'pending'
                  ? 'yellow'
                  : selectedRequest.status === 'approved'
                  ? 'green'
                  : 'red'
              }
            >
              {selectedRequest.status}
            </Badge>
          </GridItem>
          <GridItem>
            <Text fontWeight="bold" mb={2}>Created At</Text>
            <Text color={textColor}>
              {new Date(selectedRequest.created_timestamp).toLocaleString()}
            </Text>
          </GridItem>
          {selectedRequest.description && (
            <GridItem colSpan={2}>
              <Text fontWeight="bold" mb={2}>Description</Text>
              <Text color={textColor}>{selectedRequest.description}</Text>
            </GridItem>
          )}
          <GridItem colSpan={2}>
            <Divider my={4} />
            <Text fontWeight="bold" mb={4}>Items ({selectedRequest.items_list?.length || 0})</Text>
            {selectedRequest.items_list && selectedRequest.items_list.length > 0 ? (
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th color={textColor}>Item Name</Th>
                    <Th color={textColor} isNumeric>Quantity</Th>
                    <Th color={textColor} isNumeric>Received</Th>
                    <Th color={textColor} isNumeric>Needed</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {selectedRequest.items_list.map((item, index) => (
                    <Tr key={index}>
                      <Td color={textColor}>{item.name}</Td>
                      <Td color={textColor} isNumeric>{item.qty}</Td>
                      <Td color={textColor} isNumeric>{item.received_qty}</Td>
                      <Td color={textColor} isNumeric>{item.need_qty}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            ) : (
              <Text color={textColor}>No items found</Text>
            )}
          </GridItem>
        </Grid>
      </CardBody>
    </Card>
  );

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
          {viewMode === 'table' ? renderTableView() : renderCardView()}
        </CardBody>
      </Card>
    </Container>
  );
};

export default Dashboard;
