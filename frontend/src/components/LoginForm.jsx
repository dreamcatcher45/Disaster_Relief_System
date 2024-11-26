import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Container,
  Text,
  Link,
  useToast,
  Heading,
  InputGroup,
  InputLeftElement,
  Icon,
  Card,
  CardBody,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaMobileAlt, FaEnvelope, FaLock } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { login } from '../api/auth';
import { jwtDecode } from 'jwt-decode'; // Import jwtDecode

const LoginForm = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: '',
    email: '',
    password: '',
  });

  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const role = tabIndex === 0 ? 'user' : tabIndex === 1 ? 'admin' : 'moderator';
      const response = await login({ ...formData, role });
      
      // Decode the JWT token to get user information
      const decodedToken = jwtDecode(response.token);
      const userData = {
        ...decodedToken,
        role: role,
        email: formData.email
      };
      
      // Pass both token and user data to auth context
      authLogin({ token: response.token, user: userData });
      
      navigate('/dashboard');
      toast({
        title: 'Login successful',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Container maxW="container.sm" centerContent py={8}>
      <VStack spacing={8} w="full" maxW="md">
        <VStack spacing={2} align="center">
          <Heading size="xl">Welcome Back</Heading>
          <Text fontSize="lg" opacity={0.8}>
            Sign in to your account
          </Text>
        </VStack>

        <Card w="full" variant="elevated" boxShadow="xl" bg={useColorModeValue('white', 'gray.800')}>
          <CardBody>
            <Tabs isFitted variant="enclosed" colorScheme="brand" onChange={setTabIndex}>
              <TabList mb="1em">
                <Tab _selected={{ color: 'brand.400', borderColor: 'brand.400' }}>User</Tab>
                <Tab _selected={{ color: 'brand.400', borderColor: 'brand.400' }}>Admin</Tab>
                <Tab _selected={{ color: 'brand.400', borderColor: 'brand.400' }}>Moderator</Tab>
              </TabList>

              <TabPanels>
                <TabPanel>
                  <form onSubmit={handleSubmit}>
                    <VStack spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>Phone Number</FormLabel>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none">
                            <Icon as={FaMobileAlt} color="gray.500" />
                          </InputLeftElement>
                          <Input
                            type="tel"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            placeholder="Enter phone number"
                            bg={useColorModeValue('gray.50', 'gray.700')}
                          />
                        </InputGroup>
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel>Password</FormLabel>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none">
                            <Icon as={FaLock} color="gray.500" />
                          </InputLeftElement>
                          <Input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter password"
                            bg={useColorModeValue('gray.50', 'gray.700')}
                          />
                        </InputGroup>
                      </FormControl>
                      <Button
                        type="submit"
                        colorScheme="brand"
                        w="full"
                        size="lg"
                        isLoading={isLoading}
                        loadingText="Signing in..."
                      >
                        Sign In
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>

                <TabPanel>
                  <form onSubmit={handleSubmit}>
                    <VStack spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>Email</FormLabel>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none">
                            <Icon as={FaEnvelope} color="gray.500" />
                          </InputLeftElement>
                          <Input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter email"
                            bg={useColorModeValue('gray.50', 'gray.700')}
                          />
                        </InputGroup>
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel>Password</FormLabel>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none">
                            <Icon as={FaLock} color="gray.500" />
                          </InputLeftElement>
                          <Input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter password"
                            bg={useColorModeValue('gray.50', 'gray.700')}
                          />
                        </InputGroup>
                      </FormControl>
                      <Button
                        type="submit"
                        colorScheme="brand"
                        w="full"
                        size="lg"
                        isLoading={isLoading}
                        loadingText="Signing in..."
                      >
                        Sign In
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>

                <TabPanel>
                  <form onSubmit={handleSubmit}>
                    <VStack spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>Email</FormLabel>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none">
                            <Icon as={FaEnvelope} color="gray.500" />
                          </InputLeftElement>
                          <Input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter email"
                            bg={useColorModeValue('gray.50', 'gray.700')}
                          />
                        </InputGroup>
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel>Password</FormLabel>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none">
                            <Icon as={FaLock} color="gray.500" />
                          </InputLeftElement>
                          <Input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter password"
                            bg={useColorModeValue('gray.50', 'gray.700')}
                          />
                        </InputGroup>
                      </FormControl>
                      <Button
                        type="submit"
                        colorScheme="brand"
                        w="full"
                        size="lg"
                        isLoading={isLoading}
                        loadingText="Signing in..."
                      >
                        Sign In
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>

        <Text>
          Don't have an account?{' '}
          <Link
            as={RouterLink}
            to="/signup"
            color="brand.200"
            fontWeight="semibold"
            _hover={{ color: 'brand.300' }}
          >
            Sign up
          </Link>
        </Text>
      </VStack>
    </Container>
  );
};

export default LoginForm;
