import React, { useEffect, useState } from 'react';
import ProjectDashboard from './ProjectDashboard';

/**
 * Dashboard component now supports:
 * - error context input and setter (caller can supply lastProjectFetchError & updateProjectContext)
 * - logout callback for handling logout action
 * - all sensitive info is cleared on logout or on credential loss
 */
// PUBLIC_INTERFACE
function Dashboard({ jiraCredentials, onLogout, updateProjectContext, lastProjectFetchError }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  // Internal error state defaults to parent's context if provided; resets on credential change
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (!jiraCredentials) {
      setProjects([]);
      setLoading(false);
      setFetchError('');
      if (typeof updateProjectContext === 'function') {
        updateProjectContext('', []);
      }
      return;
    }

    const { domain, email, token } = jiraCredentials;

    // Fetches projects through backend proxy (/projects endpoint)
    const fetchProjects = async () => {
      setLoading(true);
      setFetchError('');
      if (typeof updateProjectContext === 'function') {
        updateProjectContext('', []);
      }
      try {
        // Backend Proxy endpoint (should be on same-origin: otherwise use full URL if needed)
        const apiUrl = '/projects';
        const resp = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, domain, token })
        });

        if (!resp.ok) {
          // Try to parse reason from proxy or show generic error
          let proxyError = 'Unable to fetch projects from Jira. Please retry or check your permissions.';
          try {
            const errObj = await resp.json();
            if (errObj && errObj.error) {
              proxyError = errObj.error + (errObj.detail ? ` (${Array.isArray(errObj.detail) ? errObj.detail.join("; ") : errObj.detail})` : '');
            }
          } catch {
            // skip
          }
          if (resp.status === 401 || resp.status === 403) {
            setFetchError('Project fetch failed: Authentication error. Your session may have expired or your credentials are invalid.');
            if (typeof onLogout === 'function') {
              onLogout();
              return;
            }
          } else {
            setFetchError(proxyError);
          }
          setProjects([]);
        } else {
          const data = await resp.json();
          if (data && Array.isArray(data.values)) {
            setProjects(data.values);
            setFetchError('');
            if (typeof updateProjectContext === 'function') {
              updateProjectContext('', data.values);
            }
          } else {
            setProjects([]);
            setFetchError('No project data found or Jira API permissions insufficient.');
            if (typeof updateProjectContext === 'function') {
              updateProjectContext('No project data found or Jira API permissions insufficient.', []);
            }
          }
        }
      } catch (e) {
        setFetchError('Unexpected error while fetching projects. Please check your backend server, network connection, or try again.');
        setProjects([]);
        if (typeof updateProjectContext === 'function') {
          updateProjectContext('Unexpected error while fetching projects. Please check your backend server, network connection, or try again.', []);
        }
      }
      setLoading(false);
    };

    fetchProjects();
  }, [jiraCredentials, onLogout, updateProjectContext]);

  // Always use top-down error context if present (for parent to control what is shown)
  const errorMsg = lastProjectFetchError !== undefined && lastProjectFetchError !== null
    ? lastProjectFetchError
    : fetchError;

  // Contextual loading state (cleared after logout/credential loss)
  if (!jiraCredentials) return null;

  if (loading) {
    return (
      <div style={{ marginTop: 40 }}>
        <div className="login-loading-spinner" style={{ margin: '20px auto' }} aria-label="Loading projects"></div>
        <div style={{ color: 'var(--text-secondary)', marginTop: 12 }}>Fetching your Jira projects...</div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div style={{
        color: "#ff5630",
        fontSize: "1.15rem",
        margin: "42px auto",
        fontWeight: 500,
        textAlign: "center",
        maxWidth: 420
      }}>
        {errorMsg}
      </div>
    );
  }

  if (!projects.length) {
    return (
      <div style={{
        color: "var(--text-secondary)",
        fontSize: "1.15rem",
        margin: "42px auto",
        textAlign: "center"
      }}>
        No Jira projects found or accessible for this account.
      </div>
    );
  }

  // Main project dashboard rendering
  return (
    <div style={{
      maxWidth: "1200px",
      margin: "30px auto 18px auto",
      padding: "0 8px",
      textAlign: "left"
    }}>
      <h2 style={{
        color: "var(--text-primary)",
        fontWeight: 700,
        fontSize: "2rem",
        margin: "0 0 16px 0",
        letterSpacing: "-1px"
      }}>
        Your Jira Projects
      </h2>
      <ProjectDashboard projects={projects} />
    </div>
  );
}

export default Dashboard;
