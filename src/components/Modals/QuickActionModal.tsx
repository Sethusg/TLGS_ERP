import React from 'react';
import {
  X,
  UserPlus,
  GraduationCap,
  Users,
  CalendarCheck,
  CreditCard,
  CalendarClock,
  Award,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';
import { ErpRole, NavSection, RolePermissionMatrix } from '../../types';
import { canAccessModule, DEFAULT_ROLE_PERMISSIONS } from '../../config/rbac';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (section: NavSection, subItem?: string) => void;
  currentRole?: ErpRole;
  permissionMatrix?: RolePermissionMatrix;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  onSelectAction,
  currentRole = 'Super Administrator',
  permissionMatrix = DEFAULT_ROLE_PERMISSIONS,
}) => {
  if (!isOpen) return null;

  const allQuickActions = [
    {
      title: 'New Student Admission',
      desc: 'Start new enrollment application & verification workflow',
      icon: UserPlus,
      iconBg: 'bg-[#3978F6]/10 text-[#3978F6] border-[#3978F6]/20',
      section: 'STUDENT' as NavSection,
      sub: 'student-new-admission',
      requiredModule: 'STUDENT' as NavSection,
    },
    {
      title: 'Add Student',
      desc: 'Register student record into active school & campus roster',
      icon: GraduationCap,
      iconBg: 'bg-[#16B8A6]/10 text-[#16B8A6] border-[#16B8A6]/20',
      section: 'STUDENT' as NavSection,
      sub: 'student-user-details',
      requiredModule: 'STUDENT' as NavSection,
    },
    {
      title: 'Add Staff',
      desc: 'Onboard teaching or non-teaching staff & assign department',
      icon: Users,
      iconBg: 'bg-[#8055D9]/10 text-[#8055D9] border-[#8055D9]/20',
      section: 'STAFFS' as NavSection,
      sub: 'staff-info',
      requiredModule: 'STAFFS' as NavSection,
    },
    {
      title: 'Record Attendance',
      desc: 'Mark daily student or staff roll call & late arrivals',
      icon: CalendarCheck,
      iconBg: 'bg-[#22A06B]/10 text-[#22A06B] border-[#22A06B]/20',
      section: 'ATTENDANCE' as NavSection,
      sub: 'att-student-daily',
      requiredModule: 'ATTENDANCE' as NavSection,
    },
    {
      title: 'Collect Fees',
      desc: 'Open counter for tuition, transport & term fee receipts',
      icon: CreditCard,
      iconBg: 'bg-[#F59E0B]/10 text-[#D97706] border-[#F59E0B]/25',
      section: 'FEE MANAGEMENT' as NavSection,
      sub: 'fee-collection',
      requiredModule: 'FEE MANAGEMENT' as NavSection,
    },
    {
      title: 'Create Timetable',
      desc: 'Configure class periods, rooms & subject allocations',
      icon: CalendarClock,
      iconBg: 'bg-[#3978F6]/10 text-[#3978F6] border-[#3978F6]/20',
      section: 'ACADEMICS' as NavSection,
      sub: 'academics-timetable',
      requiredModule: 'ACADEMICS' as NavSection,
    },
    {
      title: 'Publish Examination Results',
      desc: 'Enter subject marks, grade distributions & report cards',
      icon: Award,
      iconBg: 'bg-[#EC4899]/10 text-[#EC4899] border-[#EC4899]/20',
      section: 'MARKCHART' as NavSection,
      sub: 'markchart-entry',
      requiredModule: 'MARKCHART' as NavSection,
    },
    {
      title: 'Generate Reports',
      desc: 'Export executive, academic, attendance & finance reports',
      icon: BarChart3,
      iconBg: 'bg-[#10213D]/10 text-[#10213D] border-[#10213D]/15',
      section: 'REPORTS' as NavSection,
      sub: 'rep-executive',
      requiredModule: 'REPORTS' as NavSection,
    },
  ];

  const permittedActions = allQuickActions.filter((action) =>
    canAccessModule(currentRole, action.requiredModule, permissionMatrix)
  );

  return (
    <div className="fixed inset-0 bg-[#10213D]/55 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-[#10213D] text-white flex items-center justify-between border-b border-[#D6AD52]/30">
          <div>
            <h3 className="text-base font-bold text-white">
              LEADERS ERP Quick Actions
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D6AD52]" />
              <span>
                Showing {permittedActions.length} of {allQuickActions.length} actions permitted for{' '}
                <strong className="text-[#D6AD52]">{currentRole}</strong>
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close quick actions modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {permittedActions.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">
              No quick action shortcuts are currently enabled for {currentRole}.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {permittedActions.map((action) => (
                <button
                  key={action.title}
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectAction(action.section, action.sub);
                  }}
                  className="p-3.5 border border-slate-200/90 rounded-xl hover:border-[#3978F6]/50 hover:shadow-md transition-all text-left flex items-start gap-3 bg-white hover:bg-[#F4F6FA]/70 group cursor-pointer"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${action.iconBg}`}
                  >
                    <action.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#10213D] group-hover:text-[#3978F6] transition-colors">
                      {action.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {action.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
