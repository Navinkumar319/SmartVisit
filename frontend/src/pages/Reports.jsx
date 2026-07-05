import React, { useState, useEffect } from 'react';
import SystemService from '../services/system.service';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Printer, 
  BarChart3, 
  PieChart, 
  TrendingUp,
  TableProperties
} from 'lucide-react';

const Reports = () => {
  const [reportType, setReportType] = useState('history');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Format dates clean to (DD MMM YYYY)
  const formatCleanDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIdx = parseInt(month, 10) - 1;
      if (mIdx >= 0 && mIdx < 12) {
        return `${day} ${months[mIdx]} ${year}`;
      }
    }
    return dateStr;
  };

  // 2. Format mobile numbers clean to (XXXXX-XXXXX)
  const formatCleanMobile = (mobileStr) => {
    if (!mobileStr) return 'N/A';
    const cleaned = mobileStr.replace(/\s+/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    }
    return mobileStr;
  };

  // 3. Escape CSV values robustly to prevent quote and comma splitting
  const escapeCSV = (field) => {
    if (field === null || field === undefined) return '';
    const stringVal = String(field);
    if (stringVal.includes('"') || stringVal.includes(',') || stringVal.includes('\n') || stringVal.includes('\r')) {
      return `"${stringVal.replace(/"/g, '""')}"`;
    }
    return stringVal;
  };

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

  const handleExportExcel = () => {
    if (reportData.length === 0) {
      alert('No data available to export.');
      return;
    }

    const headers = ['Visitor Code', 'Name', 'Mobile', 'Email', 'Company', 'Purpose', 'Host', 'Department', 'Visit Date', 'Status'];
    
    // Generate styled XML/HTML for Excel
    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Visitor Report</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; }
          th { background-color: #4F46E5; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px 12px; font-family: sans-serif; font-size: 13px; text-align: left; }
          td { border: 1px solid #cbd5e1; padding: 8px 12px; font-family: sans-serif; font-size: 12px; mso-number-format:"\\@"; } /* Force Excel text formatting */
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${reportData.map(v => `
              <tr>
                <td style="font-weight: bold; mso-number-format:'\\@';">${v.visitorCode || ''}</td>
                <td>${v.name || ''}</td>
                <td style="mso-number-format:'\\@';">${v.mobile || ''}</td>
                <td>${v.email || ''}</td>
                <td>${v.companyName || 'N/A'}</td>
                <td>${v.purpose || ''}</td>
                <td>${v.personToMeet || ''}</td>
                <td>${v.department || ''}</td>
                <td style="mso-number-format:'\\@';">${formatCleanDate(v.visitDate)}</td>
                <td>${v.status || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Visitor_Report_${reportType}_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  // Real-time Data Aggregations for SVG charts
  const statusCounts = reportData.reduce((acc, item) => {
    const status = item.status || 'UNKNOWN';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const departmentCounts = reportData.reduce((acc, item) => {
    const dept = item.department || 'Other';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  const statusList = Object.entries(statusCounts);
  const deptList = Object.entries(departmentCounts).sort((a, b) => b[1] - a[1]).slice(0, 5); // top 5

  // Donut chart path calculator helpers
  const getDonutSegments = () => {
    const total = reportData.length;
    if (total === 0) return [];
    
    let accumulatedPercent = 0;
    const colors = {
      APPROVED: '#10B981',
      PENDING: '#F59E0B',
      REJECTED: '#EF4444',
      CHECKED_IN: '#06B6D4',
      CHECKED_OUT: '#64748B'
    };

    return statusList.map(([status, count]) => {
      const percentage = (count / total) * 100;
      const startAngle = (accumulatedPercent / 100) * 360;
      const endAngle = ((accumulatedPercent + percentage) / 100) * 360;
      accumulatedPercent += percentage;

      // Draw SVG Arc
      const radStart = (startAngle - 90) * Math.PI / 180;
      const radEnd = (endAngle - 90) * Math.PI / 180;
      const x1 = 100 + 70 * Math.cos(radStart);
      const y1 = 100 + 70 * Math.sin(radStart);
      const x2 = 100 + 70 * Math.cos(radEnd);
      const y2 = 100 + 70 * Math.sin(radEnd);
      const largeArc = percentage > 50 ? 1 : 0;

      return {
        status,
        count,
        percentage: percentage.toFixed(0),
        color: colors[status] || 'var(--primary)',
        path: `M ${x1} ${y1} A 70 70 0 ${largeArc} 1 ${x2} ${y2}`
      };
    });
  };

  const donutSegments = getDonutSegments();

  return (
    <div className="page-wrapper print-area" style={{ animation: 'fadeIn 0.6s ease' }}>
      <div className="page-header-row no-print">
        <div>
          <h2>System Reports</h2>
          <p>Export historical logs and compile gate metrics across various intervals</p>
        </div>
      </div>

      {/* Select Filter and Export Actions Row */}
      <div className="reports-actions-bar no-print">
        <div className="form-group flex-grow" style={{ marginBottom: 0 }}>
          <label htmlFor="reportSelector">Select Report Range</label>
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
            <Download size={16} style={{ marginRight: '6px' }} />
            Export Excel
          </button>
          <button onClick={handleExportPDF} className="btn btn-primary flex-items-center" title="Print/Save as PDF">
            <Printer size={16} style={{ marginRight: '6px' }} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Print Specific Header */}
      <div className="print-header no-screen" style={{ marginBottom: '32px', borderBottom: '2px solid var(--primary)', paddingBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>Smart Visitor Management System</h1>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-muted)', marginTop: '6px', margin: '6px 0 0 0' }}>Visitor Log Audit Report - {reportType.toUpperCase()}</h2>
          </div>
          <div style={{ textAlign: 'right', fontSize: '12.5px', color: 'var(--text-muted)' }}>
            <p style={{ margin: '2px 0' }}><strong>Date:</strong> {new Date().toLocaleString()}</p>
            <p style={{ margin: '2px 0' }}><strong>Total:</strong> {reportData.length} records</p>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger no-print">{error}</div>}

      {/* Beautiful Charts Layout */}
      {!loading && reportData.length > 0 && (
        <div className="reports-charts-grid no-print">
          {/* Status Ratio Chart (Donut SVG) */}
          <div className="report-chart-card">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart size={18} style={{ color: 'var(--primary)' }} /> Status Distribution
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'center', minHeight: '200px' }}>
              <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
                {donutSegments.map((seg, i) => (
                  <path
                    key={i}
                    d={seg.path}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="20"
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.3s ease' }}
                  />
                ))}
                {donutSegments.length === 0 && (
                  <circle cx="100" cy="100" r="70" fill="none" stroke="var(--border-soft)" strokeWidth="20" />
                )}
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                {donutSegments.map((seg, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: seg.color }}></div>
                    <span style={{ fontWeight: '600' }}>{seg.status}:</span>
                    <span>{seg.count} ({seg.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Department stats (Bar SVG) */}
          <div className="report-chart-card">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={18} style={{ color: 'var(--primary)' }} /> Department Traffic (Top 5)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minHeight: '200px', justifyContent: 'center' }}>
              {deptList.map(([dept, count], i) => {
                const maxCount = Math.max(...deptList.map(d => d[1]));
                const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: '600' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{dept}</span>
                      <span>{count} visits</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--border-soft)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%)', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                );
              })}
              {deptList.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No department statistics recorded.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report Data Table */}
      {loading ? (
        <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>Loading report data...</div>
      ) : reportData.length === 0 ? (
        <div className="text-center py-4 card-empty-state content-card">No matching visitor records found for this report scope.</div>
      ) : (
        <div className="content-card" style={{ padding: '20px' }}>
          <h3 className="section-title-alt no-print" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
            <TableProperties size={18} /> Compilation Records ({reportData.length})
          </h3>
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
                    <td>{formatCleanMobile(v.mobile)}</td>
                    <td>{v.personToMeet}</td>
                    <td>{v.department}</td>
                    <td>{formatCleanDate(v.visitDate)}</td>
                    <td>
                      <span className={getStatusBadgeClass(v.status)}>{v.status.replace('_', ' ')}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
