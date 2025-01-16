import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useApi } from '../hooks/useApi';
import MatchCard from '../components/Matching/MatchCard';

const MatchingResults = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    minMatchScore: 70,
    maxHourlyRate: 200,
    expertise: 'all'
  });

  const { get } = useApi();

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await get('/api/matching/mentors');
      setMatches(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch matches. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = matches.filter(match => {
    const matchesSearch = match.mentor.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      match.mentor.expertise.some(exp => exp.toLowerCase().includes(filters.search.toLowerCase()));
    
    const matchesScore = match.matchScore >= filters.minMatchScore;
    const matchesRate = match.mentor.hourlyRate <= filters.maxHourlyRate;
    const matchesExpertise = filters.expertise === 'all' || 
      match.mentor.expertise.includes(filters.expertise);

    return matchesSearch && matchesScore && matchesRate && matchesExpertise;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Your Matching Mentors
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search mentors"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography gutterBottom>
                Minimum Match Score: {filters.minMatchScore}%
              </Typography>
              <Slider
                value={filters.minMatchScore}
                onChange={(e, newValue) => setFilters({ ...filters, minMatchScore: newValue })}
                valueLabelDisplay="auto"
                min={0}
                max={100}
                step={5}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography gutterBottom>
                Maximum Hourly Rate: ${filters.maxHourlyRate}
              </Typography>
              <Slider
                value={filters.maxHourlyRate}
                onChange={(e, newValue) => setFilters({ ...filters, maxHourlyRate: newValue })}
                valueLabelDisplay="auto"
                min={10}
                max={200}
                step={10}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Results */}
      {filteredMatches.length === 0 ? (
        <Alert severity="info">
          No mentors found matching your criteria. Try adjusting your filters.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredMatches.map((match) => (
            <Grid item xs={12} md={6} lg={4} key={match.mentor._id}>
              <MatchCard match={match} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default MatchingResults; 