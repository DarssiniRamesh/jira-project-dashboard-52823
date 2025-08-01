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
    const credentialString = `${email}:${token}`;
    const basicAuth = btoa(credentialString);

    const fetchProjects = async () => {
      setLoading(true);
      setFetchError('');
      if (typeof updateProjectContext === 'function') {
        updateProjectContext('', []);
      }
      let resp;
      let fetchErr = null;
      try {
        const apiUrl = `https://${domain}/rest/api/3/project/search?expand=lead,description,issueTypes`;
        resp = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Accept': 'application/json'
          }
        });
      } catch (e) {
        fetchErr = e;
      }

      const isLikelyCORS =
        fetchErr &&
        typeof fetchErr === 'object' &&
        (
          fetchErr.name === 'TypeError' ||
          (typeof fetchErr.message === 'string' && (
            fetchErr.message.includes('Failed to fetch') ||
            fetchErr.message.includes('NetworkError') ||
            fetchErr.message.includes('CORS')
          ))
        );

      if (isLikelyCORS || (!resp && fetchErr)) {
        setFetchError(
          <>
            Could not fetch Jira project data due to <b>CORS restrictions</b> (Cross-Origin Resource Sharing).<br /><br />
            <b>Development/Testing Only:</b>
            <ul style={{textAlign:'left'}}>
              <li>Try using a browser extension like <b>"Allow CORS"</b> (enable only for trusted sites and testing).</li>
              <li>Or try open CORS proxies, e.g. <code>https://corsproxy.io/?[API_URL]</code>: Never use real credentials with a public proxy!</li>
            </ul>
            <div style={{color:"#ff5630", fontWeight:600, marginTop:8}}>
              <b>Warning:</b> <u>Never</u> use CORS proxies or extensions with production data or actual Jira credentials.
              For real deployments, use a secured backend proxy server.
            </div>
          </>
        );
        setProjects([]);
        if (typeof updateProjectContext === 'function') {
          updateProjectContext('Jira CORS error - see workaround/warning above.', []);
        }
        setLoading(false);
        return;
      }

      try {
        if (!resp || !resp.ok) {
          if (resp && (resp.status === 401 || resp.status === 403)) {
            setFetchError('Project fetch failed: Authentication error. Your session may have expired or your credentials are invalid.');
            if (typeof onLogout === 'function') {
              onLogout();
              return;
            }
          } else {
            setFetchError('Unable to fetch projects from Jira. Please retry or check your permissions.');
          }
          setProjects([]);
        } else {
          const data = await resp.json();
          if (Array.isArray(data.values)) {
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
        setFetchError('Unexpected error while fetching projects. Please check your connection or try again.');
        setProjects([]);
        if (typeof updateProjectContext === 'function') {
          updateProjectContext('Unexpected error while fetching projects. Please check your connection or try again.', []);
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
