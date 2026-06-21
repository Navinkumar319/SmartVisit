package com.svms.dto;

public class DashboardStats {
    private long totalVisitors;
    private long visitorsToday;
    private long checkedInVisitors;
    private long checkedOutVisitors;
    private long pendingApprovals;
    private long rejectedVisitors;

    // Constructors
    public DashboardStats() {}

    public DashboardStats(long totalVisitors, long visitorsToday, long checkedInVisitors, long checkedOutVisitors, long pendingApprovals, long rejectedVisitors) {
        this.totalVisitors = totalVisitors;
        this.visitorsToday = visitorsToday;
        this.checkedInVisitors = checkedInVisitors;
        this.checkedOutVisitors = checkedOutVisitors;
        this.pendingApprovals = pendingApprovals;
        this.rejectedVisitors = rejectedVisitors;
    }

    // Getters and Setters
    public long getTotalVisitors() {
        return totalVisitors;
    }

    public void setTotalVisitors(long totalVisitors) {
        this.totalVisitors = totalVisitors;
    }

    public long getVisitorsToday() {
        return visitorsToday;
    }

    public void setVisitorsToday(long visitorsToday) {
        this.visitorsToday = visitorsToday;
    }

    public long getCheckedInVisitors() {
        return checkedInVisitors;
    }

    public void setCheckedInVisitors(long checkedInVisitors) {
        this.checkedInVisitors = checkedInVisitors;
    }

    public long getCheckedOutVisitors() {
        return checkedOutVisitors;
    }

    public void setCheckedOutVisitors(long checkedOutVisitors) {
        this.checkedOutVisitors = checkedOutVisitors;
    }

    public long getPendingApprovals() {
        return pendingApprovals;
    }

    public void setPendingApprovals(long pendingApprovals) {
        this.pendingApprovals = pendingApprovals;
    }

    public long getRejectedVisitors() {
        return rejectedVisitors;
    }

    public void setRejectedVisitors(long rejectedVisitors) {
        this.rejectedVisitors = rejectedVisitors;
    }
}
