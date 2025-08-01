import React from 'react';

// PUBLIC_INTERFACE
function ErrorMessage({ children }) {
  /** Renders an error message in the style used by forms. */
  if (!children) return null;
  return <div style={{
    color: '#ff5630',
    margin: '8px 0',
    textAlign: 'center',
    fontWeight: 500,
    fontSize: '1rem'
  }}>{children}</div>;
}

export default ErrorMessage;
