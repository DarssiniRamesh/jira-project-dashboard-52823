import React, { useState, useEffect } from 'react';
import './App.css';
import LoginForm from './components/LoginForm';

// PUBLIC_INTERFACE
function App() {
  /**
   * App with theme toggle and minimal Jira login flow state.
   * If not authenticated, prompts for credentials.
   * Auth state and errors are managed internally.
   */
  const [theme, setTheme] = useState('light');
  // Authentication-related state
  const [authenticated, setAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Effect to apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // PUBLIC_INTERFACE
  const handleLogin = async ({ email, domain, token }) => {
    /**
     * Handles login submission: validates against Jira API (mocked for now).
     * Shows loading, sets authenticated or displays error.
     * No credentials are persisted.
     */
    setAuthLoading(true);
    setAuthError('');
    try {
      // Simulate network request/validation - replace this with API call to Jira later
      await new Promise(res => setTimeout(res, 1100));
      // For demonstration, let's "fail" login if domain doesn't include 'atlassian.net'
      if (!domain.endsWith('.atlassian.net')) {
        setAuthError('Domain must end with ".atlassian.net"');
      } else {
        setAuthenticated(true);
      }
    } catch (e) {
      setAuthError('Unexpected error occurred');
    }
    setAuthLoading(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <button 
          className="theme-toggle" 
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        {!authenticated ? (
          <LoginForm
            onLogin={handleLogin}
            loading={authLoading}
            error={authError}
          />
        ) : (
          <div>
            <h2 style={{ marginTop: '42px' }}>Welcome to Jira Project Dashboard</h2>
            <p style={{ margin: '16px 0', color: 'var(--text-secondary)' }}>
              You are now authenticated. (Dashboard content will appear here.)
            </p>
            {/* Future: Render dashboard components after authentication */}
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
