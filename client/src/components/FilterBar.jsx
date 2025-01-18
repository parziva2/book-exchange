import React from 'react';

const FilterBar = ({ filters, onFilterChange }) => {
  const handleChange = (field, value) => {
    onFilterChange({
      ...filters,
      [field]: value
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Expertise
        </label>
        <select
          value={filters.expertise}
          onChange={(e) => handleChange('expertise', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Expertise</option>
          <option value="programming">Programming</option>
          <option value="design">Design</option>
          <option value="business">Business</option>
          <option value="marketing">Marketing</option>
          <option value="writing">Writing</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Availability
        </label>
        <select
          value={filters.availability}
          onChange={(e) => handleChange('availability', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Any Time</option>
          <option value="morning">Morning</option>
          <option value="afternoon">Afternoon</option>
          <option value="evening">Evening</option>
          <option value="weekend">Weekend</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Price Range
        </label>
        <select
          value={filters.priceRange}
          onChange={(e) => handleChange('priceRange', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Any Price</option>
          <option value="0-25">$0 - $25</option>
          <option value="25-50">$25 - $50</option>
          <option value="50-100">$50 - $100</option>
          <option value="100+">$100+</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rating
        </label>
        <select
          value={filters.rating}
          onChange={(e) => handleChange('rating', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Any Rating</option>
          <option value="4">4+ Stars</option>
          <option value="3">3+ Stars</option>
          <option value="2">2+ Stars</option>
          <option value="1">1+ Stars</option>
        </select>
      </div>
    </div>
  );
};

export default FilterBar; 