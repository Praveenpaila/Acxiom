import React from 'react';

const StatCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  variant = 'indigo', // indigo, green, amber, sky, purple, rose
}) => {
  return (
    <div className={`crm-card metric-card accent-${variant} h-100`}>
      <div className="d-flex align-items-start justify-content-between mb-2">
        <span className="metric-label">{title}</span>
        {Icon && (
          <div className={`metric-icon-box metric-icon-${variant}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
      <div className="metric-value">{value}</div>
      {subtext && <div className="text-muted small mt-1">{subtext}</div>}
    </div>
  );
};

export default StatCard;
