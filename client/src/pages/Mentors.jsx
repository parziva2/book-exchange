import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  Chip,
  Rating,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Stack,
  Alert,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import axios from 'axios';
import { getValidAccessToken } from '../utils/tokenStorage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Mentors = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    if (category) {
      setSelectedCategory(category);
    }
    fetchMentors();
  }, [location]);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      setError('');

      const token = getValidAccessToken();
      if (!token) {
        setError('Please log in to view mentors');
        return;
      }

      const response = await axios.get(`${API_URL}/mentors`, {
        params: {
          search: searchQuery,
          expertise: selectedCategory,
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data?.status === 'success' && response.data?.data?.mentors) {
        setMentors(response.data.data.mentors);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching mentors:', err);
      if (err.response?.status === 401) {
        setError('Please log in to view mentors');
        navigate('/login');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch mentors');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
    // Debounce the API call
    const timeoutId = setTimeout(() => {
      fetchMentors();
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Find Mentors
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search mentors by name or expertise..."
          value={searchQuery}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {selectedCategory && (
        <Box sx={{ mb: 3 }}>
          <Chip
            label={`Category: ${selectedCategory}`}
            onDelete={() => {
              setSelectedCategory('');
              fetchMentors();
            }}
            color="primary"
          />
        </Box>
      )}

      {mentors.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No mentors found matching your criteria
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {mentors.map((mentor) => (
            <Grid item xs={12} sm={6} md={4} key={mentor.id || mentor._id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      src={mentor.avatar}
                      sx={{ width: 60, height: 60 }}
                    >
                      {mentor.firstName?.[0] || mentor.lastName?.[0]}
                    </Avatar>
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="h6">
                        {`${mentor.firstName} ${mentor.lastName}`}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Rating value={mentor.rating || 0} readOnly size="small" />
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          ({mentor.reviewCount || 0})
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {mentor.bio}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    {mentor.expertise?.map((skill) => (
                      <Chip
                        key={skill}
                        label={skill}
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                        onClick={() => {
                          setSelectedCategory(skill);
                          fetchMentors();
                        }}
                      />
                    ))}
                  </Box>

                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate(`/mentor/${mentor.id || mentor._id}`)}
                    >
                      View Profile
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Mentors; 