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
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center min-h-[400px]">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  const mentorsList = Array.isArray(mentors) ? mentors : [];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Find a Mentor</h1>
              <p className="mt-2 text-gray-600">Connect with experienced mentors in your field</p>
            </div>
            {isAuthenticated && (
              <Link
                to="/become-mentor"
                className="mt-4 md:mt-0 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm"
              >
                Become a Mentor
              </Link>
            )}
          </div>

          {/* Search Section */}
          <div className="mb-6">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* Filter Section */}
          <FilterBar filters={filters} onFilterChange={handleFilterChange} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8">
            <ErrorMessage message={error} />
            <button
              onClick={fetchMentors}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Results Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {mentorsList.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No mentors found</h3>
              <p className="text-gray-600">
                Try adjusting your search criteria or check back later for new mentors.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentorsList.map((mentor) => (
                <MentorCard key={mentor._id} mentor={mentor} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Explore; 