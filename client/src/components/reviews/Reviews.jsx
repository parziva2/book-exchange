import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Rating,
  Avatar,
  Divider,
  LinearProgress,
  Pagination,
  Paper,
  Stack
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';

const Reviews = ({ mentorId }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const [reviewsRes, statsRes] = await Promise.all([
          axios.get(`/api/reviews/mentor/${mentorId}?page=${page}`),
          axios.get(`/api/reviews/mentor/${mentorId}/stats`)
        ]);

        setReviews(reviewsRes.data.data.reviews);
        setTotalPages(reviewsRes.data.data.pagination.totalPages);
        setStats(statsRes.data.data);
      } catch (err) {
        setError('Failed to load reviews');
        console.error('Error fetching reviews:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [mentorId, page]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // Calculate the percentage for each rating
  const getRatingPercentage = (count) => {
    return stats.totalReviews > 0 
      ? (count / stats.totalReviews) * 100 
      : 0;
  };

  if (loading) {
    return <Box sx={{ p: 2 }}><LinearProgress /></Box>;
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Rating Summary */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box sx={{ mr: 3 }}>
            <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
              {stats.averageRating.toFixed(1)}
            </Typography>
            <Rating 
              value={stats.averageRating} 
              precision={0.1} 
              readOnly 
              size="large"
            />
            <Typography variant="body2" color="text.secondary">
              {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
            </Typography>
          </Box>
          
          {/* Rating Distribution */}
          <Box sx={{ flexGrow: 1 }}>
            {[5, 4, 3, 2, 1].map((rating) => (
              <Box 
                key={rating} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  mb: 0.5 
                }}
              >
                <Typography sx={{ mr: 1, minWidth: '20px' }}>{rating}</Typography>
                <LinearProgress
                  variant="determinate"
                  value={getRatingPercentage(stats.ratingDistribution[rating])}
                  sx={{ 
                    flexGrow: 1,
                    height: 8,
                    borderRadius: 1,
                    bgcolor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: 'primary.main'
                    }
                  }}
                />
                <Typography sx={{ ml: 1, minWidth: '40px' }}>
                  {stats.ratingDistribution[rating]}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Paper>

      {/* Reviews List */}
      <Stack spacing={2}>
        {reviews.map((review) => (
          <Paper 
            key={review._id} 
            elevation={0} 
            sx={{ p: 2, bgcolor: 'background.default' }}
          >
            <Box sx={{ display: 'flex', mb: 2 }}>
              <Avatar 
                src={review.reviewer.avatar ? `http://localhost:5000${review.reviewer.avatar}` : undefined}
                alt={`${review.reviewer.firstName} ${review.reviewer.lastName}`}
                sx={{ mr: 2 }}
              >
                {review.reviewer.firstName[0]}
              </Avatar>
              <Box>
                <Typography variant="subtitle1">
                  {review.reviewer.firstName} {review.reviewer.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                </Typography>
              </Box>
            </Box>
            
            <Rating value={review.rating} readOnly size="small" sx={{ mb: 1 }} />
            <Typography variant="body1">{review.comment}</Typography>
            
            {review.session && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Session: {review.session.topic}
              </Typography>
            )}
          </Paper>
        ))}
      </Stack>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={handlePageChange} 
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};

export default Reviews; 