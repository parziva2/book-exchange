import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Chip,
  Avatar,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Card,
  CardContent,
  Rating,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const EXPERTISE_LEVELS = ['beginner', 'intermediate', 'expert'];

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileData, setProfileData] = useState({
    username: '',
    bio: '',
    expertise: [],
    interests: [],
    availability: [],
  });
  const [expertiseDialog, setExpertiseDialog] = useState({
    open: false,
    topic: '',
    level: 'beginner',
    hourlyRate: '',
  });
  const [availabilityDialog, setAvailabilityDialog] = useState({
    open: false,
    day: 'monday',
    startTime: '',
    endTime: '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        bio: user.bio || '',
        expertise: user.expertise || [],
        interests: user.interests || [],
        availability: user.availability || [],
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await updateProfile(profileData);
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpertise = () => {
    if (!expertiseDialog.topic || !expertiseDialog.level) return;

    const newExpertise = {
      topic: expertiseDialog.topic,
      level: expertiseDialog.level,
      hourlyRate: Number(expertiseDialog.hourlyRate) || 1,
    };

    setProfileData((prev) => ({
      ...prev,
      expertise: [...prev.expertise, newExpertise],
    }));

    setExpertiseDialog({
      open: false,
      topic: '',
      level: 'beginner',
      hourlyRate: '',
    });
  };

  const handleRemoveExpertise = (index) => {
    setProfileData((prev) => ({
      ...prev,
      expertise: prev.expertise.filter((_, i) => i !== index),
    }));
  };

  const handleAddAvailability = () => {
    if (!availabilityDialog.day || !availabilityDialog.startTime || !availabilityDialog.endTime) return;

    const newAvailability = {
      day: availabilityDialog.day,
      startTime: availabilityDialog.startTime,
      endTime: availabilityDialog.endTime,
    };

    setProfileData((prev) => ({
      ...prev,
      availability: [...prev.availability, newAvailability],
    }));

    setAvailabilityDialog({
      open: false,
      day: 'monday',
      startTime: '',
      endTime: '',
    });
  };

  const handleRemoveAvailability = (index) => {
    setProfileData((prev) => ({
      ...prev,
      availability: prev.availability.filter((_, i) => i !== index),
    }));
  };

  const handleAddInterest = (interest) => {
    if (!interest.trim()) return;
    setProfileData((prev) => ({
      ...prev,
      interests: [...new Set([...prev.interests, interest.trim()])],
    }));
  };

  const handleRemoveInterest = (interest) => {
    setProfileData((prev) => ({
      ...prev,
      interests: prev.interests.filter((i) => i !== interest),
    }));
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        My Profile
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Username"
                    name="username"
                    value={profileData.username}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bio"
                    name="bio"
                    multiline
                    rows={4}
                    value={profileData.bio}
                    onChange={handleChange}
                    placeholder="Tell others about yourself..."
                  />
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Expertise Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Expertise
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={() => setExpertiseDialog({ ...expertiseDialog, open: true })}
              >
                Add Expertise
              </Button>
            </Box>
            <Grid container spacing={2}>
              {profileData.expertise.map((exp, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle1">{exp.topic}</Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveExpertise(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                      <Chip
                        label={exp.level}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Rate: {exp.hourlyRate} credits/hour
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Availability Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Availability
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={() => setAvailabilityDialog({ ...availabilityDialog, open: true })}
              >
                Add Availability
              </Button>
            </Box>
            <Grid container spacing={2}>
              {profileData.availability.map((slot, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                          {slot.day}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveAvailability(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {slot.startTime} - {slot.endTime}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Interests Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Learning Interests
            </Typography>
            <Box sx={{ mb: 2 }}>
              <TextField
                label="Add Interest"
                size="small"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddInterest(e.target.value);
                    e.target.value = '';
                  }
                }}
                placeholder="Press Enter to add"
                fullWidth
              />
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {profileData.interests.map((interest, index) => (
                <Chip
                  key={index}
                  label={interest}
                  onDelete={() => handleRemoveInterest(interest)}
                />
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Save Button */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Expertise Dialog */}
      <Dialog open={expertiseDialog.open} onClose={() => setExpertiseDialog({ ...expertiseDialog, open: false })}>
        <DialogTitle>Add Expertise</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Topic"
                value={expertiseDialog.topic}
                onChange={(e) => setExpertiseDialog({ ...expertiseDialog, topic: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Level</InputLabel>
                <Select
                  value={expertiseDialog.level}
                  onChange={(e) => setExpertiseDialog({ ...expertiseDialog, level: e.target.value })}
                  label="Level"
                >
                  {EXPERTISE_LEVELS.map((level) => (
                    <MenuItem key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Hourly Rate (credits)"
                value={expertiseDialog.hourlyRate}
                onChange={(e) => setExpertiseDialog({ ...expertiseDialog, hourlyRate: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExpertiseDialog({ ...expertiseDialog, open: false })}>
            Cancel
          </Button>
          <Button onClick={handleAddExpertise} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Availability Dialog */}
      <Dialog open={availabilityDialog.open} onClose={() => setAvailabilityDialog({ ...availabilityDialog, open: false })}>
        <DialogTitle>Add Availability</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Day</InputLabel>
                <Select
                  value={availabilityDialog.day}
                  onChange={(e) => setAvailabilityDialog({ ...availabilityDialog, day: e.target.value })}
                  label="Day"
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <MenuItem key={day} value={day}>
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Time"
                type="time"
                value={availabilityDialog.startTime}
                onChange={(e) => setAvailabilityDialog({ ...availabilityDialog, startTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Time"
                type="time"
                value={availabilityDialog.endTime}
                onChange={(e) => setAvailabilityDialog({ ...availabilityDialog, endTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAvailabilityDialog({ ...availabilityDialog, open: false })}>
            Cancel
          </Button>
          <Button onClick={handleAddAvailability} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile; 