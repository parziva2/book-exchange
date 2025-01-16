import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { AuthProvider } from './contexts/AuthContext';
import { MessageProvider } from './contexts/MessageContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SocketProvider } from './contexts/SocketContext';
import { GroupSessionProvider } from './contexts/GroupSessionContext';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';
import './index.css';

// Add error logging
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global error:', { message, source, lineno, colno, error });
  return false;
};

// Add unhandled promise rejection handling
window.onunhandledrejection = function(event) {
  console.error('Unhandled promise rejection:', event.reason);
};

try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <SocketProvider>
              <MessageProvider>
                <NotificationProvider>
                  <GroupSessionProvider>
                    <SnackbarProvider maxSnack={3}>
                      <App />
                    </SnackbarProvider>
                  </GroupSessionProvider>
                </NotificationProvider>
              </MessageProvider>
            </SocketProvider>
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (error) {
  console.error('Error rendering app:', error);
  document.getElementById('root').innerHTML = `
    <div style="padding: 20px; text-align: center;">
      <h1>Failed to load application</h1>
      <p>Error: ${error.message}</p>
    </div>
  `;
} 