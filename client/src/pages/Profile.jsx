import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Avatar,
  Box,
  Button,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
  LinearProgress,
  IconButton,
} from '@mui/material';
import {
  Email as EmailIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Star as StarIcon,
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const Profile = () => {
  const { user, checkAuth } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    bio: '',
    expertise: '',
    hourlyRate: '',
    firstName: '',
    lastName: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/profile');
      console.log('Fetched profile data:', response.data.data.user);
      setProfile(response.data.data.user);
      setFormData({
        bio: response.data.data.user.mentorProfile?.bio || '',
        expertise: response.data.data.user.mentorProfile?.expertise?.join(', ') || '',
        hourlyRate: response.data.data.user.mentorProfile?.hourlyRate || '',
        firstName: response.data.data.user.firstName || '',
        lastName: response.data.data.user.lastName || '',
      });
      console.log('Set form data:', formData);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const updatedData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        bio: formData.bio,
        expertise: formData.expertise ? formData.expertise.split(',').map(skill => skill.trim()) : [],
        hourlyRate: formData.hourlyRate || 0,
      };
      
      console.log('Form data before sending:', formData);
      console.log('Sending update with data:', updatedData);
      const response = await api.put('/users/profile', updatedData);
      console.log('Update response:', response.data);
      
      if (response.data.status === 'success') {
        await checkAuth();
        await fetchProfile();
        setIsEditing(false);
        setError('');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      console.log('Uploading file:', file.name);

      const response = await api.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log('Upload progress:', progress);
          setUploadProgress(progress);
        }
      });

      console.log('Upload response:', response.data);

      if (response.data.status === 'success') {
        console.log('Upload successful, refreshing user data');
        await checkAuth(); // Refresh user data
        await fetchProfile();
        setUploadProgress(0);
        setError('');
      } else {
        console.error('Upload failed:', response.data);
        throw new Error(response.data.message || 'Failed to upload avatar');
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError(err.response?.data?.message || 'Failed to upload avatar');
      setUploadProgress(0);
    }
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Grid container spacing={3}>
        {/* Profile Overview */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleFileChange}
            />
            <Box sx={{ position: 'relative', width: 'fit-content', margin: '0 auto' }}>
              <Avatar
                src={profile?.avatar ? `http://localhost:5000${profile.avatar}` : undefined}
                sx={{
                  width: 120,
                  height: 120,
                  bgcolor: 'primary.main',
                }}
              >
                {profile?.firstName?.[0]?.toUpperCase()}
              </Avatar>
              <IconButton
                color="primary"
                onClick={handleAvatarClick}
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: 'background.paper',
                  boxShadow: 1,
                  '&:hover': {
                    backgroundColor: 'background.paper',
                    opacity: 0.9,
                  },
                }}
                size="small"
              >
                <PhotoCameraIcon />
              </IconButton>
            </Box>
            {uploadProgress > 0 && (
              <Box sx={{ width: '100%', mt: 1 }}>
                <LinearProgress variant="determinate" value={uploadProgress} />
              </Box>
            )}
            <Typography variant="h5" gutterBottom>
              {user?.firstName} {user?.lastName}
            </Typography>
            {user?.isMentor && (
              <Chip
                label="Mentor"
                color="primary"
                sx={{ mb: 2 }}
              />
            )}
            <List>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText primary={user?.email} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText primary={`Member since ${new Date(user?.createdAt).toLocaleDateString()}`} />
              </ListItem>
              {user?.isMentor && (
                <>
                  <ListItem>
                    <ListItemIcon>
                      <StarIcon />
                    </ListItemIcon>
                    <ListItemText primary={`Rating: ${profile?.rating || 'No ratings yet'}`} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <SchoolIcon />
                    </ListItemIcon>
                    <ListItemText primary={`Sessions: ${profile?.sessionCount || 0}`} />
                  </ListItem>
                </>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Profile Details */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Profile Details</Typography>
              {!isEditing ? (
                <Button
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                  variant="outlined"
                >
                  Edit Profile
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  variant="contained"
                  color="primary"
                >
                  Save Changes
                </Button>
              )}
            </Box>

            <Divider sx={{ mb: 3 }} />

            {isEditing ? (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell us about yourself"
                  />
                </Grid>
                {user?.isMentor && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Expertise (comma-separated)"
                        name="expertise"
                        value={formData.expertise}
                        onChange={handleChange}
                        helperText="Enter your areas of expertise, separated by commas"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Hourly Rate ($)"
                        name="hourlyRate"
                        value={formData.hourlyRate}
                        onChange={handleChange}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            ) : (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Bio
                </Typography>
                <Typography paragraph color="text.secondary">
                  {profile?.mentorProfile?.bio || 'No bio provided'}
                </Typography>

                {user?.isMentor && (
                  <>
                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                      Expertise
                    </Typography>
                    <Box sx={{ mb: 3 }}>
                      {profile?.mentorProfile?.expertise?.map((skill) => (
                        <Chip
                          key={skill}
                          label={skill}
                          sx={{ mr: 1, mb: 1 }}
                        />
                      )) || 'No expertise listed'}
                    </Box>

                    <Typography variant="subtitle1" gutterBottom>
                      Hourly Rate
                    </Typography>
                    <Typography color="text.secondary">
                      ${profile?.mentorProfile?.hourlyRate || 0}/hour
                    </Typography>
                  </>
                )}
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile; 