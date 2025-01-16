import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Avatar,
  Box,
  Button,
  Chip,
  Collapse,
  LinearProgress,
  Grid,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  School as SchoolIcon,
  Language as LanguageIcon,
  AccessTime as AccessTimeIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const MatchCard = ({ match }) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const {
    mentor,
    matchScore,
    expertiseScore,
    availabilityScore,
    languageScore,
    styleScore
  } = match;

  const handleViewProfile = () => {
    navigate(`/mentors/${mentor._id}`);
  };

  const renderScoreBar = (score, label) => (
    <Box sx={{ mb: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2" color="text.secondary">
          {score}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={score}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
            backgroundColor: score >= 80 ? 'success.main' :
                           score >= 60 ? 'warning.main' :
                           'error.main'
          }
        }}
      />
    </Box>
  );

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            src={mentor.avatar}
            alt={mentor.name}
            sx={{ width: 64, height: 64, mr: 2 }}
          />
          <Box>
            <Typography variant="h6" gutterBottom>
              {mentor.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {mentor.title || 'Mentor'}
            </Typography>
          </Box>
        </Box>

        {renderScoreBar(matchScore, 'Overall Match')}

        <Box sx={{ mt: 2 }}>
          <Grid container spacing={1}>
            {mentor.expertise.slice(0, 3).map((exp, index) => (
              <Grid item key={index}>
                <Chip
                  icon={<SchoolIcon />}
                  label={exp}
                  size="small"
                  variant="outlined"
                />
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <MoneyIcon color="action" />
          <Typography variant="body2">
            ${mentor.hourlyRate}/hour
          </Typography>
        </Box>
      </CardContent>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            Match Details
          </Typography>
          
          <Box sx={{ mt: 1 }}>
            {renderScoreBar(expertiseScore, 'Expertise Match')}
            {renderScoreBar(availabilityScore, 'Availability Match')}
            {renderScoreBar(languageScore, 'Language Match')}
            {renderScoreBar(styleScore, 'Mentorship Style Match')}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="body2" color="text.secondary" paragraph>
            {mentor.bio}
          </Typography>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Languages
            </Typography>
            <Grid container spacing={1}>
              {mentor.languages.map((lang, index) => (
                <Grid item key={index}>
                  <Chip
                    icon={<LanguageIcon />}
                    label={lang}
                    size="small"
                    variant="outlined"
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        </CardContent>
      </Collapse>

      <CardActions sx={{ mt: 'auto' }}>
        <Button
          size="small"
          onClick={() => setExpanded(!expanded)}
          endIcon={
            <ExpandMoreIcon
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: '0.3s'
              }}
            />
          }
        >
          {expanded ? 'Show Less' : 'Show More'}
        </Button>
        <Button
          size="small"
          variant="contained"
          onClick={handleViewProfile}
          sx={{ ml: 'auto' }}
        >
          View Profile
        </Button>
      </CardActions>
    </Card>
  );
};

export default MatchCard; 