import React from 'react';
import { Link } from 'react-router-dom';

const MentorCard = ({ mentor }) => {
  const {
    _id,
    firstName = '',
    lastName = '',
    expertise = [],
    bio = '',
    hourlyRate = 0,
    rating = 0,
    reviewCount = 0,
    avatar = ''
  } = mentor || {};

  if (!mentor || !_id) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-gray-100">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className="relative">
            <img
              src={avatar || '/default-avatar.png'}
              alt={`${firstName} ${lastName}`}
              className="w-16 h-16 rounded-full object-cover shadow-sm"
              onError={(e) => {
                e.target.src = '/default-avatar.png';
                e.target.onerror = null;
              }}
            />
            {rating >= 4.5 && (
              <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-1 shadow-sm">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            )}
          </div>
          <div className="ml-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {firstName} {lastName}
            </h2>
            <div className="text-sm text-gray-600 mt-1">
              {Array.isArray(expertise) ? expertise.join(' • ') : ''}
            </div>
          </div>
        </div>

        <p className="text-gray-600 mb-4 line-clamp-2 min-h-[48px]">{bio}</p>

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="ml-1 font-semibold text-gray-900">{Number(rating).toFixed(1)}</span>
            </div>
            <span className="text-gray-500 text-sm ml-1">
              ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
            </span>
          </div>
          <div className="text-lg font-bold text-blue-600">
            ${Number(hourlyRate).toFixed(2)}/hr
          </div>
        </div>

        <Link
          to={`/mentors/${_id}`}
          className="block w-full text-center bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold shadow-sm"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
};

export default MentorCard; 