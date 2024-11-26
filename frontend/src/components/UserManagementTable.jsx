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
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  HStack,
  useColorModeValue
} from '@chakra-ui/react';
import Cookies from 'js-cookie';

const UserManagementTable = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModeratorModalOpen, setIsCreateModeratorModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = useState(false);
  const [moderatorForm, setModeratorForm] = useState({
    name: '',
    email: '',
    phone_number: '',
    address: '',
    password: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [newRole, setNewRole] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const toast = useToast();

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = Cookies.get(import.meta.env.VITE_JWT_KEY);
      
      let url = 'http://localhost:3000/api/admin/users';
      if (roleFilter !== 'all') {
        url += `?role=${roleFilter}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch users');
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const validateModeratorForm = () => {
    const errors = {};
    
    if (!moderatorForm.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!moderatorForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(moderatorForm.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!moderatorForm.phone_number.trim()) {
      errors.phone_number = 'Phone number is required';
    } else if (!/^\+?[\d\s-]{10,}$/.test(moderatorForm.phone_number)) {
      errors.phone_number = 'Phone number is invalid';
    }
    
    if (!moderatorForm.address.trim()) {
      errors.address = 'Address is required';
    }
    
    if (!moderatorForm.password) {
      errors.password = 'Password is required';
    } else if (moderatorForm.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateModerator = async () => {
    if (!validateModeratorForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please check the form for errors',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const token = Cookies.get(import.meta.env.VITE_JWT_KEY);
      const response = await fetch('http://localhost:3000/api/admin/create-moderator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(moderatorForm)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create moderator');
      }

      toast({
        title: 'Success',
        description: 'Moderator created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setIsCreateModeratorModalOpen(false);
      setModeratorForm({
        name: '',
        email: '',
        phone_number: '',
        address: '',
        password: ''
      });
      setFormErrors({});
      fetchUsers();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleChangeRole = async () => {
    try {
      const token = Cookies.get(import.meta.env.VITE_JWT_KEY);
      const response = await fetch(`http://localhost:3000/api/admin/users/${selectedUser.ref_id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ new_role: newRole })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update role');
      }

      toast({
        title: 'Success',
        description: 'User role updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setIsChangeRoleModalOpen(false);
      setSelectedUser(null);
      setNewRole('');
      fetchUsers();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const closeModeratorModal = () => {
    setIsCreateModeratorModalOpen(false);
    setModeratorForm({
      name: '',
      email: '',
      phone_number: '',
      address: '',
      password: ''
    });
    setFormErrors({});
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
      <Box bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
        <HStack p={4} justify="space-between">
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            w="200px"
          >
            <option value="all">All Users</option>
            <option value="user">Users</option>
            <option value="moderator">Moderators</option>
          </Select>
          <Button
            colorScheme="blue"
            onClick={() => setIsCreateModeratorModalOpen(true)}
          >
            Create Moderator
          </Button>
        </HStack>

        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th>Role</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map((user) => (
                <Tr key={user.ref_id}>
                  <Td>{user.name}</Td>
                  <Td>{user.email}</Td>
                  <Td>{user.phone_number}</Td>
                  <Td>
                    <Badge
                      colorScheme={
                        user.role === 'admin' ? 'red' :
                        user.role === 'moderator' ? 'green' : 'blue'
                      }
                    >
                      {user.role.toUpperCase()}
                    </Badge>
                  </Td>
                  <Td>
                    <Button
                      size="sm"
                      colorScheme="purple"
                      onClick={() => {
                        setSelectedUser(user);
                        setNewRole(user.role);
                        setIsChangeRoleModalOpen(true);
                      }}
                    >
                      Change Role
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>

      {/* Create Moderator Modal */}
      <Modal
        isOpen={isCreateModeratorModalOpen}
        onClose={closeModeratorModal}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Moderator</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired isInvalid={formErrors.name}>
                <FormLabel>Name</FormLabel>
                <Input
                  value={moderatorForm.name}
                  onChange={(e) => setModeratorForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                />
                {formErrors.name && (
                  <Text color="red.500" fontSize="sm">{formErrors.name}</Text>
                )}
              </FormControl>
              <FormControl isRequired isInvalid={formErrors.email}>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={moderatorForm.email}
                  onChange={(e) => setModeratorForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
                {formErrors.email && (
                  <Text color="red.500" fontSize="sm">{formErrors.email}</Text>
                )}
              </FormControl>
              <FormControl isRequired isInvalid={formErrors.phone_number}>
                <FormLabel>Phone Number</FormLabel>
                <Input
                  value={moderatorForm.phone_number}
                  onChange={(e) => setModeratorForm(prev => ({ ...prev, phone_number: e.target.value }))}
                  placeholder="Enter phone number"
                />
                {formErrors.phone_number && (
                  <Text color="red.500" fontSize="sm">{formErrors.phone_number}</Text>
                )}
              </FormControl>
              <FormControl isRequired isInvalid={formErrors.address}>
                <FormLabel>Address</FormLabel>
                <Input
                  value={moderatorForm.address}
                  onChange={(e) => setModeratorForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter address"
                />
                {formErrors.address && (
                  <Text color="red.500" fontSize="sm">{formErrors.address}</Text>
                )}
              </FormControl>
              <FormControl isRequired isInvalid={formErrors.password}>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  value={moderatorForm.password}
                  onChange={(e) => setModeratorForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password"
                />
                {formErrors.password && (
                  <Text color="red.500" fontSize="sm">{formErrors.password}</Text>
                )}
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeModeratorModal}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleCreateModerator}>
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Change Role Modal */}
      <Modal
        isOpen={isChangeRoleModalOpen}
        onClose={() => setIsChangeRoleModalOpen(false)}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Change User Role</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>New Role</FormLabel>
              <Select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
              </Select>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsChangeRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleChangeRole}>
              Update Role
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default UserManagementTable;
