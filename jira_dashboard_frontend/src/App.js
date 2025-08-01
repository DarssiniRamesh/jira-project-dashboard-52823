import React, { useState, useEffect } from 'react';
import './App.css';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';

/**
 * Separates out authentication, projects, and error state.
 * All sensitive info is wiped on logout. Errors contextually displayed only under relevant screens.
 */

function App() {
  // App/theme state
  const [theme, setTheme] = useState('light');

  // Unified global state for security: authentication, error, and session/project info
  const [authState, setAuthState] = useState({
    authenticated: false,
    authLoading: false,
    authError: '',
    credentials: null, // { email, domain, token }
  });

  // Projects and related state should be kept distinct and reset on logout.
  const [projectState, setProjectState] = useState({
    lastProjectFetchError: '',
    lastProjectList: null, // null or array; cleared on logout
  });

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme((theme) => (theme === 'light' ? 'dark' : 'light'));

  // PUBLIC_INTERFACE: Handles logging in
  const handleLogin = async ({ email, domain, token }) => {
    setAuthState((prev) => ({
      authenticated: false,
      authLoading: true,
      authError: '',
      credentials: null,
    }));
    setProjectState({
      lastProjectFetchError: '',
      lastProjectList: null,
    });
    try {
      if (!/^[\w.-]+\.atlassian\.net$/.test(domain.trim())) {
        setAuthState((prev) => ({
          ...prev,
          authLoading: false,
          authError: 'Domain must end with ".atlassian.net" and contain only valid characters.',
        }));
        return;
      }
      const credentialString = `${email}:${token}`;
      const basicAuth = btoa(credentialString);
      const apiUrl = `https://${domain}/rest/api/3/myself`;

      const resp = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Accept': 'application/json'
        }
      });

      if (resp.ok) {
        // Success!
        setAuthState({
          authenticated: true,
          authLoading: false,
          authError: '',
          credentials: { email, domain, token }, // never persisted; only in memory
        });
        setProjectState({
          lastProjectFetchError: '',
          lastProjectList: null,
        });
      } else if (resp.status === 401 || resp.status === 403) {
        setAuthState((prev) => ({
          ...prev, authLoading: false,
          authenticated: false,
          authError: 'Invalid credentials: Email/token or domain is incorrect.',
          credentials: null,
        }));
      } else {
        setAuthState((prev) => ({
          ...prev, authLoading: false, authenticated: false, credentials: null,
          authError: 'Could not authenticate – check your Jira domain and internet connection.',
        }));
      }
    } catch (e) {
      setAuthState((prev) => ({
        ...prev, authLoading: false, authenticated: false, credentials: null,
        authError: 'Unexpected error occurred – could not connect to Jira.',
      }));
    }
  };

  // PUBLIC_INTERFACE: Logout wipes all sensitive in-memory info and resets state to initial values
  const handleLogout = () => {
    setAuthState({
      authenticated: false,
      authLoading: false,
      authError: '',
      credentials: null,
    });
    setProjectState({
      lastProjectFetchError: '',
      lastProjectList: null,
    });
  };

  // Called by Dashboard to update project-related error state
  const updateProjectState = (projectError, projectList) => {
    setProjectState({
      lastProjectFetchError: projectError || '',
      lastProjectList: Array.isArray(projectList) ? projectList : null,
    });
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
        {!authState.authenticated ? (
          <LoginForm
            onLogin={handleLogin}
            loading={authState.authLoading}
            error={authState.authError}
          />
        ) : (
          <>
            {/* Logout option visible only when authenticated */}
            <button
              style={{
                position: "absolute",
                top: 20,
                left: 20,
                padding: "10px 20px",
                background: "#ff5630",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer",
                zIndex: 10,
                transition: "background 0.2s, opacity 0.2s"
              }}
              onClick={handleLogout}
              aria-label="Log out"
              data-testid="logout-btn"
            >
              Logout
            </button>
            {/* Dashboard now receives project state/error updater for contextual control */}
            <Dashboard
              jiraCredentials={authState.credentials}
              onLogout={handleLogout}
              updateProjectContext={updateProjectState}
              lastProjectFetchError={projectState.lastProjectFetchError}
            />
          </>
        )}
      </header>
    </div>
  );
}

export default App;
