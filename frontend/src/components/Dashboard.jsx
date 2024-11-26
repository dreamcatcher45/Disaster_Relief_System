import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  VStack,
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
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import { ViewIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getHelpRequests } from '../api/helpRequests';
import Cookies from 'js-cookie';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [helpRequests, setHelpRequests] = useState([]);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [supportFormData, setSupportFormData] = useState({
    notes: '',
    items: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userHelpRequests, setUserHelpRequests] = useState([]);
  const [userSupportRequests, setUserSupportRequests] = useState([]);
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'helpRequests', 'supportRequests'
  const toast = useToast();
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

  useEffect(() => {
    const fetchUserRequests = async () => {
      try {
        const token = Cookies.get(import.meta.env.VITE_JWT_KEY);
        if (!token) {
          throw new Error('Authentication token not found');
        }

        // Fetch help requests
        const helpResponse = await fetch('http://localhost:3000/api/user/help-requests', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!helpResponse.ok) throw new Error('Failed to fetch help requests');
        const helpData = await helpResponse.json();
        setUserHelpRequests(helpData.data);

        // Fetch support requests
        const supportResponse = await fetch('http://localhost:3000/api/user/support-requests', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!supportResponse.ok) throw new Error('Failed to fetch support requests');
        const supportData = await supportResponse.json();
        setUserSupportRequests(supportData.data);

      } catch (error) {
        console.error('Error fetching requests:', error);
        setError(error.message);
      }
    };

    fetchUserRequests();
  }, []);

  useEffect(() => {
    if (selectedRequest && selectedRequest.items_list) {
      console.log('Selected Request:', selectedRequest);
      console.log('Items List:', selectedRequest.items_list);
      
      setSupportFormData(prev => ({
        ...prev,
        items: selectedRequest.items_list
          .filter(item => item && item.request_item_id) 
          .map(item => ({
            request_item_id: item.request_item_id,
            name: item.name,
            quantity_offered: 0,
            notes: '',
            max_quantity: item.need_qty - (item.received_qty || 0)
          }))
      }));
    }
  }, [selectedRequest]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const onLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setViewMode('card');
  };

  const handleBackToTable = () => {
    setSelectedRequest(null);
    setViewMode('table');
  };

  const handleSupportSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      const validItems = supportFormData.items
        .filter(item => item && item.request_item_id && item.quantity_offered > 0);
      
      console.log('Valid Items:', validItems);
      
      if (validItems.length === 0) {
        throw new Error('Please offer at least one item');
      }

      const token = Cookies.get(import.meta.env.VITE_JWT_KEY);
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const requestPayload = {
        help_request_id: selectedRequest.id,
        items: validItems.map(item => ({
          request_item_id: parseInt(item.request_item_id),
          quantity_offered: parseInt(item.quantity_offered),
          notes: item.notes || ''
        })),
        notes: supportFormData.notes || ''
      };
      console.log('Support Request Payload:', requestPayload);

      const response = await fetch('http://localhost:3000/api/user/support-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create support request');
      }

      const responseData = await response.json();
      console.log('Support Request Response:', responseData);

      toast({
        title: 'Support Request Created',
        description: 'Your support request has been submitted successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      setIsSupportModalOpen(false);
      setSupportFormData({ notes: '', items: [] });
      
    } catch (error) {
      console.error('Support Request Error:', error);
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      if (error.message.toLowerCase().includes('token')) {
        logout();
        navigate('/login');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuantityChange = (index, value) => {
    setSupportFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index 
          ? { ...item, quantity_offered: parseInt(value) || 0 }
          : item
      )
    }));
  };

  const handleItemNotesChange = (index, value) => {
    setSupportFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index 
          ? { ...item, notes: value }
          : item
      )
    }));
  };

  const renderTableView = () => (
    <Card bg={cardBgColor} borderColor={borderColor} boxShadow="sm">
      <CardHeader>
        <Heading size="md" color={textColor}>Help Requests</Heading>
      </CardHeader>
      <CardBody>
        {helpRequests.length === 0 ? (
          <Text textAlign="center" py={10} color="gray.500">No help requests available</Text>
        ) : (
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
        )}
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
          <Button
            colorScheme="green"
            onClick={() => setIsSupportModalOpen(true)}
          >
            Extend Support
          </Button>
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
      <Modal isOpen={isSupportModalOpen} onClose={() => setIsSupportModalOpen(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Extend Support</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  value={supportFormData.notes}
                  onChange={(e) => setSupportFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any additional notes..."
                />
              </FormControl>
              <Divider />
              <Text fontWeight="bold" w="100%">Items</Text>
              {supportFormData.items.map((item, index) => (
                <Grid key={index} templateColumns="repeat(12, 1fr)" gap={4} w="100%">
                  <GridItem colSpan={4}>
                    <Text fontWeight="medium">{item.name}</Text>
                  </GridItem>
                  <GridItem colSpan={4}>
                    <FormControl>
                      <FormLabel>Quantity to Offer</FormLabel>
                      <NumberInput
                        min={0}
                        max={item.max_quantity}
                        value={item.quantity_offered}
                        onChange={(value) => handleQuantityChange(index, value)}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                  </GridItem>
                  <GridItem colSpan={4}>
                    <FormControl>
                      <FormLabel>Item Notes</FormLabel>
                      <Input
                        value={item.notes}
                        onChange={(e) => handleItemNotesChange(index, e.target.value)}
                        placeholder="Optional notes for this item"
                      />
                    </FormControl>
                  </GridItem>
                </Grid>
              ))}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsSupportModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              colorScheme="green" 
              onClick={handleSupportSubmit}
              isLoading={isSubmitting}
            >
              Submit Support
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );

  const renderHelpRequestsTable = () => (
    <Card>
      <CardHeader>
        <Heading size="md">My Help Requests</Heading>
      </CardHeader>
      <CardBody>
        {userHelpRequests.length === 0 ? (
          <Text textAlign="center" py={10} color="gray.500">You haven't created any help requests yet</Text>
        ) : (
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Title</Th>
                <Th>Status</Th>
                <Th>Priority</Th>
                <Th>Created At</Th>
                <Th>Items</Th>
                <Th>Support Count</Th>
              </Tr>
            </Thead>
            <Tbody>
              {userHelpRequests.map((request) => (
                <Tr key={request.id}>
                  <Td>{request.title}</Td>
                  <Td>
                    <Badge colorScheme={request.status === 'active' ? 'green' : 'gray'}>
                      {request.status}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge colorScheme={
                      request.priority === 'high' ? 'red' : 
                      request.priority === 'medium' ? 'yellow' : 'blue'
                    }>
                      {request.priority}
                    </Badge>
                  </Td>
                  <Td>{new Date(request.created_timestamp).toLocaleDateString()}</Td>
                  <Td>{request.items.length}</Td>
                  <Td>{request.support_request_count}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </CardBody>
    </Card>
  );

  const renderSupportRequestsTable = () => (
    <Card>
      <CardHeader>
        <Heading size="md">My Support Requests</Heading>
      </CardHeader>
      <CardBody>
        {userSupportRequests.length === 0 ? (
          <Text textAlign="center" py={10} color="gray.500">You haven't made any support requests yet</Text>
        ) : (
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Help Request</Th>
                <Th>Status</Th>
                <Th>Created At</Th>
                <Th>Items Offered</Th>
                <Th>Logistics Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {userSupportRequests.map((request) => (
                <Tr key={request.id}>
                  <Td>{request.help_request_title}</Td>
                  <Td>
                    <Badge colorScheme={
                      request.status === 'accepted' ? 'green' :
                      request.status === 'pending' ? 'yellow' : 'red'
                    }>
                      {request.status}
                    </Badge>
                  </Td>
                  <Td>{new Date(request.created_at).toLocaleDateString()}</Td>
                  <Td>{request.items.length}</Td>
                  <Td>
                    {request.latest_logistics ? (
                      <Badge colorScheme={
                        request.latest_logistics.new_status === 'received' ? 'green' : 'yellow'
                      }>
                        {request.latest_logistics.new_status}
                      </Badge>
                    ) : 'N/A'}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </CardBody>
    </Card>
  );

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
                colorScheme="blue"
                variant="solid"
                fontSize="sm"
                mt={2}
              >
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
              </Badge>
            </Box>
            <HStack spacing={2}>
              <Button
                colorScheme="blue"
                onClick={() => setActiveView('dashboard')}
                size="sm"
                variant={activeView === 'dashboard' ? 'solid' : 'outline'}
              >
                Dashboard
              </Button>
              <Button
                colorScheme="blue"
                onClick={() => setActiveView('helpRequests')}
                size="sm"
                variant={activeView === 'helpRequests' ? 'solid' : 'outline'}
              >
                My Help Requests
              </Button>
              <Button
                colorScheme="blue"
                onClick={() => setActiveView('supportRequests')}
                size="sm"
                variant={activeView === 'supportRequests' ? 'solid' : 'outline'}
              >
                My Support Requests
              </Button>
              <Button colorScheme="red" onClick={onLogoutClick} size="sm">
                Logout
              </Button>
            </HStack>
          </HStack>
          <Divider my={4} borderColor="gray.600" />
        </CardHeader>
        <CardBody>
          {error && (
            <Alert status="error" mb={4} borderRadius="md">
              {error}
            </Alert>
          )}
          {activeView === 'dashboard' && (viewMode === 'table' ? renderTableView() : renderCardView())}
          {activeView === 'helpRequests' && renderHelpRequestsTable()}
          {activeView === 'supportRequests' && renderSupportRequestsTable()}
        </CardBody>
      </Card>

      {/* Logout Confirmation Modal */}
      <Modal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)}>
        <ModalOverlay />
        <ModalContent bg="gray.800">
          <ModalHeader>Confirm Logout</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Are you sure you want to logout?
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" mr={3} onClick={() => setIsLogoutModalOpen(false)}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={() => {
              setIsLogoutModalOpen(false);
              handleLogout();
            }}>
              Logout
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default Dashboard;
