import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
  Chip,
  Stack,
  InputAdornment,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Avatar,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const BecomeMentor = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [formData, setFormData] = useState({
    bio: '',
    expertise: [],
    hourlyRate: '',
    languages: [],
    timezone: '',
    education: [],
    experience: [],
    certificates: [],
    linkedinProfile: '',
    portfolioUrl: ''
  });
  const [newExpertise, setNewExpertise] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newCertificate, setNewCertificate] = useState('');

  // Updated timezone list with UTC offsets
  const timezones = [
    'UTC (UTC+0)',
    'America/New_York (UTC-5)',
    'America/Chicago (UTC-6)',
    'America/Denver (UTC-7)',
    'America/Los_Angeles (UTC-8)',
    'America/Toronto (UTC-5)',
    'America/Vancouver (UTC-8)',
    'America/Mexico_City (UTC-6)',
    'America/Sao_Paulo (UTC-3)',
    'America/Buenos_Aires (UTC-3)',
    'America/Lima (UTC-5)',
    'America/Bogota (UTC-5)',
    'Europe/London (UTC+0)',
    'Europe/Paris (UTC+1)',
    'Europe/Berlin (UTC+1)',
    'Europe/Rome (UTC+1)',
    'Europe/Madrid (UTC+1)',
    'Europe/Amsterdam (UTC+1)',
    'Europe/Brussels (UTC+1)',
    'Europe/Vienna (UTC+1)',
    'Europe/Stockholm (UTC+1)',
    'Europe/Oslo (UTC+1)',
    'Europe/Copenhagen (UTC+1)',
    'Europe/Moscow (UTC+3)',
    'Europe/Istanbul (UTC+3)',
    'Asia/Dubai (UTC+4)',
    'Asia/Mumbai (UTC+5:30)',
    'Asia/Kolkata (UTC+5:30)',
    'Asia/Bangkok (UTC+7)',
    'Asia/Jakarta (UTC+7)',
    'Asia/Shanghai (UTC+8)',
    'Asia/Singapore (UTC+8)',
    'Asia/Tokyo (UTC+9)',
    'Asia/Hong_Kong (UTC+8)',
    'Asia/Seoul (UTC+9)',
    'Asia/Manila (UTC+8)',
    'Asia/Taipei (UTC+8)',
    'Australia/Sydney (UTC+10)',
    'Australia/Melbourne (UTC+10)',
    'Australia/Brisbane (UTC+10)',
    'Australia/Perth (UTC+8)',
    'Pacific/Auckland (UTC+12)',
    'Pacific/Fiji (UTC+12)',
    'Africa/Cairo (UTC+2)',
    'Africa/Lagos (UTC+1)',
    'Africa/Johannesburg (UTC+2)',
    'Africa/Nairobi (UTC+3)'
  ];

  useEffect(() => {
    const initializePage = async () => {
      try {
        // Check if user exists and has mentor profile
        if (!user) {
          return; // Will show loading state
        }

    if (user?.mentorProfile?.status === 'approved') {
      navigate('/mentor-dashboard');
          return;
        }

        // Initialize any other data if needed
        
        setLoading(false); // Only set loading to false when everything is ready
      } catch (err) {
        console.error('Error initializing page:', err);
        setError('Failed to load the page. Please refresh and try again.');
        setLoading(false);
      }
    };

    initializePage();
  }, [user, navigate]);

  const handleProfilePictureChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setProfilePicture(file);
      setProfilePictureUrl(URL.createObjectURL(file));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddExpertise = () => {
    if (newExpertise.trim() && !formData.expertise.includes(newExpertise.trim())) {
      setFormData(prev => ({
        ...prev,
        expertise: [...prev.expertise, newExpertise.trim()]
      }));
      setNewExpertise('');
    }
  };

  const handleRemoveExpertise = (skill) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise.filter(s => s !== skill)
    }));
  };

  const handleAddLanguage = () => {
    if (newLanguage.trim() && !formData.languages.includes(newLanguage.trim())) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, newLanguage.trim()]
      }));
      setNewLanguage('');
    }
  };

  const handleRemoveLanguage = (language) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l !== language)
    }));
  };

  const handleAddCertificate = () => {
    if (newCertificate.trim() && !formData.certificates.includes(newCertificate.trim())) {
      setFormData(prev => ({
        ...prev,
        certificates: [...prev.certificates, newCertificate.trim()]
      }));
      setNewCertificate('');
    }
  };

  const handleRemoveCertificate = (certificate) => {
    setFormData(prev => ({
      ...prev,
      certificates: prev.certificates.filter(c => c !== certificate)
    }));
  };

  const handleEducationChange = (index, field, value) => {
    setFormData(prev => {
      const education = [...prev.education];
      education[index] = { ...education[index], [field]: value };
      return { ...prev, education };
    });
  };

  const handleExperienceChange = (index, field, value) => {
    setFormData(prev => {
      const experience = [...prev.experience];
      experience[index] = { ...experience[index], [field]: value };
      return { ...prev, experience };
    });
  };

  const handleAddEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { institution: '', degree: '', field: '', startYear: '', endYear: '', description: '' }]
    }));
  };

  const handleRemoveEducation = (index) => {
    setFormData(prev => {
      const education = [...prev.education];
      education.splice(index, 1);
      return { ...prev, education };
    });
  };

  const handleAddExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, { company: '', position: '', startDate: '', endDate: '', current: false, description: '' }]
    }));
  };

  const handleRemoveExperience = (index) => {
    setFormData(prev => {
      const experience = [...prev.experience];
      experience.splice(index, 1);
      return { ...prev, experience };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitted(true);
    
    try {
      // Validate mandatory fields
      if (!formData.expertise.length) {
        setError('Please add at least one expertise');
        return;
      }
      if (!formData.timezone) {
        setError('Please select your timezone');
      return;
    }
      if (!formData.languages.length) {
        setError('Please add at least one language');
      return;
    }

      setSubmitting(true);
      setError('');
      setSuccess(false);

      // First upload profile picture if exists
      let profilePictureUrl = '';
      if (profilePicture) {
        const formData = new FormData();
        formData.append('profilePicture', profilePicture);
        try {
          const uploadResponse = await api.post('/users/upload-profile-picture', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          profilePictureUrl = uploadResponse.data.url;
        } catch (uploadErr) {
          console.error('Error uploading profile picture:', uploadErr);
          throw new Error('Failed to upload profile picture. Please try again.');
        }
      }

      // Prepare application data
      const mentorData = {
        bio: formData.bio,
        expertise: formData.expertise,
        hourlyRate: parseFloat(formData.hourlyRate) || 0,
        languages: formData.languages,
        timezone: formData.timezone,
        education: formData.education,
        experience: formData.experience,
        certificates: formData.certificates,
        linkedinProfile: formData.linkedinProfile,
        portfolioUrl: formData.portfolioUrl,
        profilePicture: profilePictureUrl
      };

      console.log('Submitting mentor application:', mentorData);
      const response = await api.post('/mentors/apply', mentorData);
      
      if (response.data?.status === 'success') {
        setSuccess(true);
        setError('');
        await refreshUser();
        // Show success message for 3 seconds before redirecting
        setTimeout(() => {
          navigate('/mentor-dashboard');
        }, 3000);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (err) {
      console.error('Error submitting mentor application:', err);
      setError(err.response?.data?.message || 'Failed to submit mentor application. Please try again.');
      setSuccess(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading state while initializing
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Show error state if initialization failed
  if (error && !formSubmitted) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
          <Button 
            color="inherit" 
            size="small" 
            onClick={() => window.location.reload()}
            sx={{ ml: 2 }}
          >
            Retry
          </Button>
        </Alert>
      </Container>
    );
  }

  // If user has a pending mentor profile
  if (user?.mentorProfile?.status === 'pending') {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Application Status
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            Your mentor application is currently under review. Our team will carefully evaluate your qualifications and experience.
            You will be notified via email once a decision has been made.
        </Alert>

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              What happens next?
            </Typography>
            <Typography component="div" sx={{ mb: 2 }}>
              <ul>
                <li>Our team will review your application within 2-3 business days</li>
                <li>You'll receive an email notification about the decision</li>
                <li>If approved, you'll get access to the mentor dashboard</li>
                <li>If changes are needed, we'll provide specific feedback</li>
              </ul>
            </Typography>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate('/')}
            >
              Return to Home
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  // If user has a rejected mentor profile
  if (user?.mentorProfile?.status === 'rejected') {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">
          Your previous mentor application was not approved. Please contact support for more information or submit a new application.
        </Alert>
        <Button
          variant="contained"
          color="primary"
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Submit New Application
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Become a Mentor
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Share your expertise and help others grow while earning. Complete the form below to apply as a mentor.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Application submitted successfully! Our team will review your application and get back to you soon. 
            You will be redirected to the dashboard in a few seconds...
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Profile Picture Upload */}
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={profilePictureUrl || user?.avatar}
                  sx={{ width: 120, height: 120, mb: 2 }}
                >
                  {user?.firstName?.[0]}
                </Avatar>
                <input
                  accept="image/*"
                  type="file"
                  id="profile-picture-input"
                  onChange={handleProfilePictureChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="profile-picture-input">
                  <IconButton
                    color="primary"
                    component="span"
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      right: -8,
                      backgroundColor: 'background.paper',
                      '&:hover': { backgroundColor: 'background.default' }
                    }}
                  >
                    <PhotoCamera />
                  </IconButton>
                </label>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                multiline
                rows={4}
                required
                helperText="Describe your teaching philosophy, methodology, and what makes you a great mentor"
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Expertise *
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                    size="small"
                    value={newExpertise}
                    onChange={(e) => setNewExpertise(e.target.value)}
                    placeholder="Add expertise"
                    error={formSubmitted && formData.expertise.length === 0}
                    helperText={formSubmitted && formData.expertise.length === 0 ? "At least one expertise is required" : ""}
                />
                <Button
                    variant="contained" 
                  onClick={handleAddExpertise}
                    sx={{ minWidth: '100px', height: '40px' }}
                >
                    ADD
                </Button>
              </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {formData.expertise.map((skill, index) => (
                  <Chip
                      key={index}
                      label={skill}
                      onDelete={() => handleRemoveExpertise(skill)}
                  />
                ))}
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hourly Rate ($)"
                name="hourlyRate"
                type="number"
                value={formData.hourlyRate}
                onChange={handleInputChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={formSubmitted && !formData.timezone}>
                <InputLabel id="timezone-label">Timezone</InputLabel>
                <Select
                  labelId="timezone-label"
                  id="timezone"
                  name="timezone"
                  value={formData.timezone}
                onChange={handleInputChange}
                  label="Timezone"
                >
                  {timezones.map((tz) => {
                    const [zone, offset] = tz.split(' ');
                    return (
                      <MenuItem key={zone} value={zone}>
                        {zone.replace(/_/g, ' ')} {offset}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Languages *
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                    size="small"
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    placeholder="Add language"
                    error={formSubmitted && formData.languages.length === 0}
                    helperText={formSubmitted && formData.languages.length === 0 ? "At least one language is required" : ""}
                />
                <Button
                    variant="contained"
                  onClick={handleAddLanguage}
                    sx={{ minWidth: '100px', height: '40px' }}
                >
                    ADD
                </Button>
              </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {formData.languages.map((language, index) => (
                  <Chip
                      key={index}
                      label={language}
                      onDelete={() => handleRemoveLanguage(language)}
                  />
                ))}
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Certificates
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                fullWidth
                    size="small"
                    value={newCertificate}
                    onChange={(e) => setNewCertificate(e.target.value)}
                    placeholder="Add certificate"
                  />
                  <Button 
                    variant="contained"
                    onClick={handleAddCertificate}
                    sx={{ minWidth: '100px', height: '40px' }}
                  >
                    ADD
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {formData.certificates.map((cert, index) => (
                    <Chip
                      key={index}
                      label={cert}
                      onDelete={() => handleRemoveCertificate(cert)}
                    />
                  ))}
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="LinkedIn Profile"
                name="linkedinProfile"
                value={formData.linkedinProfile}
                onChange={handleInputChange}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Portfolio URL"
                name="portfolioUrl"
                value={formData.portfolioUrl}
                onChange={handleInputChange}
                placeholder="https://yourportfolio.com"
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Education
                </Typography>
                {formData.education.map((edu, index) => (
                  <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Institution"
                          value={edu.institution}
                          onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Degree"
                          value={edu.degree}
                          onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Field of Study"
                          value={edu.field}
                          onChange={(e) => handleEducationChange(index, 'field', e.target.value)}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Start Year"
                          type="number"
                          value={edu.startYear}
                          onChange={(e) => handleEducationChange(index, 'startYear', e.target.value)}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="End Year"
                          type="number"
                          value={edu.endYear}
                          onChange={(e) => handleEducationChange(index, 'endYear', e.target.value)}
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Description"
                          multiline
                          rows={2}
                          value={edu.description}
                          onChange={(e) => handleEducationChange(index, 'description', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button 
                          variant="outlined" 
                          color="error" 
                          onClick={() => handleRemoveEducation(index)}
                        >
                          Remove Education
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                ))}
                <Button 
                  variant="outlined" 
                  onClick={handleAddEducation}
                  startIcon={<AddIcon />}
                >
                  Add Education
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Experience
                </Typography>
                {formData.experience.map((exp, index) => (
                  <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Company"
                          value={exp.company}
                          onChange={(e) => handleExperienceChange(index, 'company', e.target.value)}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Position"
                          value={exp.position}
                          onChange={(e) => handleExperienceChange(index, 'position', e.target.value)}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Start Date"
                          type="date"
                          value={exp.startDate ? new Date(exp.startDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => handleExperienceChange(index, 'startDate', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="End Date"
                          type="date"
                          value={exp.endDate ? new Date(exp.endDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => handleExperienceChange(index, 'endDate', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          disabled={exp.current}
                          required={!exp.current}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={exp.current}
                              onChange={(e) => handleExperienceChange(index, 'current', e.target.checked)}
                            />
                          }
                          label="I currently work here"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Description"
                          multiline
                          rows={3}
                          value={exp.description}
                          onChange={(e) => handleExperienceChange(index, 'description', e.target.value)}
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button 
                          variant="outlined" 
                          color="error" 
                          onClick={() => handleRemoveExperience(index)}
                        >
                          Remove Experience
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                ))}
                <Button 
                  variant="outlined" 
                  onClick={handleAddExperience}
                  startIcon={<AddIcon />}
                >
                  Add Experience
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={submitting || success}
              >
                {submitting ? <CircularProgress size={24} color="inherit" /> : 'Submit Application'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default BecomeMentor; 