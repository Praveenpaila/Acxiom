import React from 'react';

const PageHeader = ({ title, subtitle, children }) => {
  return (
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-2 border-bottom border-secondary border-opacity-10 gap-3">
      <div>
        <h2 className="m-0 fw-bold">{title}</h2>
        {subtitle && <p className="text-muted small m-0 mt-1">{subtitle}</p>}
      </div>
      {children && <div className="d-flex align-items-center gap-2">{children}</div>}
    </div>
  );
};

export default PageHeader;
