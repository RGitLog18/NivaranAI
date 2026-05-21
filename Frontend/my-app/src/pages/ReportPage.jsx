import React, { useState, useMemo } from 'react';
import { useComplaints } from '../context/ComplaintContext';
import { Link } from 'react-router-dom';
import './ReportPage.css';

export default function ReportPage() {
  const { complaints } = useComplaints();
  const [groupBy, setGroupBy] = useState('category');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterWard, setFilterWard] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const wards = ['All', ...new Set(complaints.map((c) => c.ward).filter(Boolean))];
  const statuses = ['All', 'Pending', 'In Progress', 'Resolved', 'Rejected'];

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      if (filterStatus !== 'All' && c.status !== filterStatus) return false;
      if (filterWard !== 'All' && c.ward !== filterWard) return false;
      if (dateFrom && c.date < dateFrom) return false;
      if (dateTo && c.date > dateTo) return false;
      return true;
    });
  }, [complaints, filterStatus, filterWard, dateFrom, dateTo]);

  const reportData = useMemo(() => {
    const groups = {};
    filteredComplaints.forEach((c) => {
      const key = groupBy === 'category' ? c.category
        : groupBy === 'location' ? c.ward || 'Unknown'
        : groupBy === 'status' ? c.status
        : groupBy === 'priority' ? c.priority
        : c.category;
      if (!groups[key]) groups[key] = { count: 0, pending: 0, resolved: 0, inProgress: 0 };
      groups[key].count++;
      if (c.status === 'Pending') groups[key].pending++;
      if (c.status === 'Resolved') groups[key].resolved++;
      if (c.status === 'In Progress') groups[key].inProgress++;
    });
    const total = filteredComplaints.length || 1;
    return Object.entries(groups).map(([name, data]) => ({
      name,
      ...data,
      percentage: ((data.count / total) * 100).toFixed(1),
      resolvedPct: ((data.resolved / (data.count || 1)) * 100).toFixed(1),
    })).sort((a, b) => b.count - a.count);
  }, [filteredComplaints, groupBy]);

  const overallStats = useMemo(() => {
    const total = filteredComplaints.length;
    const resolved = filteredComplaints.filter((c) => c.status === 'Resolved').length;
    const pending = filteredComplaints.filter((c) => c.status === 'Pending').length;
    const urgent = filteredComplaints.filter((c) => c.priority === 'Urgent').length;
    return { total, resolved, pending, urgent, resolutionRate: total ? ((resolved / total) * 100).toFixed(1) : '0' };
  }, [filteredComplaints]);

  return (
    <div className="report-page">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <span className="nav-icon">🏛️</span>
          <span>Grievance Management System</span>
        </div>
        <div className="nav-links">
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/reports" className="nav-link active">Reports</Link>
          <Link to="/" className="nav-link">Citizen Portal</Link>
        </div>
      </nav>

      <div className="report-content">
        <h1 className="report-title">Complaint Report</h1>

        <div className="report-filters">
          <div className="filter-group">
            <label>Group By</label>
            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
              <option value="category">Category</option>
              <option value="location">Ward / Location</option>
              <option value="status">Status</option>
              <option value="priority">Priority</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              {statuses.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Ward</label>
            <select value={filterWard} onChange={(e) => setFilterWard(e.target.value)}>
              {wards.map((w) => <option key={w}>{w}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="filter-group">
            <label>To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>

        <div className="overview-cards">
          <div className="overview-card">
            <div className="overview-num">{overallStats.total}</div>
            <div className="overview-label">Total Complaints</div>
          </div>
          <div className="overview-card">
            <div className="overview-num">{overallStats.resolutionRate}%</div>
            <div className="overview-label">Resolution Rate</div>
          </div>
          <div className="overview-card">
            <div className="overview-num">{overallStats.pending}</div>
            <div className="overview-label">Pending</div>
          </div>
          <div className="overview-card">
            <div className="overview-num">{overallStats.urgent}</div>
            <div className="overview-label">Urgent</div>
          </div>
        </div>

        <div className="report-table-section">
          <h2>Breakdown by {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}</h2>
          <table className="report-table">
            <thead>
              <tr>
                <th>{groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}</th>
                <th>Count</th>
                <th>% of Total</th>
                <th>Pending</th>
                <th>In Progress</th>
                <th>Resolved</th>
                <th>Resolution %</th>
                <th>Distribution</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((row) => (
                <tr key={row.name}>
                  <td className="row-name">{row.name}</td>
                  <td>{row.count}</td>
                  <td>{row.percentage}%</td>
                  <td>{row.pending}</td>
                  <td>{row.inProgress}</td>
                  <td>{row.resolved}</td>
                  <td>{row.resolvedPct}%</td>
                  <td>
                    <div className="bar-container">
                      <div className="bar-fill" style={{ width: `${row.percentage}%` }}></div>
                    </div>
                  </td>
                </tr>
              ))}
              {reportData.length === 0 && (
                <tr><td colSpan={8} className="empty-row">No data for selected filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
