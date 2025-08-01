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
  // Store credentials only in memory (never persist!)
  const [jiraCredentials, setJiraCredentials] = useState(null);

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
     * Handles login submission: Validates credentials against Jira API using /myself (Basic Auth, no CORS proxy).
     * On success: stores credentials in memory (not persisted), marks as authenticated.
     * On failure: displays friendly error message.
     */
    setAuthLoading(true);
    setAuthError('');
    setAuthenticated(false);
    setJiraCredentials(null);
    try {
      // Validate domain for required suffix (must look like example.atlassian.net)
      if (!/^[\w.-]+\.atlassian\.net$/.test(domain.trim())) {
        setAuthError('Domain must end with ".atlassian.net" and contain only valid characters.');
        setAuthLoading(false);
        return;
      }

      // Jira Basic Auth header: 'Basic <base64(email:token)>'
      const credentialString = `${email}:${token}`;
      const basicAuth = btoa(credentialString); // window.btoa is safe for ascii (Jira credentials are ascii-based)
      const apiUrl = `https://${domain}/rest/api/3/myself`;

      // Test credentials via Jira API
      const resp = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Accept': 'application/json'
        }
      });

      if (resp.ok) {
        // Auth successful! (do NOT persist credentials)
        setJiraCredentials({ email, domain, token }); // only in memory
        setAuthenticated(true);
        setAuthError('');
      } else if (resp.status === 401 || resp.status === 403) {
        setAuthError('Invalid credentials: Email/token or domain is incorrect.');
      } else {
        setAuthError('Could not authenticate – check your Jira domain and internet connection.');
      }
    } catch (e) {
      setAuthError('Unexpected error occurred – could not connect to Jira.');
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
              You are now authenticated.<br />
              <span style={{ fontSize: '0.95em', color: 'var(--text-secondary)' }}>
                (Credentials are only stored in browser memory for your session. Dashboard content will appear here.)
              </span>
            </p>
            {/* Future: Render dashboard components after authentication, using jiraCredentials */}
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
