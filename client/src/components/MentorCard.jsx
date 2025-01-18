import React from 'react';
import { Link } from 'react-router-dom';

const MentorCard = ({ mentor }) => {
  const {
    _id,
    firstName,
    lastName,
    expertise,
    bio,
    hourlyRate,
    rating,
    totalReviews,
    avatarUrl
  } = mentor;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <img
            src={avatarUrl || '/default-avatar.png'}
            alt={`${firstName} ${lastName}`}
            className="w-16 h-16 rounded-full object-cover mr-4"
          />
          <div>
            <h2 className="text-xl font-semibold">
              {firstName} {lastName}
            </h2>
            <div className="text-sm text-gray-600 mt-1">
              {expertise.join(', ')}
            </div>
          </div>
        </div>

        <p className="text-gray-700 mb-4 line-clamp-3">{bio}</p>

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <span className="text-yellow-400 mr-1">★</span>
            <span className="font-medium">{rating.toFixed(1)}</span>
            <span className="text-gray-500 text-sm ml-1">
              ({totalReviews} reviews)
            </span>
          </div>
          <div className="text-lg font-semibold text-blue-600">
            ${hourlyRate}/hr
          </div>
        </div>

        <Link
          to={`/mentors/${_id}`}
          className="block w-full text-center bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
};

export default MentorCard; 