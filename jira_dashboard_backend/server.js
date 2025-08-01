const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// Enable CORS for all origins (adjust as needed for production)
app.use(cors());
app.use(express.json());

// Swagger-style openapi tags for documentation (manual for this minimal app)
const OPENAPI_INFO = {
  title: "Jira Backend Proxy API",
  version: "1.0.0",
  description: "Proxy for React frontend to securely relay Jira REST API requests. Receives credentials for every request. No credentials are stored at rest.",
  tags: [
    { name: "Auth", description: "Jira Login Proxy" },
    { name: "Project", description: "Jira Project Data Proxy" }
  ]
};

/**
 * PUBLIC_INTERFACE
 * @route POST /login
 * @summary Authenticates user with Jira and relays the response.
 * @description
 * Receives { email, domain, token } in the POST body, sends an authentication request to Jira's /myself endpoint, and returns the result.
 * Does NOT persist any secrets.
 *
 * Example Request body:
 * {
 *   "email": "user@company.com",
 *   "domain": "your-domain.atlassian.net",
 *   "token": "JIRA_API_TOKEN"
 * }
 *
 * @returns {object} 200 - Jira user data or authentication error message
 */
app.post('/login', async (req, res) => {
  const { email, domain, token } = req.body || {};
  if (!email || !domain || !token) {
    return res.status(400).json({ error: "Missing required fields: email, domain, token" });
  }

  // Defensive: only allow valid atlassian.net domains
  if (!/^[\w.-]+\.atlassian\.net$/.test(domain.trim())) {
    return res.status(400).json({ error: 'Domain must end with ".atlassian.net" and contain only valid characters.' });
  }

  // Jira endpoint
  const url = `https://${domain}/rest/api/3/myself`;
  const basicAuth = Buffer.from(`${email}:${token}`).toString('base64');

  try {
    const jiraResp = await axios.get(url, {
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Accept': 'application/json'
      }
    });
    return res.status(200).json(jiraResp.data);
  } catch (err) {
    const status = err.response?.status || 500;
    let message = 'Could not connect to Jira.';
    if (status === 401 || status === 403) message = 'Invalid credentials: Email/token or domain is incorrect.';
    return res.status(status).json({
      error: message,
      detail: err.response?.data?.errorMessages || err.message
    });
  }
});

/**
 * PUBLIC_INTERFACE
 * @route POST /projects
 * @summary Relays Jira project search request for the user
 * @description
 * Receives { email, domain, token } in the POST body, fetches project data from Jira, and relays it to the frontend.
 * Does NOT persist any secrets.
 *
 * Example Request body:
 * {
 *   "email": "user@company.com",
 *   "domain": "your-domain.atlassian.net",
 *   "token": "JIRA_API_TOKEN"
 * }
 *
 * @returns {object} 200 - Jira project list JSON or error
 */
app.post('/projects', async (req, res) => {
  const { email, domain, token } = req.body || {};
  if (!email || !domain || !token) {
    return res.status(400).json({ error: "Missing required fields: email, domain, token" });
  }

  if (!/^[\w.-]+\.atlassian\.net$/.test(domain.trim())) {
    return res.status(400).json({ error: 'Domain must end with ".atlassian.net" and contain only valid characters.' });
  }

  const url = `https://${domain}/rest/api/3/project/search?expand=lead,description,issueTypes`;
  const basicAuth = Buffer.from(`${email}:${token}`).toString('base64');

  try {
    const jiraResp = await axios.get(url, {
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Accept': 'application/json'
      }
    });
    return res.status(200).json(jiraResp.data);
  } catch (err) {
    const status = err.response?.status || 500;
    let message = 'Could not fetch projects from Jira.';
    if (status === 401 || status === 403) message = 'Authentication error: email/token or domain is incorrect (project fetch).';
    return res.status(status).json({
      error: message,
      detail: err.response?.data?.errorMessages || err.message
    });
  }
});

/**
 * Root endpoint for docs (optionally expose a help page here).
 */
app.get('/', (req, res) => {
  return res.json({
    openapi: "3.0.0",
    ...OPENAPI_INFO,
    endpoints: [
      {
        method: "POST",
        path: "/login",
        description: "Proxies Jira /myself login request"
      },
      {
        method: "POST",
        path: "/projects",
        description: "Proxies Jira project fetch"
      }
    ]
  });
});

// Default port 4000, overridable for deployment
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Jira Proxy backend running at http://localhost:${PORT}`);
  console.log("Endpoints: POST /login, POST /projects");
});
