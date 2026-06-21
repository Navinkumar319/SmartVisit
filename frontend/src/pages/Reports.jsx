import React, { useState, useEffect } from 'react';
import SystemService from '../services/system.service';

const Reports = () => {
  const [reportType, setReportType] = useState('history');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await SystemService.getReportData(reportType);
      setReportData(data);
    } catch (err) {
      setError('Failed to fetch report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  // Real Excel Export (Dynamic CSV Generation and download)
  const handleExportExcel = () => {
    if (reportData.length === 0) {
      alert('No data available to export.');
      return;
    }

    const headers = ['Visitor Code', 'Name', 'Mobile', 'Email', 'Company', 'Purpose', 'Host', 'Department', 'Visit Date', 'Status'];
    const csvContent = [
      headers.join(','), // headers row
      ...reportData.map((v) => [
        `"${v.visitorCode}"`,
        `"${v.name}"`,
        `"${v.mobile}"`,
        `"${v.email}"`,
        `"${v.companyName || 'N/A'}"`,
        `"${v.purpose}"`,
        `"${v.personToMeet}"`,
        `"${v.department}"`,
        `"${v.visitDate}"`,
        `"${v.status}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Visitor_Report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Export Trigger (Opens browser print window targeting report content area)
  const handleExportPDF = () => {
    if (reportData.length === 0) {
      alert('No data available to export.');
      return;
    }
    window.print();
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING': return 'badge badge-warning';
      case 'APPROVED': return 'badge badge-success';
      case 'REJECTED': return 'badge badge-danger';
      case 'CHECKED_IN': return 'badge badge-info';
      case 'CHECKED_OUT': return 'badge badge-dark';
      default: return 'badge';
    }
  };

  return (
    <div className="page-wrapper print-area">
      <div className="page-header-row no-print">
        <h2>System Reports</h2>
        <p>Compile and export visitor logs based on time intervals and statuses</p>
      </div>

      {/* Select Filter and Export Actions Row */}
      <div className="reports-actions-bar no-print">
        <div className="form-group flex-grow">
          <label htmlFor="reportSelector">Select Report Type</label>
          <select
            id="reportSelector"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="history">Complete Visitor History</option>
            <option value="daily">Daily Visitors (Today)</option>
            <option value="weekly">Weekly Visitors (Past 7 Days)</option>
            <option value="monthly">Monthly Visitors (Past 30 Days)</option>
            <option value="approved">Approved Visitors Only</option>
            <option value="rejected">Rejected Visitors Only</option>
          </select>
        </div>

        <div className="export-buttons-group">
          <button onClick={handleExportExcel} className="btn btn-secondary flex-items-center" title="Export to CSV Excel">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginRight: '6px' }}>
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-6 2h5v3h-5V5zm0 5h5v3h-5v-3zM5 5h6v8H5V5zm0 10h6v4H5v-4zm8 4v-4h5v4h-5z"/>
            </svg>
            Export Excel
          </button>
          <button onClick={handleExportPDF} className="btn btn-primary flex-items-center" title="Print/Save as PDF">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginRight: '6px' }}>
              <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      <div className="print-header no-screen">
        <h1>Smart Visitor Management System</h1>
        <h2>Visitor Log Report - {reportType.toUpperCase()}</h2>
        <p>Report Compiled On: {new Date().toLocaleString()}</p>
      </div>

      {error && <div className="alert alert-danger no-print">{error}</div>}

      {/* Report Data Table */}
      {loading ? (
        <div className="text-center py-4">Loading report...</div>
      ) : reportData.length === 0 ? (
        <div className="text-center py-4 card-empty-state">No matching visitor records found for this report scope.</div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Visitor Name</th>
                <th>Mobile</th>
                <th>Host</th>
                <th>Department</th>
                <th>Visit Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((v) => (
                <tr key={v.visitorId}>
                  <td className="font-bold">{v.visitorCode}</td>
                  <td>{v.name}</td>
                  <td>{v.mobile}</td>
                  <td>{v.personToMeet}</td>
                  <td>{v.department}</td>
                  <td>{v.visitDate}</td>
                  <td>
                    <span className={getStatusBadgeClass(v.status)}>{v.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Reports;
