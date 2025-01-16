import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Chip,
  Slider,
  Alert
} from '@mui/material';
import { useApi } from '../../hooks/useApi';

const EXPERTISE_CATEGORIES = [
  'Web Development',
  'Mobile Development',
  'Data Science',
  'Machine Learning',
  'DevOps',
  'Cloud Computing',
  'Cybersecurity',
  'UI/UX Design'
];

const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Chinese',
  'Japanese',
  'Korean',
  'Hindi'
];

const MENTORSHIP_STYLES = [
  'Hands-on',
  'Project-based',
  'Theory-focused',
  'Discussion-based',
  'Goal-oriented',
  'Flexible'
];

const PreferencesForm = () => {
  const [formData, setFormData] = useState({
    learningGoals: [],
    availability: [],
    preferredLanguages: [],
    maxHourlyRate: 50,
    preferredMentorshipStyle: []
  });

  const [newGoal, setNewGoal] = useState({
    category: '',
    targetLevel: 'Beginner',
    priority: 'Medium',
    timeframe: '3 months'
  });

  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const { post, get } = useApi();

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await get('/api/matching/preferences');
        if (response.data) {
          setFormData(response.data);
        }
      } catch (error) {
        console.error('Error fetching preferences:', error);
      }
    };

    fetchPreferences();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await post('/api/matching/preferences', formData);
      setAlert({
        show: true,
        type: 'success',
        message: 'Preferences saved successfully!'
      });
    } catch (error) {
      setAlert({
        show: true,
        type: 'error',
        message: 'Error saving preferences. Please try again.'
      });
    }
  };

  const addLearningGoal = () => {
    if (newGoal.category) {
      setFormData(prev => ({
        ...prev,
        learningGoals: [...prev.learningGoals, newGoal]
      }));
      setNewGoal({
        category: '',
        targetLevel: 'Beginner',
        priority: 'Medium',
        timeframe: '3 months'
      });
    }
  };

  const removeLearningGoal = (index) => {
    setFormData(prev => ({
      ...prev,
      learningGoals: prev.learningGoals.filter((_, i) => i !== index)
    }));
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Mentee Preferences
        </Typography>

        {alert.show && (
          <Alert severity={alert.type} sx={{ mb: 2 }} onClose={() => setAlert({ show: false })}>
            {alert.message}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Learning Goals Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Learning Goals
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={newGoal.category}
                        onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                        label="Category"
                      >
                        {EXPERTISE_CATEGORIES.map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth>
                      <InputLabel>Target Level</InputLabel>
                      <Select
                        value={newGoal.targetLevel}
                        onChange={(e) => setNewGoal({ ...newGoal, targetLevel: e.target.value })}
                        label="Target Level"
                      >
                        {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                          <MenuItem key={level} value={level}>
                            {level}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth>
                      <InputLabel>Priority</InputLabel>
                      <Select
                        value={newGoal.priority}
                        onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value })}
                        label="Priority"
                      >
                        {['Low', 'Medium', 'High'].map((priority) => (
                          <MenuItem key={priority} value={priority}>
                            {priority}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Button
                      variant="contained"
                      onClick={addLearningGoal}
                      fullWidth
                      sx={{ height: '56px' }}
                    >
                      Add Goal
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              <Box sx={{ mb: 2 }}>
                {formData.learningGoals.map((goal, index) => (
                  <Chip
                    key={index}
                    label={`${goal.category} - ${goal.targetLevel} (${goal.priority})`}
                    onDelete={() => removeLearningGoal(index)}
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
            </Grid>

            {/* Languages Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Preferred Languages
              </Typography>
              <FormControl fullWidth>
                <Select
                  multiple
                  value={formData.preferredLanguages}
                  onChange={(e) => setFormData({ ...formData, preferredLanguages: e.target.value })}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} />
                      ))}
                    </Box>
                  )}
                >
                  {LANGUAGES.map((language) => (
                    <MenuItem key={language} value={language}>
                      {language}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Maximum Hourly Rate */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Maximum Hourly Rate (USD)
              </Typography>
              <Slider
                value={formData.maxHourlyRate}
                onChange={(e, newValue) => setFormData({ ...formData, maxHourlyRate: newValue })}
                valueLabelDisplay="auto"
                min={10}
                max={200}
                step={5}
              />
            </Grid>

            {/* Mentorship Style */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Preferred Mentorship Style
              </Typography>
              <FormControl fullWidth>
                <Select
                  multiple
                  value={formData.preferredMentorshipStyle}
                  onChange={(e) => setFormData({ ...formData, preferredMentorshipStyle: e.target.value })}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} />
                      ))}
                    </Box>
                  )}
                >
                  {MENTORSHIP_STYLES.map((style) => (
                    <MenuItem key={style} value={style}>
                      {style}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
              >
                Save Preferences
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
};

export default PreferencesForm; 