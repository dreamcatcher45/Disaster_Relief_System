import { useState } from 'react';
import {
  Box,
  Button,
  Input,
  VStack,
  Text,
  Heading,
  Alert,
  Container,
  Card,
  CardBody,
  InputGroup,
  InputLeftElement,
  Icon,
  FormControl,
  FormLabel,
  Link,
  useColorModeValue,
  SimpleGrid,
  Textarea,
  FormErrorMessage,
} from '@chakra-ui/react';
import { FaUser, FaEnvelope, FaLock, FaMapMarkerAlt, FaMobileAlt } from 'react-icons/fa';
import { register } from '../api/auth';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const SignupForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!/^\d{10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      const { confirmPassword, ...submitData } = formData;
      await register(submitData);
      navigate('/login');
    } catch (error) {
      setError(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.md" centerContent py={8}>
      <VStack spacing={8} w="full">
        <VStack spacing={2} align="center">
          <Heading size="xl">Create Account</Heading>
          <Text fontSize="lg" opacity={0.8}>
            Join us today
          </Text>
        </VStack>

        <Card 
          w="full" 
          variant="outline" 
          borderColor={useColorModeValue('gray.200', 'gray.600')}
          bg={useColorModeValue('white', 'gray.800')}
        >
          <CardBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={6}>
                {error && (
                  <Alert status="error" rounded="md">
                    {error}
                  </Alert>
                )}

                <SimpleGrid columns={2} spacing={6} w="full">
                  <FormControl isRequired isInvalid={errors.name}>
                    <FormLabel>Name</FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <Icon as={FaUser} color="gray.500" />
                      </InputLeftElement>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        bg={useColorModeValue('gray.50', 'gray.700')}
                      />
                    </InputGroup>
                  </FormControl>

                  <FormControl isRequired isInvalid={errors.phoneNumber}>
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
                    <FormErrorMessage>{errors.phoneNumber}</FormErrorMessage>
                  </FormControl>

                  <FormControl isRequired isInvalid={errors.email}>
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
                        placeholder="Enter your email"
                        bg={useColorModeValue('gray.50', 'gray.700')}
                      />
                    </InputGroup>
                    <FormErrorMessage>{errors.email}</FormErrorMessage>
                  </FormControl>

                  <FormControl isRequired isInvalid={errors.password}>
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
                    <FormErrorMessage>{errors.password}</FormErrorMessage>
                  </FormControl>

                  <FormControl isRequired isInvalid={errors.confirmPassword}>
                    <FormLabel>Confirm Password</FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <Icon as={FaLock} color="gray.500" />
                      </InputLeftElement>
                      <Input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        bg={useColorModeValue('gray.50', 'gray.700')}
                      />
                    </InputGroup>
                    <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
                  </FormControl>
                </SimpleGrid>

                <FormControl isRequired gridColumn="span 2">
                  <FormLabel>Address</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none" h="auto" pl={2} pt={2}>
                      <Icon as={FaMapMarkerAlt} color="gray.500" />
                    </InputLeftElement>
                    <Textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Enter your full address"
                      bg={useColorModeValue('gray.50', 'gray.700')}
                      pl={10}
                      minH="100px"
                      resize="vertical"
                    />
                  </InputGroup>
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="brand"
                  size="lg"
                  w="full"
                  isLoading={isLoading}
                  loadingText="Creating account..."
                >
                  Create Account
                </Button>

                <Text>
                  Already have an account?{' '}
                  <Link as={RouterLink} to="/login" color="brand.500">
                    Sign in
                  </Link>
                </Text>
              </VStack>
            </form>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

export default SignupForm;
