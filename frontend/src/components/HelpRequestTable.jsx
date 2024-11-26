import React, { useState, useEffect } from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Button,
  useToast,
  Box,
  Spinner,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Grid,
  GridItem,
  HStack,
  IconButton,
  useColorModeValue
} from '@chakra-ui/react';
import { ViewIcon } from '@chakra-ui/icons';
import axios from 'axios';

const HelpRequestTable = () => {
  const [helpRequests, setHelpRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const toast = useToast();

  // Color mode values
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    fetchHelpRequests();
  }, []);

  const fetchHelpRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/api/public/help-requests');
      setHelpRequests(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch help requests');
      toast({
        title: 'Error',
        description: 'Failed to fetch help requests',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      await axios.patch(`http://localhost:3000/api/help-requests/${requestId}`, {
        status: newStatus
      });
      
      // Refresh the table
      fetchHelpRequests();
      
      toast({
        title: 'Status Updated',
        description: 'Help request status has been updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update help request status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setIsDetailsModalOpen(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" p={4}>
        <Text color="red.500">{error}</Text>
      </Box>
    );
  }

  return (
    <>
      <Box overflowX="auto" bg={useColorModeValue('white', 'gray.800')} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>User</Th>
                <Th>Description</Th>
                <Th>Status</Th>
                <Th>Created At</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {helpRequests.map((request) => (
                <Tr key={request.id}>
                  <Td>{request.id}</Td>
                  <Td>{request.user_email}</Td>
                  <Td>{request.description}</Td>
                  <Td>
                    <Badge
                      colorScheme={
                        request.status === 'pending' ? 'yellow' :
                        request.status === 'in_progress' ? 'blue' :
                        request.status === 'resolved' ? 'green' : 'gray'
                      }
                    >
                      {request.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </Td>
                  <Td>{new Date(request.created_at).toLocaleString()}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        icon={<ViewIcon />}
                        colorScheme="blue"
                        variant="ghost"
                        aria-label="View details"
                        onClick={() => handleViewRequest(request)}
                      />
                      {request.status === 'pending' && (
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={() => handleStatusUpdate(request.id, 'in_progress')}
                        >
                          Start
                        </Button>
                      )}
                      {request.status === 'in_progress' && (
                        <Button
                          size="sm"
                          colorScheme="green"
                          onClick={() => handleStatusUpdate(request.id, 'resolved')}
                        >
                          Resolve
                        </Button>
                      )}
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>

      {/* Details Modal */}
      <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Request Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedRequest && (
              <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                <GridItem>
                  <Text fontWeight="bold" mb={2}>ID</Text>
                  <Text color={textColor}>{selectedRequest.id}</Text>
                </GridItem>
                <GridItem>
                  <Text fontWeight="bold" mb={2}>User</Text>
                  <Text color={textColor}>{selectedRequest.user_email}</Text>
                </GridItem>
                <GridItem>
                  <Text fontWeight="bold" mb={2}>Status</Text>
                  <Badge
                    colorScheme={
                      selectedRequest.status === 'pending' ? 'yellow' :
                      selectedRequest.status === 'in_progress' ? 'blue' :
                      selectedRequest.status === 'resolved' ? 'green' : 'gray'
                    }
                  >
                    {selectedRequest.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </GridItem>
                <GridItem>
                  <Text fontWeight="bold" mb={2}>Created At</Text>
                  <Text color={textColor}>
                    {new Date(selectedRequest.created_at).toLocaleString()}
                  </Text>
                </GridItem>
                <GridItem colSpan={2}>
                  <Text fontWeight="bold" mb={2}>Description</Text>
                  <Text color={textColor}>{selectedRequest.description}</Text>
                </GridItem>
                {selectedRequest.items_list && selectedRequest.items_list.length > 0 && (
                  <GridItem colSpan={2}>
                    <Text fontWeight="bold" mb={4}>Items</Text>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Item Name</Th>
                          <Th isNumeric>Quantity</Th>
                          <Th isNumeric>Received</Th>
                          <Th isNumeric>Needed</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {selectedRequest.items_list.map((item, index) => (
                          <Tr key={index}>
                            <Td>{item.name}</Td>
                            <Td isNumeric>{item.qty}</Td>
                            <Td isNumeric>{item.received_qty}</Td>
                            <Td isNumeric>{item.need_qty}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </GridItem>
                )}
              </Grid>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default HelpRequestTable;
