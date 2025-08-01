# Jira Dashboard Backend Proxy

This is a secure Node.js Express proxy server for the Jira Project Dashboard React frontend.  
It relays Jira API requests from the frontend, solving CORS issues and protecting user credentials (credentials are accepted per-request and never stored).

## Features

- POST /login: Proxy Jira authentication to `/rest/api/3/myself`
- POST /projects: Proxy Jira project listing to `/rest/api/3/project/search`
- CORS enabled for development
- Never stores or logs credentials

## Running Locally

1. Install dependencies:
   ```
   npm install
   ```

2. Start the server:
   ```
   npm start
   ```

   By default, server runs on `http://localhost:4000`.

## API Usage

### POST /login

Body:
```json
{
  "email": "user@company.com",
  "domain": "your-domain.atlassian.net",
  "token": "JIRA_API_TOKEN"
}
```
Response: 200 with Jira /myself user JSON or appropriate error.

### POST /projects

Body is the same as `/login`.  
Response: 200 with Jira project list object.

## Security & Compliance

- This server does **not** persist or log any sensitive information.
- Credentials are used per-request and only ever relayed to Jira.

---

Created for use with the "Jira Project Dashboard" frontend.
