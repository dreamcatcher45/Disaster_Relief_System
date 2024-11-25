import { useState } from 'react';
import {
  Box,
  Button,
  Input,
  Select,
  Stack,
  Text,
  Heading,
  Alert,
} from '@chakra-ui/react';
import { register } from '../api/auth';
import { useNavigate } from 'react-router-dom';

const SignupForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await register(formData);
      navigate('/login');
    } catch (error) {
      setError(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={8} maxWidth="400px" mx="auto">
      <Stack spacing={4} as="form" onSubmit={handleSubmit}>
        <Heading>Sign Up</Heading>
        {error && (
          <Alert status="error">
            {error}
          </Alert>
        )}
        <Stack spacing={2}>
          <Text fontWeight="medium">Name</Text>
          <Input
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </Stack>
        <Stack spacing={2}>
          <Text fontWeight="medium">Email</Text>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </Stack>
        <Stack spacing={2}>
          <Text fontWeight="medium">Password</Text>
          <Input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </Stack>
        <Stack spacing={2}>
          <Text fontWeight="medium">Role</Text>
          <Select name="role" value={formData.role} onChange={handleChange} required>
            <option value="user">User</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
          </Select>
        </Stack>
        <Button
          type="submit"
          colorScheme="blue"
          width="full"
          isLoading={isLoading}
        >
          Sign Up
        </Button>
      </Stack>
    </Box>
  );
};

export default SignupForm;
