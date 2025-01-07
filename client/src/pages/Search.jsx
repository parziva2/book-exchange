import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Avatar,
  Chip,
  Rating,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Search = () => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    topic: '',
    level: '',
  });
  const navigate = useNavigate();

  const expertiseLevels = ['beginner', 'intermediate', 'expert'];

  useEffect(() => {
    searchMentors();
  }, []);

  const searchMentors = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (filters.topic) params.append('topic', filters.topic);
      if (filters.level) params.append('level', filters.level);

      const response = await axios.get(`/api/users/search?${params}`);
      setMentors(response.data);
    } catch (err) {
      setError('Failed to fetch mentors. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchMentors();
  };

  const handleBookSession = (mentorId) => {
    // Navigate to booking page with mentor ID
    navigate(`/book/${mentorId}`);
  };

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Find Your Mentor
      </Typography>

      {/* Search Filters */}
      <Card sx={{ mb: 4, p: 2 }}>
        <Box component="form" onSubmit={handleSearch}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={5}>
              <TextField
                fullWidth
                name="topic"
                label="Search by Topic"
                value={filters.topic}
                onChange={handleFilterChange}
                placeholder="e.g., Programming, Marketing, Design"
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <FormControl fullWidth>
                <InputLabel>Expertise Level</InputLabel>
                <Select
                  name="level"
                  value={filters.level}
                  onChange={handleFilterChange}
                  label="Expertise Level"
                >
                  <MenuItem value="">Any Level</MenuItem>
                  {expertiseLevels.map((level) => (
                    <MenuItem key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={loading}
              >
                Search
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Results */}
      {!loading && (
        <Grid container spacing={3}>
          {mentors.map((mentor) => (
            <Grid item xs={12} md={6} lg={4} key={mentor._id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{ width: 56, height: 56, mr: 2 }}
                    >
                      {mentor.username[0].toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{mentor.username}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Rating
                          value={mentor.rating.average}
                          precision={0.5}
                          readOnly
                          size="small"
                        />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          ({mentor.rating.count} reviews)
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Typography variant="subtitle1" gutterBottom>
                    Expertise:
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {mentor.expertise.map((exp, index) => (
                      <Chip
                        key={index}
                        label={`${exp.topic} (${exp.level})`}
                        sx={{ mr: 1, mb: 1 }}
                        variant="outlined"
                      />
                    ))}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Rate: 1 credit / 30 min
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => handleBookSession(mentor._id)}
                    >
                      Book Session
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {mentors.length === 0 && !loading && (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No mentors found matching your criteria.
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Try adjusting your search filters.
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}
    </Container>
  );
};

export default Search; 