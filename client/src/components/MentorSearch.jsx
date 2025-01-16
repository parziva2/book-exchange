import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  TextField,
  Autocomplete,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  Typography,
  Grid,
  Button,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

const EXPERTISE_OPTIONS = [
  'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'Data Science',
  'Machine Learning', 'Web Development', 'Mobile Development', 'DevOps'
];

const LANGUAGE_OPTIONS = [
  'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese',
  'Korean', 'Russian', 'Portuguese', 'Italian'
];

const AVAILABILITY_OPTIONS = [
  { label: 'Morning (6AM-12PM)', value: 'morning' },
  { label: 'Afternoon (12PM-6PM)', value: 'afternoon' },
  { label: 'Evening (6PM-12AM)', value: 'evening' }
];

const SORT_OPTIONS = [
  { label: 'Rating (High to Low)', value: 'rating,desc' },
  { label: 'Rating (Low to High)', value: 'rating,asc' },
  { label: 'Price (Low to High)', value: 'price,asc' },
  { label: 'Price (High to Low)', value: 'price,desc' },
  { label: 'Experience (High to Low)', value: 'experience,desc' },
  { label: 'Most Reviews', value: 'reviews,desc' }
];

const MentorSearch = ({ onSearch }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    expertise: [],
    languages: [],
    availability: '',
    priceRange: [0, 200],
    ratingRange: [0, 5],
    sortBy: 'rating,desc'
  });

  const searchTimeoutRef = useRef(null);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = useCallback(() => {
    console.log('Building search query with filters:', filters);
    const queryParams = new URLSearchParams();
    
    // Only add search param if it's not empty
    if (filters.search?.trim()) {
      const searchTerm = filters.search.trim();
      queryParams.append('search', searchTerm);
      console.log('Added search term:', searchTerm);
    }
    
    // Add expertise filter if any are selected
    if (filters.expertise?.length) {
      const expertise = filters.expertise.join(',');
      queryParams.append('expertise', expertise);
      console.log('Added expertise:', expertise);
    }
    
    // Add language filter if any are selected
    if (filters.languages?.length) {
      const languages = filters.languages.join(',');
      queryParams.append('languages', languages);
      console.log('Added languages:', languages);
    }
    
    // Add availability if selected
    if (filters.availability) {
      queryParams.append('availability', filters.availability);
      console.log('Added availability:', filters.availability);
    }
    
    // Always add price and rating ranges
    queryParams.append('minPrice', filters.priceRange[0]);
    queryParams.append('maxPrice', filters.priceRange[1]);
    queryParams.append('minRating', filters.ratingRange[0]);
    queryParams.append('maxRating', filters.ratingRange[1]);
    
    // Add sorting parameters
    const [sortBy, sortOrder] = (filters.sortBy || 'rating,desc').split(',');
    queryParams.append('sortBy', sortBy);
    queryParams.append('sortOrder', sortOrder);

    console.log('Final query parameters:', queryParams.toString());
    onSearch(queryParams);
  }, [filters, onSearch]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
      handleSearch();
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      expertise: [],
      languages: [],
      availability: '',
      priceRange: [0, 200],
      ratingRange: [0, 5],
      sortBy: 'rating,desc'
    });
  };

  // Single effect to handle all filter changes with debouncing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [
    filters.search,
    filters.expertise,
    filters.languages,
    filters.availability,
    filters.priceRange,
    filters.ratingRange,
    filters.sortBy,
    handleSearch
  ]);

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search mentors by name, expertise, or keywords..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          onKeyPress={handleKeyPress}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton 
                  onClick={() => setShowFilters(!showFilters)}
                  color={showFilters ? 'primary' : 'default'}
                >
                  <FilterIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Box>

      {showFilters && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Autocomplete
              multiple
              options={EXPERTISE_OPTIONS}
              value={filters.expertise}
              onChange={(_, newValue) => handleFilterChange('expertise', newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Expertise" placeholder="Select expertise" />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip label={option} {...getTagProps({ index })} />
                ))
              }
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Autocomplete
              multiple
              options={LANGUAGE_OPTIONS}
              value={filters.languages}
              onChange={(_, newValue) => handleFilterChange('languages', newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Languages" placeholder="Select languages" />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip label={option} {...getTagProps({ index })} />
                ))
              }
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Availability</InputLabel>
              <Select
                value={filters.availability}
                onChange={(e) => handleFilterChange('availability', e.target.value)}
                label="Availability"
              >
                <MenuItem value="">Any time</MenuItem>
                {AVAILABILITY_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                label="Sort By"
              >
                {SORT_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography gutterBottom>Price Range ($/hour)</Typography>
            <Slider
              value={filters.priceRange}
              onChange={(_, newValue) => handleFilterChange('priceRange', newValue)}
              valueLabelDisplay="auto"
              min={0}
              max={200}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                ${filters.priceRange[0]}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ${filters.priceRange[1]}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography gutterBottom>Rating Range</Typography>
            <Slider
              value={filters.ratingRange}
              onChange={(_, newValue) => handleFilterChange('ratingRange', newValue)}
              valueLabelDisplay="auto"
              min={0}
              max={5}
              step={0.5}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                {filters.ratingRange[0]} ★
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filters.ratingRange[1]} ★
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
              >
                Apply Filters
              </Button>
            </Box>
          </Grid>
        </Grid>
      )}
    </Paper>
  );
};

export default MentorSearch; 