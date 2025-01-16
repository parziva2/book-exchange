import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Box, 
  Button, 
  Grid, 
  Chip, 
  CircularProgress, 
  Alert,
  Checkbox,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Avatar,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';

const EditMentorProfile = () => {
  const navigate = useNavigate();
  const api = useApi();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    expertise: [],
    hourlyRate: '',
    languages: [],
    timezone: '',
    education: [],
    experience: [],
    certificates: [],
    linkedinProfile: '',
    portfolioUrl: '',
    status: '',
    rating: 0,
    reviewCount: 0
  });
  const [newExpertise, setNewExpertise] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newCertificate, setNewCertificate] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);

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
    // Check if user is a mentor before loading profile
    const checkMentorStatus = async () => {
      try {
        const userResponse = await api.get('/auth/me');
        const userData = userResponse.data?.data || userResponse.data?.user || userResponse.data;
        
        if (!userData?.roles?.includes('mentor')) {
          navigate('/become-mentor');
          return;
        }
        
        fetchMentorProfile();
      } catch (err) {
        console.error('Error checking mentor status:', err);
        setError('Failed to verify mentor status');
        setLoading(false);
      }
    };

    checkMentorStatus();
  }, []);

  const fetchMentorProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current mentor profile
      const response = await api.get('/mentors/me');
      console.log('Mentor profile response:', response.data);
      
      // Try to get mentor data from different possible response formats
      const mentorData = response.data?.data?.mentor || response.data?.mentor || response.data;
      
      if (!mentorData || typeof mentorData !== 'object') {
        console.error('Invalid response:', response.data);
        throw new Error('Could not load mentor profile data');
      }

      console.log('Setting form data with:', mentorData);

      // Set form data with mentor profile data
      setFormData({
        firstName: mentorData.firstName || '',
        lastName: mentorData.lastName || '',
        bio: mentorData.bio || '',
        expertise: Array.isArray(mentorData.expertise) ? mentorData.expertise : [],
        hourlyRate: mentorData.hourlyRate || '',
        languages: Array.isArray(mentorData.languages) ? mentorData.languages : [],
        timezone: mentorData.timezone || '',
        education: Array.isArray(mentorData.education) ? mentorData.education : [],
        experience: Array.isArray(mentorData.experience) ? mentorData.experience : [],
        certificates: Array.isArray(mentorData.certificates) ? mentorData.certificates : [],
        linkedinProfile: mentorData.linkedinProfile || '',
        portfolioUrl: mentorData.portfolioUrl || '',
        status: mentorData.status || '',
        rating: mentorData.rating || 0,
        reviewCount: mentorData.reviewCount || 0
      });

      // Set profile picture if available
      if (mentorData.avatar) {
        const fullUrl = mentorData.avatar.startsWith('http') 
          ? mentorData.avatar 
          : `http://localhost:5000${mentorData.avatar}`;
        console.log('Setting profile picture URL:', fullUrl);
        setPreviewUrl(fullUrl);
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
      if (err.response?.status === 404) {
        setError('Mentor profile not found. Please complete your mentor profile setup.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to access this profile.');
        navigate('/dashboard');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load mentor profile. Please try refreshing the page.');
      }
    } finally {
      setLoading(false);
    }
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

      setSaving(true);
      setError(null);
      
      // Prepare update data
      const updateData = {
        bio: formData.bio,
        expertise: formData.expertise,
        hourlyRate: parseFloat(formData.hourlyRate),
        languages: formData.languages,
        timezone: formData.timezone,
        education: formData.education || [],
        experience: formData.experience || [],
        certificates: formData.certificates || [],
        linkedinProfile: formData.linkedinProfile || '',
        portfolioUrl: formData.portfolioUrl || ''
      };
      
      console.log('Sending update data:', updateData);
      
      const response = await api.put('/mentors/profile', updateData);
      
      console.log('Update response:', response.data);
      
      // Check if the response indicates success
      if (response.data?.status === 'success') {
        // Get the updated mentor data from the response
        const updatedMentor = response.data?.data?.mentor || response.data?.mentor;
        
        if (updatedMentor) {
          navigate('/mentor-dashboard');
          return;
        }
      }
      
      throw new Error('Failed to update profile');
    } catch (err) {
      console.error('Error updating profile:', err);
      console.error('Error details:', {
        response: err.response,
        data: err.response?.data,
        status: err.response?.status,
        message: err.message
      });
      setError(err.response?.data?.message || err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
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

  const handleProfilePictureChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        setError(null);
        // Create a FormData object for the profile picture
        const pictureFormData = new FormData();
        pictureFormData.append('avatar', file);

        // Update user profile picture
        await api.post('/users/avatar', pictureFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        // Update the preview
        setProfilePicture(file);
        setPreviewUrl(URL.createObjectURL(file));

        // Refresh the mentor profile to get updated data
        await fetchMentorProfile();
      } catch (err) {
        console.error('Error updating profile picture:', err);
        setError(err.response?.data?.message || 'Failed to update profile picture. Please try again.');
        
        // Log more details about the error
        if (err.response) {
          console.error('Error response:', {
            status: err.response.status,
            data: err.response.data,
            headers: err.response.headers,
          });
        }
      }
    }
  };

  const handleRemoveProfilePicture = async () => {
    try {
      setError(null);
      // Remove profile picture from user profile
      await api.delete('/users/avatar');

      setProfilePicture(null);
      setPreviewUrl('');

      // Refresh the mentor profile to get updated data
      await fetchMentorProfile();
    } catch (err) {
      console.error('Error removing profile picture:', err);
      setError(err.response?.data?.message || 'Failed to remove profile picture');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Edit Profile
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                position: 'relative',
                mb: 4
              }}>
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    src={previewUrl}
                    sx={{ 
                      width: 100, 
                      height: 100,
                      border: '4px solid white',
                      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)'
                    }}
                  />
                  <IconButton
                    component="label"
                    sx={{
                      position: 'absolute',
                      bottom: -6,
                      right: -6,
                      backgroundColor: '#fff',
                      border: '2px solid #1976d2',
                      padding: '4px',
                      '&:hover': {
                        backgroundColor: '#f5f5f5'
                      }
                    }}
                    size="small"
                  >
                    <AddPhotoAlternateIcon 
                      sx={{ 
                        fontSize: 16,
                        color: '#1976d2'
                      }} 
                    />
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                    />
                  </IconButton>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
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
                  Certificates
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={newCertificate}
                    onChange={(e) => setNewCertificate(e.target.value)}
                    placeholder="Add certificate"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddCertificate();
                      }
                    }}
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
                  {formData.certificates.map((certificate, index) => (
                    <Chip
                      key={index}
                      label={certificate}
                      onDelete={() => handleRemoveCertificate(certificate)}
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
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/mentor-dashboard')}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default EditMentorProfile; 