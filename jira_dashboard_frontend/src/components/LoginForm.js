import React, { useState } from 'react';
import './LoginForm.css';

// PUBLIC_INTERFACE
function LoginForm({ onLogin, loading, error }) {
  /**
   * LoginForm component for Jira authentication.
   * @param {function} onLogin - Called with { email, domain, token } after successful validation.
   * @param {boolean} loading - Show loading spinner during authentication.
   * @param {string} error - Error message to display.
   * UI: Modern, minimal, responsive.
   */
  const [email, setEmail] = useState('');
  const [domain, setDomain] = useState('');
  const [token, setToken] = useState('');
  const [touched, setTouched] = useState(false);

  // Input validations
  const isEmailValid = email.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isDomainValid = domain.trim().length > 0 && /^[a-zA-Z0-9.-]+$/.test(domain);
  const isTokenValid = token.trim().length > 0;

  const canSubmit = isEmailValid && isDomainValid && isTokenValid && !loading;

  function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    if (canSubmit) {
      onLogin({ email: email.trim(), domain: domain.trim(), token: token.trim() });
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit} autoComplete="off">
      <h1 className="login-form-title">Jira Project Dashboard</h1>
      <div className="login-form-group">
        <label htmlFor="jira-email">Email</label>
        <input
          id="jira-email"
          type="email"
          placeholder="you@company.com"
          value={email}
          autoComplete="username"
          onChange={e => setEmail(e.target.value)}
          className={!isEmailValid && touched ? 'invalid' : ''}
          disabled={loading}
        />
        {!isEmailValid && touched ? (
          <span className="login-form-error">Enter a valid email</span>
        ) : null}
      </div>
      <div className="login-form-group">
        <label htmlFor="jira-domain">Jira Domain</label>
        <input
          id="jira-domain"
          type="text"
          placeholder="your-domain.atlassian.net"
          value={domain}
          autoComplete="organization"
          onChange={e => setDomain(e.target.value)}
          className={!isDomainValid && touched ? 'invalid' : ''}
          disabled={loading}
        />
        {!isDomainValid && touched ? (
          <span className="login-form-error">Enter a valid domain</span>
        ) : null}
      </div>
      <div className="login-form-group">
        <label htmlFor="jira-token">API Token</label>
        <input
          id="jira-token"
          type="password"
          placeholder="Jira API Token"
          value={token}
          autoComplete="current-password"
          onChange={e => setToken(e.target.value)}
          className={!isTokenValid && touched ? 'invalid' : ''}
          disabled={loading}
        />
        {!isTokenValid && touched ? (
          <span className="login-form-error">API token is required</span>
        ) : null}
      </div>
      <button
        className="login-form-submit"
        type="submit"
        disabled={!canSubmit}
      >
        {loading ? (
          <span className="login-loading-spinner" aria-label="Loading"></span>
        ) : (
          'Login'
        )}
      </button>
      {error && <div className="login-form-server-error">{error}</div>}
    </form>
  );
}

export default LoginForm;
