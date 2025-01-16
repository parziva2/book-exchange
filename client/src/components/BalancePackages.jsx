import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Chip,
} from '@mui/material';
import {
  Check as CheckIcon,
  Star as StarIcon,
} from '@mui/icons-material';

const BalancePackages = ({ packages, onSelectPackage, selectedPackage }) => {
  return (
    <Grid container spacing={3} justifyContent="center">
      {packages.map((pkg) => (
        <Grid item xs={12} sm={6} md={4} key={pkg.id}>
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
              },
              ...(pkg.id === 'premium' && {
                borderColor: 'primary.main',
                borderWidth: 2,
                borderStyle: 'solid',
              }),
            }}
          >
            {pkg.id === 'premium' && (
              <Chip
                label="Most Popular"
                color="primary"
                icon={<StarIcon />}
                sx={{
                  position: 'absolute',
                  top: -12,
                  right: 16,
                  zIndex: 1,
                }}
              />
            )}
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                {pkg.name}
              </Typography>
              <Typography
                variant="h4"
                component="div"
                gutterBottom
                sx={{ color: 'primary.main' }}
              >
                ${pkg.price}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {pkg.description}
              </Typography>
              <List dense>
                {pkg.features.map((feature, index) => (
                  <ListItem key={index} disableGutters>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={feature} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
            <Box sx={{ p: 2, pt: 0 }}>
              <Button
                fullWidth
                variant={selectedPackage?.id === pkg.id ? "contained" : "outlined"}
                onClick={() => onSelectPackage(pkg)}
                sx={{ textTransform: 'none' }}
              >
                {selectedPackage?.id === pkg.id ? 'Selected' : 'Select Package'}
              </Button>
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default BalancePackages; 