import ReactGA from 'react-ga4';

// Initialize GA4
export const initGA = () => {
  ReactGA.initialize('G-359NF4PLLW');
};

// Track page views
export const trackPageView = (path) => {
  ReactGA.send({ hitType: 'pageview', page: path });
};

// Track events
export const trackEvent = (category, action, label = null, value = null) => {
  ReactGA.event({
    category,
    action,
    label,
    value,
  });
};

// Track user interactions
export const trackInteraction = (action, data = {}) => {
  ReactGA.event({
    category: 'User Interaction',
    action,
    ...data
  });
};

// Track errors
export const trackError = (error, componentName = null) => {
  ReactGA.event({
    category: 'Error',
    action: error.message || 'Unknown error',
    label: componentName,
  });
}; 