import React from 'react';
import { getDocumentUrl } from '../utils/api';

function IncidentTable({ reports }) {
  if (!reports || reports.length === 0) {
    return <p>No reports found for the selected period.</p>;
  }

  const handleDocumentClick = async (reportId) => {
    try {
      const { url } = await getDocumentUrl(reportId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      alert('Document not available');
    }
  };

  return (
    <table className="incident-table">
      <thead>
        <tr>
          <th>Category</th>
          <th>Title</th>
          <th>Country</th>
          <th>Records</th>
          <th>Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {reports.map((report) => (
          <tr key={report.report_id}>
            <td>{report.category}</td>
            <td>
              <a href={report.url} target="_blank" rel="noopener noreferrer">
                {report.title}
              </a>
            </td>
            <td>{report.country_name}</td>
            <td>{report.record_count}</td>
            <td>{new Date(report.timestamp).toLocaleDateString()}</td>
            <td>
              {report.doc_path && (
                <button onClick={() => handleDocumentClick(report.report_id)}>
                  View Document
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default IncidentTable;
