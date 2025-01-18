import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import api, { protectedRoutes } from '../utils/api';
import MentorCard from '../components/MentorCard';
import SearchBar from '../components/SearchBar';
import FilterBar from '../components/FilterBar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const Explore = () => {
  const { isAuthenticated } = useAuth();
  const { showNotification } = useNotifications();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    expertise: '',
    availability: '',
    priceRange: '',
    rating: ''
  });

  const fetchMentors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Construct URL with search and filter parameters
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filters.expertise) params.append('expertise', filters.expertise);
      if (filters.availability) params.append('availability', filters.availability);
      if (filters.priceRange) {
        const [min, max] = filters.priceRange.split('-');
        if (min) params.append('minPrice', min);
        if (max) params.append('maxPrice', max === '+' ? '1000' : max);
      }
      if (filters.rating) params.append('minRating', filters.rating);

      const url = `${protectedRoutes.mentors}?${params.toString()}`;
      console.log('Fetching mentors from:', url);

      const response = await api.get(url);
      console.log('API Response:', response.data);
      
      // Handle the response structure
      const mentorsData = response.data?.data?.mentors || [];
      console.log('Mentors data:', mentorsData);
      
      setMentors(Array.isArray(mentorsData) ? mentorsData : []);
    } catch (err) {
      console.error('Error fetching mentors:', err);
      setError('Failed to load mentors. Please try again.');
      showNotification('error', 'Failed to load mentors. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters, showNotification]);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage message={error} />
        <button
          onClick={fetchMentors}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const mentorsList = Array.isArray(mentors) ? mentors : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Find a Mentor</h1>
        {isAuthenticated && (
          <Link
            to="/become-mentor"
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Become a Mentor
          </Link>
        )}
      </div>

      <div className="mb-8">
        <SearchBar onSearch={handleSearch} />
      </div>

      <div className="mb-8">
        <FilterBar filters={filters} onFilterChange={handleFilterChange} />
      </div>

      {mentorsList.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No mentors found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentorsList.map((mentor) => (
            <MentorCard key={mentor._id} mentor={mentor} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Explore; 