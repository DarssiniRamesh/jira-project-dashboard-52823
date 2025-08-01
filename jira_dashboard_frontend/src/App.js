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

  // PUBLIC_INTERFACE: Handles logging in via backend proxy
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
      // Proxy endpoint - backend running at localhost:4000
      const apiUrl = '/login'; // frontend uses proxy or needs setup, otherwise use http://localhost:4000/login
      let resp;
      try {
        resp = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, domain, token })
        });
      } catch (fetchErr) {
        // Network/connection/server unreachable, not a Jira or credentials error
        let message = 'Could not connect to Jira Proxy backend server. Please ensure the backend service is running and reachable.';
        setAuthState((prev) => ({
          ...prev, authLoading: false, authenticated: false, credentials: null,
          authError: message,
        }));
        return;
      }

      if (!resp) {
        setAuthState((prev) => ({
          ...prev, authLoading: false, authenticated: false, credentials: null,
          authError: 'Could not send request to backend Jira proxy.',
        }));
        return;
      }

      if (resp.ok) {
        // Success: authenticated!
        setAuthState({
          authenticated: true,
          authLoading: false,
          authError: '',
          credentials: { email, domain, token }, // only in memory
        });
        setProjectState({
          lastProjectFetchError: '',
          lastProjectList: null,
        });
      } else {
        // Try to extract readable error, else fallback
        let errorMsg = 'Could not authenticate – check your Jira domain, API token, and internet connection.';
        try {
          const errObj = await resp.json();
          if (errObj && errObj.error) {
            errorMsg = errObj.error + (errObj.detail ? ` (${Array.isArray(errObj.detail) ? errObj.detail.join("; ") : errObj.detail})` : "");
          }
        } catch {
          // ignore parsing error, fallback on generic message
        }
        setAuthState((prev) => ({
          ...prev,
          authLoading: false,
          authenticated: false,
          authError: errorMsg,
          credentials: null,
        }));
      }
    } catch (e) {
      setAuthState((prev) => ({
        ...prev, authLoading: false, authenticated: false, credentials: null,
        authError: (
          'Unexpected error occurred – could not connect to backend proxy. ' +
          (e && e.message ? `(${e.message})` : '')
        ),
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
