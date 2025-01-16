import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Typography,
  Avatar,
  Rating,
  Chip,
  Stack,
} from '@mui/material';
import { AccessTime as AccessTimeIcon, AttachMoney as AttachMoneyIcon } from '@mui/icons-material';

const MentorCard = ({ mentor }) => {
  const navigate = useNavigate();

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return undefined;
    if (avatarPath.startsWith('http')) return avatarPath;
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api$/, '');
    return `${baseUrl}${avatarPath}`;
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
          <Avatar
            src={getAvatarUrl(mentor.avatar)}
            sx={{ 
              width: 100, 
              height: 100, 
              mb: 2,
              bgcolor: 'primary.main',
              fontSize: '2rem',
            }}
          >
            {mentor.firstName?.[0]}
          </Avatar>
          <Typography variant="h6" component="div" gutterBottom align="center">
            {mentor.firstName} {mentor.lastName}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Rating 
              value={mentor.mentorInfo?.rating || 0} 
              precision={0.5} 
              readOnly 
              size="small" 
              sx={{ mr: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              ({mentor.mentorInfo?.reviewCount || 0} {mentor.mentorInfo?.reviewCount === 1 ? 'review' : 'reviews'})
            </Typography>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph>
          {mentor.bio?.substring(0, 120)}
          {mentor.bio?.length > 120 ? '...' : ''}
        </Typography>

        <Stack spacing={1}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {mentor.expertise?.slice(0, 3).map((skill) => (
              <Chip 
                key={skill} 
                label={skill} 
                size="small"
                sx={{ 
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                }}
              />
            ))}
            {mentor.expertise?.length > 3 && (
              <Chip 
                label={`+${mentor.expertise.length - 3}`} 
                size="small"
                sx={{ 
                  bgcolor: 'grey.300',
                  color: 'grey.700',
                }}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AttachMoneyIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                ${mentor.hourlyRate}/hr
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTimeIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {mentor.availability || 'Flexible'}
              </Typography>
            </Box>
          </Box>
        </Stack>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={() => navigate(`/mentor/${mentor._id}`)}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          View Profile
        </Button>
      </CardActions>
    </Card>
  );
};

export default MentorCard; 