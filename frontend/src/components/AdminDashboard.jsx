import React from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Button,
  useToast,
  Badge,
  Spacer,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Text,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import HelpRequestTable from './HelpRequestTable';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast({
      title: 'Logged out successfully',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <HStack spacing={4} pb={4}>
          <Heading size="lg">Admin Dashboard</Heading>
          <Spacer />
          <Badge colorScheme="red" fontSize="0.8em" p={2} borderRadius="lg">
            {user?.role?.toUpperCase()}
          </Badge>
          <Text>{user?.email}</Text>
          <Button colorScheme="red" size="sm" onClick={onOpen}>
            Logout
          </Button>
        </HStack>
        <Divider />

        <Tabs defaultIndex={0} isLazy>
          <TabList>
            <Tab>Help Requests</Tab>
            {/* Add more tabs here as needed */}
          </TabList>

          <TabPanels>
            <TabPanel>
              <HelpRequestTable />
            </TabPanel>
            {/* Add more TabPanels here as needed */}
          </TabPanels>
        </Tabs>

        {/* Logout Confirmation Modal */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Confirm Logout</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              Are you sure you want to logout?
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="gray" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={() => {
                onClose();
                handleLogout();
              }}>
                Logout
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  );
};

export default AdminDashboard;
