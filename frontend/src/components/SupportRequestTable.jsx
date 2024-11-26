import React, { useState, useEffect } from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useToast,
  Badge,
  Box,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  Text,
  Textarea,
  Divider,
  HStack,
  Spinner,
  Center,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { ViewIcon } from '@chakra-ui/icons';
import axiosInstance from '../api/axiosConfig';

const SupportRequestTable = () => {
  const [supportRequests, setSupportRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const fetchSupportRequests = async () => {
    try {
      setError(null);
      setIsLoading(true);
      console.log('Fetching support requests...');
      
      // Remove the /api prefix since it's already in the baseURL
      const response = await axiosInstance.get('/privilege/support-requests');
      console.log('Full API Response:', response);
      
      if (response.data && Array.isArray(response.data.data)) {
        console.log('Support Requests Data:', response.data.data);
        setSupportRequests(response.data.data);
      } else {
        console.warn('Unexpected response structure:', response.data);
        setSupportRequests([]);
        setError('Unexpected response format from server');
      }
    } catch (error) {
      console.error('Error fetching support requests:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        request: error.request,
        config: error.config
      });
      
      setError(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch support requests'
      );
      
      toast({
        title: 'Error fetching support requests',
        description: error.response?.data?.message || error.message || 'Something went wrong',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSupportRequests();
  }, []);

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
    setNotes('');
  };

  const handleRequestAction = async (action) => {
    if (!notes.trim()) {
      toast({
        title: 'Notes Required',
        description: 'Please provide notes for this action',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Remove the /api prefix here as well
      const url = `/privilege/support-requests/${selectedRequest.id}/review`;
      const data = { action, notes };
      
      console.log('Sending review request...');
      console.log('Request URL:', url);
      console.log('Request Data:', data);
      
      const response = await axiosInstance.post(url, data);
      console.log('Review Response:', response);

      toast({
        title: 'Success',
        description: `Support request ${action}ed successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Refresh the data
      fetchSupportRequests();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error reviewing support request:', error);
      console.error('Error response:', error.response);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        request: error.request,
        config: error.config
      });
      toast({
        title: 'Error',
        description: error.response?.data?.message || `Failed to ${action} support request`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'yellow',
      accepted: 'green',
      rejected: 'red',
    };
    return colors[status] || 'gray';
  };

  if (isLoading) {
    return (
      <Center p={8}>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <Box overflowX="auto" bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
      {supportRequests.length === 0 ? (
        <Alert status="info">
          <AlertIcon />
          No support requests found
        </Alert>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>ID</Th>
              <Th>Help Request Title</Th>
              <Th>Requester</Th>
              <Th>Status</Th>
              <Th>Created At</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {supportRequests.map((request) => (
              <Tr key={request.id}>
                <Td>{request.id}</Td>
                <Td>{request.help_request_title}</Td>
                <Td>{request.requester_name}</Td>
                <Td>
                  <Badge colorScheme={getStatusColor(request.status)}>
                    {request.status}
                  </Badge>
                </Td>
                <Td>{new Date(request.created_at).toLocaleString()}</Td>
                <Td>
                  <IconButton
                    icon={<ViewIcon />}
                    aria-label="View details"
                    colorScheme="blue"
                    onClick={() => handleViewRequest(request)}
                    isDisabled={request.status !== 'pending'}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Review Support Request</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedRequest && (
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontWeight="bold">Help Request Title</Text>
                  <Text>{selectedRequest.help_request_title}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Requester</Text>
                  <Text>{selectedRequest.requester_name}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Status</Text>
                  <Badge colorScheme={getStatusColor(selectedRequest.status)}>
                    {selectedRequest.status}
                  </Badge>
                </Box>
                {selectedRequest.items && (
                  <Box>
                    <Text fontWeight="bold">Items</Text>
                    <VStack align="stretch" mt={2}>
                      {selectedRequest.items.map((item, index) => (
                        <Box key={index} p={2} borderWidth="1px" borderRadius="md">
                          <HStack justify="space-between">
                            <Text>{item.name}</Text>
                            <Text>Quantity Offered: {item.quantity_offered}</Text>
                          </HStack>
                          {item.notes && (
                            <Text fontSize="sm" mt={1} color="gray.600">
                              Notes: {item.notes}
                            </Text>
                          )}
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                )}
                <Divider />
                <Box>
                  <Text fontWeight="bold" mb={2}>Review Notes</Text>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter your review notes here..."
                    rows={4}
                  />
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="gray"
              mr={3}
              onClick={() => setIsModalOpen(false)}
              isDisabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              colorScheme="red"
              mr={3}
              onClick={() => handleRequestAction('reject')}
              isDisabled={isSubmitting}
            >
              Reject
            </Button>
            <Button
              colorScheme="green"
              onClick={() => handleRequestAction('accept')}
              isDisabled={isSubmitting}
            >
              Accept
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SupportRequestTable;
