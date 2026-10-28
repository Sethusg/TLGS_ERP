import React, { useState } from 'react';
import {
  Bell,
  X,
  CheckCircle2,
  Clock,
  Cake,
  CreditCard,
  FileText,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { LeaveRequest, Staff, BirthdayItem, NavSection } from '../../types';

export interface SystemNotification {
  id: string;
  type: 'leave' | 'payroll' | 'birthday' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionSection?: NavSection;
  actionSubItem?: string;
  actionLabel?: string;
}

interface NotificationCenterProps {
  leaveRequests: LeaveRequest[];
  staffList: Staff[];
  birthdays: BirthdayItem[];
  onNavigate: (section: NavSection, subItem?: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  leaveRequests,
  staffList,
  birthdays,
  onNavigate,
  isOpen,
  onClose,
}) => {
  const pendingLeaves = leaveRequests.filter((r) => r.status === 'Pending');
  const todayBirthdays = birthdays.filter((b) => b.dob.endsWith('10-23') || b.dob.endsWith('10-24'));

  // Generate dynamic automated notifications from system state
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'ALL' | 'leave' | 'payroll' | 'birthday'>('ALL');

  const notifications: SystemNotification[] = [
    // Leave Approvals alert
    ...pendingLeaves.slice(0, 3).map((l) => ({
      id: `notif-leave-${l.id}`,
      type: 'leave' as const,
      title: `Upcoming Leave Approval: ${l.staffName}`,
      message: `${l.staffName} (${l.department}) requested ${l.days} days ${l.leaveType} (${l.startDate} to ${l.endDate}). Reason: "${l.reason}"`,
      timestamp: '15 mins ago',
      read: readIds.has(`notif-leave-${l.id}`),
      actionSection: 'STAFFS' as NavSection,
      actionSubItem: 'staff-leave-request',
      actionLabel: 'Review Request',
    })),
    // Payroll alert
    {
      id: 'notif-payroll-oct',
      type: 'payroll',
      title: 'Monthly Payroll Generated (October 2026)',
      message:
        'October 2026 faculty and administrative salaries computed with LWP attendance deductions. ₹42.8 Lakhs ready for direct bank credit dispatch.',
      timestamp: 'Today, 08:30 AM',
      read: readIds.has('notif-payroll-oct'),
      actionSection: 'STAFFS',
      actionSubItem: 'staff-payroll',
      actionLabel: 'Disburse Payroll',
    },
    // Birthday reminders
    ...todayBirthdays.map((b) => ({
      id: `notif-bday-${b.id}`,
      type: 'birthday' as const,
      title: `🎂 Birthday Alert: ${b.name} (${b.role})`,
      message: `Celebrates birthday today! Send automated institutional SMS greetings or greetings card from THE LEADERS ACADEMY(CBSE) Admin.`,
      timestamp: 'Today, 07:00 AM',
      read: readIds.has(`notif-bday-${b.id}`),
      actionSection: 'HOME' as NavSection,
      actionLabel: 'Send Wishes',
    })),
    // System maintenance & backup alert
    {
      id: 'notif-backup-status',
      type: 'system',
      title: 'Database Cloud Backup Verification',
      message: 'Automated nightly state snapshot completed successfully. 1,069 students, 120 staff, 305 leaves verified.',
      timestamp: 'Yesterday, 11:45 PM',
      read: readIds.has('notif-backup-status'),
      actionSection: 'SETTINGS',
      actionLabel: 'View Settings',
    },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    const allIds = new Set(notifications.map((n) => n.id));
    setReadIds(allIds);
  };

  const handleItemClick = (n: SystemNotification) => {
    setReadIds((prev) => new Set([...prev, n.id]));
    if (n.actionSection) {
      onNavigate(n.actionSection, n.actionSubItem);
      onClose();
    }
  };

  const filteredNotifs = notifications.filter((n) => filter === 'ALL' || n.type === filter);

  if (!isOpen) return null;

  const getTypeIcon = (type: SystemNotification['type']) => {
    switch (type) {
      case 'leave':
        return (
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        );
      case 'payroll':
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
        );
      case 'birthday':
        return (
          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <Cake className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-2 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] mt-12 sm:mr-2">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white relative">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-1 right-1" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">THE LEADERS ACADEMY Notification Center</h3>
              <p className="text-[11px] text-slate-400">
                {unreadCount > 0 ? `${unreadCount} unread automated alerts` : 'All alerts caught up'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills & Actions */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors font-semibold ${
                filter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('leave')}
              className={`px-2 py-1 rounded-md transition-colors ${
                filter === 'leave'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Leaves
            </button>
            <button
              onClick={() => setFilter('payroll')}
              className={`px-2 py-1 rounded-md transition-colors ${
                filter === 'payroll'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Payroll
            </button>
            <button
              onClick={() => setFilter('birthday')}
              className={`px-2 py-1 rounded-md transition-colors ${
                filter === 'birthday'
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Birthdays
            </button>
          </div>

          <button
            onClick={handleMarkAllRead}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
          >
            Mark all read
          </button>
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
          {filteredNotifs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No notifications in this category.
            </div>
          ) : (
            filteredNotifs.map((n) => (
              <div
                key={n.id}
                onClick={() => handleItemClick(n)}
                className={`p-4 transition-colors cursor-pointer flex items-start gap-3 ${
                  n.read ? 'bg-white hover:bg-slate-50/80' : 'bg-blue-50/40 hover:bg-blue-50/70'
                }`}
              >
                {getTypeIcon(n.type)}
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4
                      className={`text-xs leading-snug ${
                        n.read ? 'font-semibold text-slate-800' : 'font-bold text-slate-900'
                      }`}
                    >
                      {n.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 shrink-0">{n.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{n.message}</p>

                  {n.actionLabel && (
                    <div className="pt-1 flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700">
                      <span>{n.actionLabel}</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <span>Synced with Live ERP Database</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-800 text-white rounded-md font-semibold hover:bg-gray-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
