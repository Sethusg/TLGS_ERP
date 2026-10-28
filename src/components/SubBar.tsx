import React from 'react';
import { RotateCw, Search, Sparkles, Plus, Camera, Bell, Printer } from 'lucide-react';
import { NavSection } from '../types';

interface SubBarProps {
  currentSection: NavSection;
  activeSubTitle?: string;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenQuickAction: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  unreadNotifCount?: number;
  onOpenNotifications?: () => void;
  onOpenQRScanner?: () => void;
}

export const SubBar: React.FC<SubBarProps> = ({
  currentSection,
  activeSubTitle,
  onRefresh,
  isRefreshing,
  onOpenQuickAction,
  searchQuery,
  onSearchChange,
  unreadNotifCount = 3,
  onOpenNotifications,
  onOpenQRScanner,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
      <div className="flex items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <span>THE LEADERS ACADEMY(CBSE)</span>
          <span className="text-xs font-normal text-slate-500 hidden md:inline">
            (Affiliation #1930812)
          </span>
        </h1>

        {activeSubTitle && (
          <div className="flex items-center text-xs font-medium">
            <span className="mx-1 text-slate-400">/</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200/80 text-[11px]">
              {activeSubTitle}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2.5 self-end sm:self-auto w-full sm:w-auto justify-between sm:justify-end">
        {/* Search Input */}
        <div className="relative w-44 sm:w-60">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search student, staff, roll..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Optical Camera QR Scanner Button */}
        {onOpenQRScanner && (
          <button
            onClick={onOpenQRScanner}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors border border-slate-200 shrink-0"
            title="Launch Camera QR Scanner for Student / Asset / Staff check-in"
          >
            <Camera className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden md:inline">QR Scan</span>
          </button>
        )}

        {/* Print Button */}
        <button
          onClick={() => window.print()}
          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors border border-slate-200 shrink-0 cursor-pointer"
          title="Print Current Page / Report"
          aria-label="Print page"
        >
          <Printer className="w-4 h-4 text-slate-700" />
        </button>

        {/* Notification Bell Button */}
        {onOpenNotifications && (
          <button
            onClick={onOpenNotifications}
            className="relative p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors border border-slate-200 shrink-0"
            title="Automated Leave, Payroll & Birthday Notifications"
            aria-label="Open notifications"
          >
            <Bell className="w-4 h-4 text-slate-700" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1 min-w-[16px] h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                {unreadNotifCount}
              </span>
            )}
          </button>
        )}

        {/* Quick Action Button */}
        <button
          onClick={onOpenQuickAction}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-xs shadow-blue-600/20 shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Action</span>
        </button>

        {/* Refresh Icon Button from screenshot */}
        <button
          onClick={onRefresh}
          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors border border-slate-200 shrink-0 cursor-pointer"
          title="Refresh Data"
          aria-label="Refresh application data"
        >
          <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
};
