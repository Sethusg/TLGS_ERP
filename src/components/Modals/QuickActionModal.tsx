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
      color: 'bg-teal-50 text-[#00acc1] border-teal-200',
      section: 'STUDENT' as NavSection,
      sub: 'student-user-details',
    },
    {
      title: 'Collect School Fee',
      desc: 'Open counter for tuition, transport, and exam fee',
      icon: CreditCard,
      color: 'bg-blue-50 text-[#1976d2] border-blue-200',
      section: 'FEE MANAGEMENT' as NavSection,
      sub: 'fee-collection',
    },
    {
      title: 'Apply Staff Leave',
      desc: 'Submit teacher or admin staff leave application',
      icon: Calendar,
      color: 'bg-emerald-50 text-[#43a047] border-emerald-200',
      section: 'STAFFS' as NavSection,
      sub: 'staff-leave-apply',
    },
    {
      title: 'Onboard Faculty / Staff',
      desc: 'Register teacher profile, role, subjects & responsibilities',
      icon: UserPlus,
      color: 'bg-emerald-50 text-[#43a047] border-emerald-200',
      section: 'STAFFS' as NavSection,
      sub: 'staff-info',
    },
    {
      title: 'Issue Transfer Certificate (TC)',
      desc: 'Generate official CBSE certificate with serial no.',
      icon: FileCheck2,
      color: 'bg-pink-50 text-[#e91e63] border-pink-200',
      section: 'TC' as NavSection,
      sub: 'tc-create',
    },
    {
      title: 'Broadcast Parent SMS',
      desc: 'Send urgent advisory or circular notification via SMS',
      icon: MessageSquare,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      section: 'CONTACT' as NavSection,
      sub: 'contact-messaging',
    },
    {
      title: 'Publish School Circular',
      desc: 'Release official PDF notification on mobile app & portal',
      icon: FileText,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      section: 'SCHOOL' as NavSection,
      sub: 'school-circulars',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-gray-200 p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">EduNiv Quick Action Dispatcher</h3>
            <p className="text-xs text-gray-500">Rapid access to frequently used operational workflows</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
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
              className="p-3.5 border rounded-xl hover:shadow-md transition-all text-left flex items-start gap-3 bg-white hover:bg-gray-50/80 group cursor-pointer"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${action.color}`}
              >
                <action.icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 group-hover:text-[#e91e63] transition-colors">
                  {action.title}
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{action.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
