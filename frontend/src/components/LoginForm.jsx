import { useState } from 'react';
import {
  Box,
  Button,
  Input,
  Stack,
  Text,
  Heading,
  Alert,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { login } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (role) => {
    setIsLoading(true);
    setError('');

    try {
      const loginData = {
        password,
        role,
        ...(role === 'user' ? { phoneNumber } : { email })
      };
      const response = await login(loginData);
      authLogin(response.token);
      navigate('/dashboard');
    } catch (error) {
      setError(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = () => {
    // Clear fields when switching tabs
    setEmail('');
    setPhoneNumber('');
    setPassword('');
    setError('');
  };

  return (
    <Box p={8} maxWidth="400px" mx="auto">
      <Stack spacing={4}>
        <Heading textAlign="center" mb={4}>Login</Heading>
        {error && (
          <Alert status="error">
            {error}
          </Alert>
        )}
        <Tabs isFitted variant="enclosed" onChange={handleTabChange}>
          <TabList mb="1em">
            <Tab>User</Tab>
            <Tab>Admin</Tab>
            <Tab>Moderator</Tab>
          </TabList>
          <TabPanels>
            {/* User Panel */}
            <TabPanel>
              <Stack spacing={4} as="form" onSubmit={(e) => {
                e.preventDefault();
                handleSubmit('user');
              }}>
                <Stack spacing={2}>
                  <Text fontWeight="medium">Phone Number</Text>
                  <Input
                    type="tel"
                    placeholder="Enter phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    pattern="[0-9]*"
                    required
                  />
                </Stack>
                <Stack spacing={2}>
                  <Text fontWeight="medium">Password</Text>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Stack>
                <Button
                  type="submit"
                  colorScheme="blue"
                  width="full"
                  isLoading={isLoading}
                >
                  Login as User
                </Button>
              </Stack>
            </TabPanel>

            {/* Admin Panel */}
            <TabPanel>
              <Stack spacing={4} as="form" onSubmit={(e) => {
                e.preventDefault();
                handleSubmit('admin');
              }}>
                <Stack spacing={2}>
                  <Text fontWeight="medium">Email</Text>
                  <Input
                    type="email"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Stack>
                <Stack spacing={2}>
                  <Text fontWeight="medium">Password</Text>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Stack>
                <Button
                  type="submit"
                  colorScheme="blue"
                  width="full"
                  isLoading={isLoading}
                >
                  Login as Admin
                </Button>
              </Stack>
            </TabPanel>

            {/* Moderator Panel */}
            <TabPanel>
              <Stack spacing={4} as="form" onSubmit={(e) => {
                e.preventDefault();
                handleSubmit('moderator');
              }}>
                <Stack spacing={2}>
                  <Text fontWeight="medium">Email</Text>
                  <Input
                    type="email"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Stack>
                <Stack spacing={2}>
                  <Text fontWeight="medium">Password</Text>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Stack>
                <Button
                  type="submit"
                  colorScheme="blue"
                  width="full"
                  isLoading={isLoading}
                >
                  Login as Moderator
                </Button>
              </Stack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Stack>
    </Box>
  );
};

export default LoginForm;
