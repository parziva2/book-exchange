import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import VideoSession from '../VideoSession';
import { AuthProvider } from '../../../contexts/AuthContext';
import { NotificationProvider } from '../../../contexts/NotificationContext';
import * as twilioUtils from '../../../utils/twilio';
import * as sessionApi from '../../../utils/sessionApi';

// Mock the required modules and utilities
vi.mock('../../../utils/twilio', () => ({
  createLocalTracks: vi.fn(),
  joinVideoRoom: vi.fn(),
  createScreenTrack: vi.fn(),
}));

vi.mock('../../../utils/sessionApi', () => ({
  getSession: vi.fn(),
  endVideoSession: vi.fn(),
}));

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'testUser' },
  }),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

vi.mock('../../../contexts/NotificationContext', () => ({
  useNotifications: () => ({
    sendNotification: vi.fn(),
  }),
  NotificationProvider: ({ children }) => <div>{children}</div>,
}));

// Mock the Twilio Room and Track objects
const mockRoom = {
  disconnect: vi.fn(),
  on: vi.fn(),
  participants: new Map(),
  localParticipant: {
    publishTrack: vi.fn(),
    unpublishTrack: vi.fn(),
  },
};

const mockTrack = {
  kind: 'video',
  attach: vi.fn(() => document.createElement('video')),
  detach: vi.fn(() => [document.createElement('video')]),
  enable: vi.fn(),
  stop: vi.fn(),
};

// Test session data
const mockSession = {
  id: '123',
  startTime: new Date(Date.now() + 1000).toISOString(),
  duration: 30,
  mentor: { id: 'mentor1', name: 'John Mentor' },
  mentee: { id: 'mentee1', name: 'Jane Mentee' },
};

// Create router with test configuration
const routes = [
  {
    path: '/session/:sessionId',
    element: <VideoSession />,
  },
];

const createTestRouter = (initialEntry = `/session/${mockSession.id}`) => {
  return createMemoryRouter(routes, {
    initialEntries: [initialEntry],
  });
};

const renderComponent = () => {
  return render(<RouterProvider router={createTestRouter()} />);
};

describe('VideoSession Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup successful API responses
    sessionApi.getSession.mockResolvedValue(mockSession);
    twilioUtils.createLocalTracks.mockResolvedValue([{ ...mockTrack, kind: 'video' }, { ...mockTrack, kind: 'audio' }]);
    twilioUtils.joinVideoRoom.mockResolvedValue(mockRoom);
  });

  it('renders loading state initially', async () => {
    renderComponent();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('sets up video session successfully', async () => {
    renderComponent();

    await waitFor(() => {
      expect(sessionApi.getSession).toHaveBeenCalledWith(mockSession.id);
    });

    await waitFor(() => {
      expect(twilioUtils.createLocalTracks).toHaveBeenCalled();
      expect(twilioUtils.joinVideoRoom).toHaveBeenCalledWith(mockSession.id);
    });

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText(/Time Remaining:/)).toBeInTheDocument();
  });

  it('handles camera/microphone permission denial', async () => {
    const permissionError = new Error('Permission denied');
    permissionError.name = 'NotAllowedError';
    twilioUtils.createLocalTracks.mockRejectedValueOnce(permissionError);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/camera and microphone access denied/i)).toBeInTheDocument();
      expect(screen.getByText(/retry connection/i)).toBeInTheDocument();
    });
  });

  it('toggles audio and video', async () => {
    renderComponent();

    await waitFor(() => {
      expect(twilioUtils.joinVideoRoom).toHaveBeenCalled();
    });

    const audioButton = await screen.findByTestId('audio-toggle');
    const videoButton = await screen.findByTestId('video-toggle');

    await act(async () => {
      fireEvent.click(audioButton);
    });

    await act(async () => {
      fireEvent.click(videoButton);
    });

    expect(mockTrack.enable).toHaveBeenCalledTimes(2);
  });

  it('handles screen sharing', async () => {
    const mockScreenTrack = { ...mockTrack };
    twilioUtils.createScreenTrack.mockResolvedValueOnce(mockScreenTrack);

    renderComponent();

    await waitFor(() => {
      expect(twilioUtils.joinVideoRoom).toHaveBeenCalled();
    });

    const screenShareButton = await screen.findByTestId('screen-share');

    await act(async () => {
      fireEvent.click(screenShareButton);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(twilioUtils.createScreenTrack).toHaveBeenCalled();
      expect(mockRoom.localParticipant.publishTrack).toHaveBeenCalledWith(mockScreenTrack);
    });

    await act(async () => {
      fireEvent.click(screenShareButton);
      await Promise.resolve();
    });

    expect(mockRoom.localParticipant.unpublishTrack).toHaveBeenCalled();
  });

  it('handles session end', async () => {
    sessionApi.endVideoSession.mockResolvedValueOnce({});
    
    renderComponent();

    await waitFor(() => {
      expect(twilioUtils.joinVideoRoom).toHaveBeenCalled();
    });

    const endButton = await screen.findByText(/end session/i, { selector: 'button' });
    
    await act(async () => {
      fireEvent.click(endButton);
      await Promise.resolve();
    });

    const confirmButton = screen.getByRole('button', { name: /end session/i });
    
    await act(async () => {
      fireEvent.click(confirmButton);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(sessionApi.endVideoSession).toHaveBeenCalledWith(mockSession.id);
      expect(mockRoom.disconnect).toHaveBeenCalled();
    });
  });

  it('handles reconnection on disconnect', async () => {
    vi.useFakeTimers();
    renderComponent();

    await waitFor(() => {
      expect(twilioUtils.joinVideoRoom).toHaveBeenCalled();
    });

    const disconnectCallback = mockRoom.on.mock.calls.find(call => call[0] === 'disconnected')[1];
    
    await act(async () => {
      disconnectCallback(mockRoom);
      await Promise.resolve();
    });

    expect(screen.getByText(/you have been disconnected/i)).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    // Clear any pending timers
    await act(async () => {
      vi.runAllTimers();
    });

    await waitFor(() => {
      expect(twilioUtils.createLocalTracks).toHaveBeenCalledTimes(2);
    });

    vi.useRealTimers();
  });

  it('cleans up resources on unmount', async () => {
    const { unmount } = renderComponent();

    await waitFor(() => {
      expect(twilioUtils.joinVideoRoom).toHaveBeenCalled();
    });

    await act(async () => {
      unmount();
      await Promise.resolve();
    });

    expect(mockTrack.stop).toHaveBeenCalled();
    expect(mockRoom.disconnect).toHaveBeenCalled();
  });
}); 