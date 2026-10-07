import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center text-center p-5" style={{ minHeight: '60vh' }}>
      <div className="brand-icon-box mb-3" style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#fb7185', width: '56px', height: '56px' }}>
        <FileQuestion size={32} />
      </div>
      <h2 className="text-white mb-2">Page Not Found</h2>
      <p className="text-muted small mb-4" style={{ maxWidth: '380px' }}>
        The route or view you are trying to access does not exist in AcxiomCRM.
      </p>
      <Link to="/dashboard" className="btn btn-crm-primary d-inline-flex align-items-center gap-2">
        <Home size={16} /> Back to Dashboard
      </Link>
    </div>
  );
};

export default NotFoundPage;
