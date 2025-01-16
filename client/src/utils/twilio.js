import { connect, createLocalTracks as twilioCreateLocalTracks } from 'twilio-video';
import api from './api';

/**
 * Creates local audio and video tracks
 * @returns {Promise<Array>} Array of local tracks
 */
export const createLocalTracks = async () => {
  try {
    return await twilioCreateLocalTracks({
      audio: true,
      video: { width: 640, height: 480 }
    });
  } catch (error) {
    console.error('Error creating local tracks:', error);
    throw new Error('Failed to access camera and microphone');
  }
};

/**
 * Creates a screen share track
 * @returns {Promise<Object>} Screen share track
 */
export const createScreenTrack = async () => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: 'always',
        displaySurface: 'monitor',
      }
    });
    const track = stream.getVideoTracks()[0];
    return track;
  } catch (error) {
    console.error('Error creating screen share track:', error);
    throw new Error('Failed to start screen sharing');
  }
};

/**
 * Joins a video room
 * @param {string} sessionId - The session ID
 * @returns {Promise<Room>} Twilio Room object
 */
export const joinVideoRoom = async (sessionId) => {
  try {
    // Get token using the API instance that handles token refresh
    const response = await api.post(`/sessions/${sessionId}/token`);
    
    if (!response.data || !response.data.token) {
      throw new Error('No token received from server');
    }

    // Connect to the room with improved options
    const room = await connect(response.data.token, {
      name: `session-${sessionId}`,
      audio: { name: 'microphone' },
      video: { 
        name: 'camera',
        width: 640,
        height: 480,
        frameRate: 24
      },
      dominantSpeaker: true,
      networkQuality: {
        local: 1,
        remote: 1
      },
      // Add automatic reconnection
      enableAutomaticSubscription: true,
      maxAudioBitrate: 16000,
      preferredVideoCodecs: [{ codec: 'VP8', simulcast: true }],
      // Add reconnection settings
      reconnection: {
        enabled: true,
        maxAttempts: 3
      },
      // Add bandwidth profile
      bandwidthProfile: {
        video: {
          mode: 'collaboration',
          maxTracks: 5,
          dominantSpeakerPriority: 'high'
        }
      }
    });

    return room;
  } catch (error) {
    console.error('Error joining video room:', error);
    
    // Handle specific error cases
    if (error.code === 53205) {
      throw new Error('Another session with your account is already active. Please close other sessions and try again.');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. Please check if your profile is complete and you have permission to join this session.');
    } else if (error.response?.status === 401) {
      throw new Error('Session authentication failed. Please try logging in again.');
    } else if (error.name === 'NotAllowedError') {
      throw new Error('Camera and microphone access denied. Please check your browser permissions.');
    } else if (error.name === 'NotFoundError') {
      throw new Error('No camera or microphone found. Please check your device connections.');
    }
    
    throw new Error('Failed to join video session. Please try again.');
  }
}; 