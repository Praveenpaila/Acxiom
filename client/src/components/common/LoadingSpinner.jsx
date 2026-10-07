import React from 'react';

const LoadingSpinner = ({ message = 'Loading AcxiomCRM...', fullScreen = false }) => {
  const content = (
    <div className="d-flex flex-column align-items-center justify-content-center p-5 text-center">
      <div className="spinner-border text-primary mb-3" style={{ width: '2.5rem', height: '2.5rem' }} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="text-muted small m-0">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: '100vh', background: 'var(--bg-app)' }}
      >
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
