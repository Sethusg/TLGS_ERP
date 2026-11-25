import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Palette,
  X,
  Building2,
} from 'lucide-react';
import {
  ManagedMainMenu,
  MenuVisibilityMap,
  NavSection,
  RolePermissionMatrix,
} from '../types';
import { LeadersSchoolLogo } from './LeadersSchoolLogo';
import {
  getMenusForRole,
  getVisibleSidebarMenus,
  resolveParentMenuId,
  SidebarResolvedMainMenu,
} from '../config/navigation';
import { NavAppearanceSettings } from './Modals/NavAppearanceModal';

interface SidebarNavProps {
  currentSection: NavSection;
  activeSubItem?: string;
  onSelectSection: (section: NavSection, subItem?: string) => void;
  userRole?: string;
  managedMenus?: ManagedMainMenu[];
  selectedSchoolId?: string;
  selectedCampusId?: string;
  permissionMatrix?: RolePermissionMatrix;
  menuVisibility?: MenuVisibilityMap;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  navSettings: NavAppearanceSettings;
  onOpenAppearanceModal: () => void;
  activeSchoolShortName: string;
  activeCampusLabel: string;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  currentSection,
  activeSubItem,
  onSelectSection,
  userRole,
  managedMenus,
  selectedSchoolId = 'all',
  selectedCampusId = 'all',
  permissionMatrix,
  menuVisibility,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  navSettings,
  onOpenAppearanceModal,
  activeSchoolShortName,
  activeCampusLabel,
}) => {
  const activeParentId = resolveParentMenuId(currentSection);

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    [activeParentId]: true,
  });
  const [hoveredFlyout, setHoveredFlyout] = useState<string | null>(null);

  useEffect(() => {
    setExpandedMenus((prev) => ({ ...prev, [activeParentId]: true }));
  }, [activeParentId]);

  const effectiveMenus: SidebarResolvedMainMenu[] = useMemo(() => {
    if (managedMenus && managedMenus.length > 0) {
      return getVisibleSidebarMenus(
        managedMenus,
        userRole,
        permissionMatrix,
        selectedSchoolId,
        selectedCampusId
      );
    }
    return getMenusForRole(userRole, permissionMatrix, menuVisibility).map((m) => ({
      menuId: m.id,
      index: m.index,
      id: m.id,
      label: m.label,
      shortLabel: m.shortLabel,
      description: m.description,
      icon: m.icon,
      subItems: m.subItems.map((s, idx) => ({
        id: `${m.id}-${idx}`,
        label: s.label,
        actionId: s.actionId,
        targetSection: s.targetSection || m.id,
        iconName: 'FolderKanban',
      })),
    }));
  }, [
    managedMenus,
    userRole,
    permissionMatrix,
    menuVisibility,
    selectedSchoolId,
    selectedCampusId,
  ]);

  const handleToggleSubmenu = (menuKey: string) => {
    setExpandedMenus((prev) => ({ ...prev, [menuKey]: !prev[menuKey] }));
  };

  const handleNavigateAndClose = (section: NavSection, subItem?: string) => {
    onSelectSection(section, subItem);
    setHoveredFlyout(null);
    onCloseMobile();
  };

  const highlightColor = navSettings.highlightColor || '#D4AF37';
  const isLightHighlight =
    highlightColor.toLowerCase() === '#d4af37' ||
    highlightColor.toLowerCase() === '#f59e0b' ||
    highlightColor.toLowerCase() === '#eab308' ||
    highlightColor.toLowerCase() === '#ffffff';
  const activeTextColor = isLightHighlight ? '#0B1F3A' : '#FFFFFF';

  const renderSidebarContent = (collapsed: boolean) => (
    <div className="flex flex-col h-full bg-[#0B1F3A] text-white select-none border-r border-white/10">
      {/* Brand Header */}
      <div
        className={`h-16 flex items-center shrink-0 border-b border-white/10 ${
          collapsed ? 'justify-center px-2' : 'justify-between px-4'
        }`}
      >
        <div
          onClick={() => handleNavigateAndClose('HOME', 'dashboard-overview')}
          className="cursor-pointer min-w-0 flex items-center"
        >
          <LeadersSchoolLogo
            customLogoUrl={navSettings.logoUrl}
            variant={collapsed ? 'compact' : 'full'}
            className="max-h-10"
          />
        </div>

        {!collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:text-[#D4AF37] hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden flex items-center justify-center w-8 h-8 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close navigation drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Collapsed Expand Trigger */}
      {collapsed && (
        <div className="hidden lg:flex justify-center py-2.5 border-b border-white/10 shrink-0">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex items-center justify-center w-9 h-8 rounded-md text-slate-400 hover:text-[#D4AF37] hover:bg-white/10 transition-colors cursor-pointer"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Active Institution Indicator */}
      {!collapsed && (
        <div className="px-4 py-2.5 border-b border-white/10 bg-[#08172C]/70 shrink-0">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#D4AF37] truncate">
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{activeSchoolShortName}</span>
          </div>
          <p className="text-[10.5px] text-slate-400 truncate mt-0.5 pl-5.5">
            {activeCampusLabel}
          </p>
        </div>
      )}

      {/* 17 Main ERP Modules Tree */}
      <nav
        className="flex-1 overflow-y-auto sidebar-scroll py-3 px-2.5 space-y-1"
        aria-label="Multi-School ERP Navigation"
      >
        {!collapsed && (
          <div className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400/90">
            ERP Modules ({effectiveMenus.length})
          </div>
        )}

        {effectiveMenus.map((item) => {
          const isCustom = item.id === 'CUSTOM_MENU';
          const isActive = isCustom
            ? currentSection === 'CUSTOM_MENU' &&
              (activeSubItem === item.menuId ||
                item.subItems.some((s) => s.actionId === activeSubItem))
            : activeParentId === item.id;
          const isExpanded = Boolean(expandedMenus[item.menuId]);
          const Icon = item.icon;
          const firstSub = item.subItems[0];

          return (
            <div
              key={item.menuId}
              className="relative"
              onMouseEnter={() => collapsed && setHoveredFlyout(item.menuId)}
              onMouseLeave={() => collapsed && setHoveredFlyout(null)}
            >
              <button
                type="button"
                onClick={() => {
                  const defaultTarget = firstSub?.targetSection || item.id;
                  const defaultAction = firstSub?.actionId || item.menuId;
                  if (collapsed) {
                    handleNavigateAndClose(defaultTarget, defaultAction);
                  } else if (!isActive) {
                    onSelectSection(defaultTarget, defaultAction);
                    setExpandedMenus((prev) => ({ ...prev, [item.menuId]: true }));
                  } else {
                    handleToggleSubmenu(item.menuId);
                  }
                }}
                style={
                  isActive
                    ? {
                        backgroundColor: highlightColor,
                        color: activeTextColor,
                      }
                    : undefined
                }
                title={collapsed ? `${item.index}. ${item.label}` : undefined}
                className={`w-full flex items-center ${
                  collapsed ? 'justify-center px-0 py-2.5' : 'justify-between px-2.5 py-2'
                } rounded-lg text-xs font-medium transition-colors cursor-pointer group ${
                  isActive
                    ? 'font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-white/[0.07] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive
                        ? 'text-current'
                        : 'text-slate-400 group-hover:text-[#D4AF37]'
                    }`}
                  />
                  {!collapsed && (
                    <span className="truncate tracking-tight">{item.label}</span>
                  )}
                </div>

                {!collapsed && item.subItems.length > 0 && (
                  <span className="shrink-0 ml-1">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    )}
                  </span>
                )}
              </button>

              {/* Expanded Submenu Items */}
              {!collapsed && item.subItems.length > 0 && isExpanded && (
                <div className="mt-1 mb-1.5 ml-4 pl-2.5 border-l border-white/12 space-y-0.5">
                  {item.subItems.map((sub) => {
                    const targetSec = sub.targetSection || item.id;
                    const isSubActive =
                      currentSection === targetSec &&
                      (activeSubItem === sub.actionId ||
                        (!activeSubItem && sub.actionId === firstSub?.actionId));
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => handleNavigateAndClose(targetSec, sub.actionId)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md text-[11.5px] transition-colors flex items-center gap-2 cursor-pointer ${
                          isSubActive
                            ? 'bg-white/12 text-[#D4AF37] font-semibold'
                            : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            isSubActive ? 'bg-[#D4AF37]' : 'bg-slate-600'
                          }`}
                        />
                        <span className="truncate">{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Collapsed Rail Flyout */}
              {collapsed && hoveredFlyout === item.menuId && (
                <div className="hidden lg:block fixed left-[72px] -mt-10 ml-1 z-50 bg-[#0B1F3A] border border-[#D4AF37]/30 rounded-xl shadow-2xl py-2 min-w-[225px]">
                  <div className="px-3.5 py-1.5 border-b border-white/10">
                    <span className="text-[11px] font-bold tracking-wide text-[#D4AF37]">
                      {item.label}
                    </span>
                  </div>
                  <div className="py-1 max-h-72 overflow-y-auto sidebar-scroll">
                    {item.subItems.map((sub) => {
                      const targetSec = sub.targetSection || item.id;
                      const isSubActive =
                        currentSection === targetSec && activeSubItem === sub.actionId;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => handleNavigateAndClose(targetSec, sub.actionId)}
                          className={`w-full text-left px-3.5 py-1.5 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                            isSubActive
                              ? 'bg-white/12 text-[#D4AF37] font-semibold'
                              : 'text-slate-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span>{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer Brand & Accent Control */}
      <div className="p-2.5 border-t border-white/10 bg-[#08172C]/60 shrink-0">
        <button
          type="button"
          onClick={onOpenAppearanceModal}
          className={`w-full flex items-center ${
            collapsed ? 'justify-center p-2' : 'justify-between px-3 py-2'
          } rounded-lg text-xs text-slate-300 hover:text-[#D4AF37] hover:bg-white/[0.07] transition-colors cursor-pointer`}
          title="Customize Logo & Accent Colour"
        >
          <span className="flex items-center gap-2 min-w-0">
            <Palette className="w-4 h-4 text-[#D4AF37] shrink-0" />
            {!collapsed && <span className="truncate font-medium">Brand & Accent</span>}
          </span>
          {!collapsed && (
            <span
              className="w-3 h-3 rounded-full border border-white/30 shrink-0"
              style={{ backgroundColor: highlightColor }}
            />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={`hidden lg:block shrink-0 sticky top-0 h-screen z-30 transition-all duration-200 ease-out no-print ${
          isCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {renderSidebarContent(isCollapsed)}
      </aside>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex no-print">
          <div
            className="fixed inset-0 bg-[#06101E]/60 backdrop-blur-[2px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 shadow-2xl">
            {renderSidebarContent(false)}
          </div>
        </div>
      )}
    </>
  );
};
