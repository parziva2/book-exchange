import React from 'react';

const FilterBar = ({ filters, onFilterChange }) => {
  const handleChange = (field, value) => {
    onFilterChange({
      ...filters,
      [field]: value
    });
  };

  const selectClassName = "w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm text-gray-900";
  const labelClassName = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div>
        <label className={labelClassName}>
          Expertise
        </label>
        <select
          value={filters.expertise}
          onChange={(e) => handleChange('expertise', e.target.value)}
          className={selectClassName}
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
        <label className={labelClassName}>
          Availability
        </label>
        <select
          value={filters.availability}
          onChange={(e) => handleChange('availability', e.target.value)}
          className={selectClassName}
        >
          <option value="">Any Time</option>
          <option value="morning">Morning</option>
          <option value="afternoon">Afternoon</option>
          <option value="evening">Evening</option>
          <option value="weekend">Weekend</option>
        </select>
      </div>

      <div>
        <label className={labelClassName}>
          Price Range
        </label>
        <select
          value={filters.priceRange}
          onChange={(e) => handleChange('priceRange', e.target.value)}
          className={selectClassName}
        >
          <option value="">Any Price</option>
          <option value="0-25">$0 - $25/hr</option>
          <option value="25-50">$25 - $50/hr</option>
          <option value="50-100">$50 - $100/hr</option>
          <option value="100+">$100+/hr</option>
        </select>
      </div>

      <div>
        <label className={labelClassName}>
          Rating
        </label>
        <select
          value={filters.rating}
          onChange={(e) => handleChange('rating', e.target.value)}
          className={selectClassName}
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