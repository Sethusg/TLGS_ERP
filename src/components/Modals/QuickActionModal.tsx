import React from 'react';
import {
  X,
  UserPlus,
  CreditCard,
  FileCheck2,
  Calendar,
  MessageSquare,
  Plus,
  FileText,
  Boxes,
} from 'lucide-react';
import { NavSection } from '../../types';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (section: NavSection, subItem?: string) => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  if (!isOpen) return null;

  const quickActions = [
    {
      title: 'New Student Admission',
      desc: 'Register a new student with CBSE enrollment',
      icon: UserPlus,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      section: 'STUDENT' as NavSection,
      sub: 'student-user-details',
    },
    {
      title: 'Collect School Fee',
      desc: 'Open counter for tuition, transport, and exam fee',
      icon: CreditCard,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      section: 'FEE MANAGEMENT' as NavSection,
      sub: 'fee-collection',
    },
    {
      title: 'Apply Staff Leave',
      desc: 'Submit teacher or admin staff leave application',
      icon: Calendar,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      section: 'STAFFS' as NavSection,
      sub: 'staff-leave-apply',
    },
    {
      title: 'Onboard Faculty / Staff',
      desc: 'Register teacher profile, role, subjects & responsibilities',
      icon: UserPlus,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      section: 'STAFFS' as NavSection,
      sub: 'staff-info',
    },
    {
      title: 'Issue Transfer Certificate (TC)',
      desc: 'Generate official CBSE certificate with serial no.',
      icon: FileCheck2,
      color: 'bg-slate-100 text-slate-700 border-slate-200',
      section: 'TC' as NavSection,
      sub: 'tc-create',
    },
    {
      title: 'Broadcast Parent SMS',
      desc: 'Send urgent advisory or circular notification via SMS',
      icon: MessageSquare,
      color: 'bg-violet-50 text-violet-700 border-violet-200',
      section: 'CONTACT' as NavSection,
      sub: 'contact-messaging',
    },
    {
      title: 'Publish School Circular',
      desc: 'Release official PDF notification on mobile app & portal',
      icon: FileText,
      color: 'bg-sky-50 text-sky-700 border-sky-200',
      section: 'SCHOOL' as NavSection,
      sub: 'school-circulars',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">THE LEADERS ACADEMY(CBSE) Quick Action Dispatcher</h3>
            <p className="text-xs text-slate-500">Rapid access to frequently used operational workflows</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                onClose();
                onSelectAction(action.section, action.sub);
              }}
              className="p-3.5 border border-slate-200 rounded-xl hover:shadow-md transition-all text-left flex items-start gap-3 bg-white hover:bg-slate-50/80 group cursor-pointer"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${action.color}`}
              >
                <action.icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {action.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{action.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
