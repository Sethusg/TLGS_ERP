import React from 'react';
import { RotateCw, Search, Sparkles, Plus } from 'lucide-react';
import { NavSection } from '../types';

interface SubBarProps {
  currentSection: NavSection;
  activeSubTitle?: string;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenQuickAction: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const SubBar: React.FC<SubBarProps> = ({
  currentSection,
  activeSubTitle,
  onRefresh,
  isRefreshing,
  onOpenQuickAction,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
      <div className="flex items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-800 flex items-center gap-2">
          <span>EduNiv</span>
          <span className="text-xs font-normal text-gray-500 hidden md:inline">
            | The Learner&apos;s Academy CBSE (Affiliation #1930812)
          </span>
        </h1>

        {activeSubTitle && (
          <div className="flex items-center text-xs text-gray-500 font-medium">
            <span className="mx-1 text-gray-400">/</span>
            <span className="text-[#e91e63] font-semibold">{activeSubTitle}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2.5 self-end sm:self-auto w-full sm:w-auto justify-between sm:justify-end">
        {/* Search Input */}
        <div className="relative w-48 sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search student, staff, roll..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-[#e91e63] focus:bg-white transition-colors"
          />
        </div>

        {/* Quick Action Button */}
        <button
          onClick={onOpenQuickAction}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#e91e63] rounded-md hover:bg-[#d81b60] transition-colors shadow-2xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Action</span>
        </button>

        {/* Refresh Icon Button from screenshot */}
        <button
          onClick={onRefresh}
          className="p-1.5 text-[#e91e63] hover:bg-pink-50 rounded-md transition-colors border border-pink-100 shrink-0"
          title="Refresh Data"
          aria-label="Refresh application data"
        >
          <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
};
