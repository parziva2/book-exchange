export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
};

export const isInPast = (dateString) => {
  const date = new Date(dateString);
  return date < new Date();
};

export const isInFuture = (dateString) => {
  const date = new Date(dateString);
  return date > new Date();
};

export const isToday = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

export const addMinutes = (dateString, minutes) => {
  const date = new Date(dateString);
  return new Date(date.getTime() + minutes * 60000);
};

export const subtractMinutes = (dateString, minutes) => {
  const date = new Date(dateString);
  return new Date(date.getTime() - minutes * 60000);
};

export const formatDateRange = (startDateString, endDateString) => {
  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);

  if (startDate.toDateString() === endDate.toDateString()) {
    return `${formatDate(startDate)} ${formatTime(startDate)} - ${formatTime(endDate)}`;
  }
  return `${formatDate(startDate)} ${formatTime(startDate)} - ${formatDate(endDate)} ${formatTime(endDate)}`;
};

export const getTimeSlots = (startTime, endTime, duration) => {
  const slots = [];
  let currentTime = new Date(startTime);
  const end = new Date(endTime);

  while (currentTime < end) {
    slots.push(new Date(currentTime));
    currentTime = addMinutes(currentTime, duration);
  }

  return slots;
};

export const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((date - now) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 0) {
    return `in ${diffInDays} day${diffInDays > 1 ? 's' : ''}`;
  }
  if (diffInHours > 0) {
    return `in ${diffInHours} hour${diffInHours > 1 ? 's' : ''}`;
  }
  if (diffInMinutes > 0) {
    return `in ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
  }
  if (diffInSeconds > 0) {
    return `in ${diffInSeconds} second${diffInSeconds > 1 ? 's' : ''}`;
  }
  return 'now';
}; 