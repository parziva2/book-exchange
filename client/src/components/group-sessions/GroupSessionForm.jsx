import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Grid,
  MenuItem,
  Chip,
  InputAdornment,
  FormHelperText
} from '@mui/material';
import { useGroupSession } from '../../contexts/GroupSessionContext';
import { useNotifications } from '../../contexts/NotificationContext';

const skillLevels = ['beginner', 'intermediate', 'advanced'];

const GroupSessionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotifications();
  const {
    currentSession,
    loading,
    error,
    fetchGroupSession,
    createGroupSession,
    updateGroupSession
  } = useGroupSession();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    duration: 60,
    maxParticipants: 10,
    price: 0,
    topics: [],
    skillLevel: 'beginner',
    meetingLink: ''
  });

  const [newTopic, setNewTopic] = useState('');
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (id) {
      fetchGroupSession(id).then(session => {
        if (session) {
          const startTime = new Date(session.startTime);
          startTime.setMinutes(startTime.getMinutes() - startTime.getTimezoneOffset());
          
          setFormData({
            title: session.title,
            description: session.description,
            startTime: startTime.toISOString().slice(0, 16),
            duration: session.duration,
            maxParticipants: session.maxParticipants,
            price: session.price,
            topics: session.topics,
            skillLevel: session.skillLevel,
            meetingLink: session.meetingLink || ''
          });
        }
      });
    }
  }, [id, fetchGroupSession]);

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    if (!formData.startTime) {
      errors.startTime = 'Start time is required';
    } else {
      const startDate = new Date(formData.startTime);
      if (startDate < new Date()) {
        errors.startTime = 'Start time must be in the future';
      }
    }
    if (formData.duration < 30 || formData.duration > 180) {
      errors.duration = 'Duration must be between 30 and 180 minutes';
    }
    if (formData.maxParticipants < 2 || formData.maxParticipants > 20) {
      errors.maxParticipants = 'Maximum participants must be between 2 and 20';
    }
    if (formData.price < 0) {
      errors.price = 'Price cannot be negative';
    }
    if (formData.topics.length === 0) {
      errors.topics = 'At least one topic is required';
    }
    if (formData.meetingLink && !isValidUrl(formData.meetingLink)) {
      errors.meetingLink = 'Please enter a valid URL';
    }
    return errors;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleAddTopic = () => {
    if (newTopic.trim() && !formData.topics.includes(newTopic.trim())) {
      setFormData(prev => ({
        ...prev,
        topics: [...prev.topics, newTopic.trim()]
      }));
      setNewTopic('');
      // Clear topics error if it exists
      if (formErrors.topics) {
        setFormErrors(prev => ({
          ...prev,
          topics: undefined
        }));
      }
    }
  };

  const handleRemoveTopic = (topicToRemove) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.filter(topic => topic !== topicToRemove)
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      if (id) {
        await updateGroupSession(id, formData);
        showNotification('success', 'Group session updated successfully');
      } else {
        await createGroupSession(formData);
        showNotification('success', 'Group session created successfully');
      }
      navigate('/group-sessions');
    } catch (error) {
      console.error('Failed to save group session:', error);
      showNotification('error', 'Failed to save group session');
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {id ? 'Edit Group Session' : 'Create Group Session'}
          </Typography>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Title"
                  fullWidth
                  value={formData.title}
                  onChange={handleInputChange('title')}
                  error={!!formErrors.title}
                  helperText={formErrors.title}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  error={!!formErrors.description}
                  helperText={formErrors.description}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Start Time"
                  type="datetime-local"
                  fullWidth
                  value={formData.startTime}
                  onChange={handleInputChange('startTime')}
                  InputLabelProps={{ shrink: true }}
                  error={!!formErrors.startTime}
                  helperText={formErrors.startTime}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Duration (minutes)"
                  type="number"
                  fullWidth
                  value={formData.duration}
                  onChange={handleInputChange('duration')}
                  InputProps={{
                    inputProps: { min: 30, max: 180 }
                  }}
                  error={!!formErrors.duration}
                  helperText={formErrors.duration}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Maximum Participants"
                  type="number"
                  fullWidth
                  value={formData.maxParticipants}
                  onChange={handleInputChange('maxParticipants')}
                  InputProps={{
                    inputProps: { min: 2, max: 20 }
                  }}
                  error={!!formErrors.maxParticipants}
                  helperText={formErrors.maxParticipants}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Price"
                  type="number"
                  fullWidth
                  value={formData.price}
                  onChange={handleInputChange('price')}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    inputProps: { min: 0, step: 0.01 }
                  }}
                  error={!!formErrors.price}
                  helperText={formErrors.price}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  select
                  label="Skill Level"
                  fullWidth
                  value={formData.skillLevel}
                  onChange={handleInputChange('skillLevel')}
                >
                  {skillLevels.map(level => (
                    <MenuItem key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      label="Add Topic"
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTopic();
                        }
                      }}
                      fullWidth
                    />
                    <Button
                      variant="contained"
                      onClick={handleAddTopic}
                      disabled={!newTopic.trim()}
                    >
                      Add
                    </Button>
                  </Stack>
                  <Box>
                    {formData.topics.map(topic => (
                      <Chip
                        key={topic}
                        label={topic}
                        onDelete={() => handleRemoveTopic(topic)}
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </Box>
                  {formErrors.topics && (
                    <FormHelperText error>{formErrors.topics}</FormHelperText>
                  )}
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Meeting Link"
                  fullWidth
                  value={formData.meetingLink}
                  onChange={handleInputChange('meetingLink')}
                  error={!!formErrors.meetingLink}
                  helperText={formErrors.meetingLink}
                />
              </Grid>

              <Grid item xs={12}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/group-sessions')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                  >
                    {id ? 'Update Session' : 'Create Session'}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default GroupSessionForm; 