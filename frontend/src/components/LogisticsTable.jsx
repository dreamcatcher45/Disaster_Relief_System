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
  Select,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { ViewIcon } from '@chakra-ui/icons';
import axiosInstance from '../api/axiosConfig';

const LogisticsTable = () => {
  const [supportRequests, setSupportRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logisticsHistory, setLogisticsHistory] = useState([]);
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const fetchSupportRequests = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await axiosInstance.get('/privilege/support-requests');
      if (response.data && Array.isArray(response.data.data)) {
        setSupportRequests(response.data.data.filter(req => req.status === 'accepted'));
      } else {
        setError('Unexpected response format from server');
      }
    } catch (error) {
      console.error('Error fetching support requests:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch support requests');
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

  const fetchLogisticsHistory = async (supportRequestId) => {
    try {
      const response = await axiosInstance.get('/privilege/logistics/history', {
        params: { support_request_id: supportRequestId }
      });
      if (response.data && Array.isArray(response.data.data)) {
        setLogisticsHistory(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching logistics history:', error);
      toast({
        title: 'Error fetching history',
        description: error.response?.data?.message || 'Failed to fetch logistics history',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchSupportRequests();
  }, []);

  const handleViewRequest = async (request) => {
    setSelectedRequest(request);
    setNewStatus('');
    setNotes('');
    setIsModalOpen(true);
    await fetchLogisticsHistory(request.id);
  };

  const getStatusColor = (status) => {
    const colors = {
      accepted: 'yellow',
      received: 'blue',
      delivered: 'purple',
      completed: 'green',
    };
    return colors[status] || 'gray';
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      toast({
        title: 'Status Required',
        description: 'Please select a new status',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!notes.trim()) {
      toast({
        title: 'Notes Required',
        description: 'Please provide notes for this status update',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await axiosInstance.post(`/privilege/logistics/${selectedRequest.id}/status`, {
        new_status: newStatus,
        notes: notes
      });

      toast({
        title: 'Success',
        description: 'Logistics status updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Refresh the data
      await fetchSupportRequests();
      await fetchLogisticsHistory(selectedRequest.id);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error updating logistics status:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update logistics status',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
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
          No accepted support requests found
        </Alert>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>ID</Th>
              <Th>Help Request Title</Th>
              <Th>Requester</Th>
              <Th>Logistics Status</Th>
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
                  <Badge colorScheme={getStatusColor(request.logistic_status || 'accepted')}>
                    {request.logistic_status || 'accepted'}
                  </Badge>
                </Td>
                <Td>{new Date(request.created_at).toLocaleString()}</Td>
                <Td>
                  <IconButton
                    icon={<ViewIcon />}
                    aria-label="View details"
                    colorScheme="blue"
                    onClick={() => handleViewRequest(request)}
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
          <ModalHeader>Update Logistics Status</ModalHeader>
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
                  <Text fontWeight="bold">Current Status</Text>
                  <Badge colorScheme={getStatusColor(selectedRequest.logistic_status || 'accepted')}>
                    {selectedRequest.logistic_status || 'accepted'}
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
                            <Text>Quantity: {item.quantity_offered}</Text>
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                )}
                <Divider />
                <Box>
                  <Text fontWeight="bold" mb={2}>Logistics History</Text>
                  <VStack align="stretch" spacing={2}>
                    {logisticsHistory.map((history, index) => (
                      <Box key={index} p={2} borderWidth="1px" borderRadius="md">
                        <HStack justify="space-between" mb={1}>
                          <Badge colorScheme={getStatusColor(history.new_status)}>
                            {history.new_status}
                          </Badge>
                          <Text fontSize="sm">{new Date(history.created_at).toLocaleString()}</Text>
                        </HStack>
                        <Text fontSize="sm">Notes: {history.notes}</Text>
                      </Box>
                    ))}
                  </VStack>
                </Box>
                <Divider />
                <FormControl>
                  <FormLabel>Update Status</FormLabel>
                  <Select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    placeholder="Select new status"
                  >
                    <option value="received">Received</option>
                    <option value="delivered">Delivered</option>
                    <option value="completed">Completed</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Notes</FormLabel>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter notes for this status update..."
                    rows={4}
                  />
                </FormControl>
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
              colorScheme="blue"
              onClick={handleUpdateStatus}
              isDisabled={isSubmitting}
              isLoading={isSubmitting}
            >
              Update Status
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default LogisticsTable;
