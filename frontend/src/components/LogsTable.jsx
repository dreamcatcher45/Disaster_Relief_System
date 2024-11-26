import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Input,
  HStack,
  Select,
  useToast,
  Text,
  VStack,
} from '@chakra-ui/react';
import Cookies from 'js-cookie';

const LogsTable = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    method: ''
  });

  const toast = useToast();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = Cookies.get(import.meta.env.VITE_JWT_KEY);
      
      // Build query string from filters
      const queryParams = new URLSearchParams();
      if (filters.start_date) queryParams.append('start_date', filters.start_date);
      if (filters.end_date) queryParams.append('end_date', filters.end_date);
      if (filters.method) queryParams.append('method', filters.method);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/logs?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }

      const { data } = await response.json();
      setLogs(data || []);
    } catch (err) {
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

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getMethodColor = (method) => {
    const colors = {
      GET: 'green',
      POST: 'blue',
      PUT: 'orange',
      DELETE: 'red'
    };
    return colors[method] || 'gray';
  };

  return (
    <VStack spacing={4} align="stretch">
      <Box>
        <HStack spacing={4} mb={4}>
          <Input
            type="date"
            placeholder="Start Date"
            value={filters.start_date}
            onChange={(e) => handleFilterChange('start_date', e.target.value)}
          />
          <Input
            type="date"
            placeholder="End Date"
            value={filters.end_date}
            onChange={(e) => handleFilterChange('end_date', e.target.value)}
          />
          <Select
            placeholder="Method"
            value={filters.method}
            onChange={(e) => handleFilterChange('method', e.target.value)}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </Select>
        </HStack>
      </Box>

      {loading ? (
        <Text>Loading logs...</Text>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Timestamp</Th>
                <Th>User</Th>
                <Th>Role</Th>
                <Th>Method</Th>
                <Th>ID</Th>
                <Th>Response Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {logs.map((log, index) => (
                <Tr key={index}>
                  <Td whiteSpace="nowrap">{new Date(log.timestamp).toLocaleString()}</Td>
                  <Td>{log.user_ref_id || 'Anonymous'}</Td>
                  <Td>
                    <Badge colorScheme={log.user_role === 'admin' ? 'red' : log.user_role === 'moderator' ? 'purple' : 'blue'}>
                      {log.user_role || 'Anonymous'}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge colorScheme={getMethodColor(log.method)}>
                      {log.method}
                    </Badge>
                  </Td>
                  <Td>{log.id}</Td>
                  <Td>
                    <Badge colorScheme={log.response_status < 400 ? 'green' : 'red'}>
                      {log.response_status}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </VStack>
  );
};

export default LogsTable;
