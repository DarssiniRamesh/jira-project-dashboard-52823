import React, { useEffect, useState } from 'react';
import ProjectDashboard from './ProjectDashboard';

// PUBLIC_INTERFACE
function Dashboard({ jiraCredentials }) {
  /**
   * Fetches and displays the user's accessible Jira projects using the Jira REST API.
   * @param {Object} jiraCredentials - { email, domain, token } for Basic Auth (in-memory only).
   * UI: Handles loading and error states, prepares project data for dashboard rendering.
   */
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (!jiraCredentials) return;

    const { domain, email, token } = jiraCredentials;
    // Jira Basic Auth header: 'Basic <base64(email:token)>'
    const credentialString = `${email}:${token}`;
    const basicAuth = btoa(credentialString);

    const fetchProjects = async () => {
      setLoading(true);
      setFetchError('');
      try {
        const apiUrl = `https://${domain}/rest/api/3/project/search?expand=lead,description,issueTypes`;
        const resp = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Accept': 'application/json'
          }
        });
        if (!resp.ok) {
          if (resp.status === 401 || resp.status === 403) {
            setFetchError('Project fetch failed: Authentication error. Your session may have expired or your credentials are invalid.');
          } else {
            setFetchError('Unable to fetch projects from Jira. Please retry or check your permissions.');
          }
          setProjects([]);
        } else {
          const data = await resp.json();
          if (Array.isArray(data.values)) {
            setProjects(data.values);
          } else {
            setProjects([]);
            setFetchError('No project data found or Jira API permissions insufficient.');
          }
        }
      } catch (e) {
        setFetchError('Unexpected error while fetching projects. Please check your connection or try again.');
        setProjects([]);
      }
      setLoading(false);
    };

    fetchProjects();
  }, [jiraCredentials]);

  if (loading) {
    return (
      <div style={{ marginTop: 40 }}>
        <div className="login-loading-spinner" style={{ margin: '20px auto' }} aria-label="Loading projects"></div>
        <div style={{ color: 'var(--text-secondary)', marginTop: 12 }}>Fetching your Jira projects...</div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div style={{
        color: "#ff5630", fontSize: "1.15rem", margin: "42px auto", fontWeight: 500, textAlign: "center", maxWidth: 420
      }}>
        {fetchError}
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

  // Use the ProjectDashboard for actual rendering
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
