import React, { useEffect, useState } from 'react';

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

  // Prepare data for dashboard: project list
  return (
    <div style={{
      maxWidth: "1020px",
      margin: "40px auto 24px auto",
      padding: "0 16px",
      textAlign: "left"
    }}>
      <h3 style={{ color: "var(--text-primary)", marginBottom: 18, fontWeight: 700, fontSize: "2rem" }}>
        Your Jira Projects
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "20px"
        }}
      >
        {projects.map(project => (
          <div
            key={project.id}
            style={{
              background: "var(--bg-secondary)",
              borderRadius: 11,
              boxShadow: "0 2px 8px rgba(30,54,89,0.06)",
              padding: "24px 18px",
              minHeight: 100,
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              position: "relative"
            }}
          >
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              {project.avatarUrls && project.avatarUrls["48x48"] &&
                <img
                  src={project.avatarUrls["48x48"]}
                  alt="Avatar"
                  style={{
                    width: 34, height: 34,
                    borderRadius: 7,
                    border: "1px solid var(--border-color)",
                    marginRight: 3,
                  }}
                />
              }
              <span style={{ fontWeight: 700, fontSize: '1.15rem' }}>
                {project.name || "(No Name)"}
              </span>
              <span style={{
                marginLeft: 7,
                fontSize: '0.98em',
                color: "#777",
                background: "var(--bg-primary)",
                borderRadius: 5,
                padding: "2px 8px",
                fontWeight: 600,
                letterSpacing: "-0.5px"
              }}>
                {project.key}
              </span>
            </div>
            <div style={{ fontSize: '0.98em', marginTop: 8}}>
              Type: <span style={{ color: "var(--text-secondary)" }}>{project.projectTypeKey}</span>
              {project.projectCategory && project.projectCategory.name && (
                <>
                  {" · "}
                  <span>{project.projectCategory.name}</span>
                </>
              )}
            </div>
            <div style={{ fontSize: "0.96em", color: "#345" }}>
              {project.lead &&
                <>
                  <span>Lead: <b>
                    {project.lead.displayName || project.lead.name || "?"}
                  </b>
                  {project.lead.emailAddress ? (" · " + project.lead.emailAddress) : ""}
                  </span>
                </>
              }
            </div>
            <div style={{ fontSize: '0.95em', marginTop: 5, color: "#333" }}>
              Status: <b>{project.archived ? "Archived" : project.insight?.totalObjectCount === 0 ? "Active" : "Active"}</b>
            </div>
            {project.updated && (
              <div style={{ fontSize: "0.94em", color: "#888" }}>
                Updated: {new Date(project.updated).toLocaleString()}
              </div>
            )}
            {project.description && typeof project.description === "string" && (
              <div style={{
                fontSize: "0.95em",
                color: "#4d6884",
                marginTop: 6,
                opacity: 0.85,
                maxHeight: 36,
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}>
                {project.description}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
