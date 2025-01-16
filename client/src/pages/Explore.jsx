import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Typography, Grid, Box, CircularProgress } from '@mui/material';
import MentorCard from '../components/MentorCard';
import MentorSearch from '../components/MentorSearch';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';

const Explore = () => {
  // State hooks
  const [mentors, setMentors] = useState([]);
  const [recommendedMentors, setRecommendedMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Custom hooks
  const { isAuthenticated } = useAuth();
  const { get } = useApi();
  
  // Refs
  const abortControllerRef = useRef(null);
  const initialFetchDone = useRef(false);
  const lastSuccessfulParams = useRef(null);

  // Define fetchMentors first
  const fetchMentors = useCallback(async (params) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const url = `/mentors${params ? `?${params.toString()}` : ''}`;
      console.log('Fetching mentors with URL:', url);
      
      const response = await get(url, {
        signal: abortControllerRef.current.signal
      });

      console.log('Full response:', response);
      console.log('Response data:', response?.data);

      if (response?.data?.mentors || response?.data) {
        // Handle both response structures
        let allMentors = response?.data?.mentors || response?.data || [];
        console.log('All mentors before filtering:', allMentors);

        // Client-side filtering for search term
        let filteredMentors = allMentors;
        const searchTerm = params?.get('search')?.toLowerCase();
        
        if (searchTerm) {
          filteredMentors = allMentors.filter(mentor => {
            const fullName = `${mentor.firstName || ''} ${mentor.lastName || ''}`.toLowerCase();
            const bio = (mentor.bio || '').toLowerCase();
            const expertise = (mentor.expertise || []).map(exp => exp.toLowerCase());
            
            return fullName.includes(searchTerm) ||
                   bio.includes(searchTerm) ||
                   expertise.some(exp => exp.includes(searchTerm));
          });
          console.log(`Filtered mentors for "${searchTerm}":`, filteredMentors);
        }

        setMentors(filteredMentors);
        
        if (filteredMentors.length === 0) {
          setError('No mentors found matching your criteria.');
        }
      } else {
        console.log('No mentors data in response');
        setMentors([]);
        setError('No mentors found matching your criteria.');
      }
    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') {
        return;
      }
      console.error('Error fetching mentors:', error);
      setError('Failed to load mentors. Please try again.');
    } finally {
      setLoading(false);
      if (abortControllerRef.current?.signal.aborted) {
        abortControllerRef.current = null;
      }
    }
  }, [get]);

  const handleSearch = useCallback((queryParams) => {
    fetchMentors(queryParams);
  }, [fetchMentors]);

  const fetchRecommendedMentors = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await get('/mentors/recommended');
      if (response?.data?.mentors) {
        setRecommendedMentors(response.data.mentors);
      }
    } catch (error) {
      console.error('Error fetching recommended mentors:', error);
      setRecommendedMentors([]);
    }
  }, [get, isAuthenticated]);

  // Effects
  useEffect(() => {
    // Only do initial fetch once
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchMentors();
    }

    // Cleanup function to cancel any pending requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchMentors]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRecommendedMentors();
    } else {
      setRecommendedMentors([]);
    }
  }, [isAuthenticated, fetchRecommendedMentors]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <MentorSearch onSearch={handleSearch} />

      {error && mentors.length === 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {isAuthenticated && recommendedMentors.length > 0 && (
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            Recommended for You
          </Typography>
          <Grid container spacing={3}>
            {recommendedMentors.map((mentor) => (
              <Grid item key={mentor._id} xs={12} sm={6} md={4}>
                <MentorCard mentor={mentor} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Box>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          All Mentors
        </Typography>
        {loading && mentors.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : mentors.length > 0 ? (
          <Grid container spacing={3}>
            {mentors.map((mentor) => (
              <Grid item key={mentor._id} xs={12} sm={6} md={4}>
                <MentorCard mentor={mentor} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body1" color="text.secondary" align="center">
            No mentors found matching your criteria.
          </Typography>
        )}
      </Box>
    </Container>
  );
};

export default Explore; 