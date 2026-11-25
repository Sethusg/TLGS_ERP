import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  PanelLeftDashed,
  Pin,
  Palette,
  X,
  Building2,
  Search,
  Menu,
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
  isSlideOverMode?: boolean;
  onToggleSlideOverMode?: () => void;
  isDesktopDrawerOpen?: boolean;
  onOpenDesktopDrawer?: () => void;
  onCloseDesktopDrawer?: () => void;
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
  isSlideOverMode = false,
  onToggleSlideOverMode,
  isDesktopDrawerOpen = false,
  onOpenDesktopDrawer,
  onCloseDesktopDrawer,
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
  const [menuFilter, setMenuFilter] = useState('');
  const dockedRef = useRef<HTMLElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setExpandedMenus((prev) => ({ ...prev, [activeParentId]: true }));
  }, [activeParentId]);

  const highlightColor = navSettings.highlightColor || '#1E6BFF';
  const isDefaultGoldOrBlue =
    highlightColor.toLowerCase() === '#d4af37' ||
    highlightColor.toLowerCase() === '#d6ad52';
  const effectiveHighlight = isDefaultGoldOrBlue ? '#1E6BFF' : highlightColor;
  const isLightHighlight =
    effectiveHighlight.toLowerCase() === '#f59e0b' ||
    effectiveHighlight.toLowerCase() === '#eab308' ||
    effectiveHighlight.toLowerCase() === '#ffffff';
  const activeTextColor = isLightHighlight ? '#0E2978' : '#FFFFFF';

  // Sync dynamic highlight accent to CSS variables without inline style objects
  useEffect(() => {
    [dockedRef.current, drawerRef.current].forEach((el) => {
      if (el) {
        el.style.setProperty('--glass-accent', effectiveHighlight);
        el.style.setProperty('--glass-accent-text', activeTextColor);
      }
    });
  }, [effectiveHighlight, activeTextColor]);

  const isAnyDrawerOpen = isMobileOpen || (isSlideOverMode && isDesktopDrawerOpen);

  // Close floating / mobile glass slidebar with Escape key
  useEffect(() => {
    if (!isAnyDrawerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseMobile();
        onCloseDesktopDrawer?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnyDrawerOpen, onCloseMobile, onCloseDesktopDrawer]);

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

  const filteredMenus = useMemo(() => {
    const q = menuFilter.trim().toLowerCase();
    if (!q) return effectiveMenus;
    return effectiveMenus
      .map((menu) => {
        const mainMatches =
          menu.label.toLowerCase().includes(q) ||
          menu.description.toLowerCase().includes(q);
        const matchedSubs = menu.subItems.filter((s) =>
          s.label.toLowerCase().includes(q)
        );
        if (mainMatches) return menu;
        if (matchedSubs.length > 0) {
          return { ...menu, subItems: matchedSubs };
        }
        return null;
      })
      .filter((m): m is SidebarResolvedMainMenu => m !== null);
  }, [effectiveMenus, menuFilter]);

  const handleToggleSubmenu = (menuKey: string) => {
    setExpandedMenus((prev) => ({ ...prev, [menuKey]: !prev[menuKey] }));
  };

  const handleCloseAllDrawers = () => {
    onCloseMobile();
    onCloseDesktopDrawer?.();
  };

  const handleNavigateAndClose = (section: NavSection, subItem?: string) => {
    onSelectSection(section, subItem);
    setHoveredFlyout(null);
    handleCloseAllDrawers();
  };

  const renderSidebarContent = (collapsed: boolean, isDrawer: boolean) => (
    <div className="glass-slidebar-surface flex flex-col h-full text-white select-none">
      {/* Ambient Animated Refraction Orbs behind Frosted Glass */}
      <span className="glass-orb glass-orb-top" aria-hidden="true" />
      <span className="glass-orb glass-orb-mid" aria-hidden="true" />
      <span className="glass-orb glass-orb-bottom" aria-hidden="true" />

      {/* Brand Header */}
      <div
        className={`relative z-10 h-16 flex items-center shrink-0 border-b border-white/18 ${
          collapsed ? 'justify-center px-2' : 'justify-between px-4'
        }`}
      >
        <button
          type="button"
          onClick={() => handleNavigateAndClose('HOME', 'dash-overall')}
          className="cursor-pointer min-w-0 flex items-center text-left focus-visible:outline-2 focus-visible:outline-white/80 rounded-lg"
          aria-label="Go to Dashboard"
        >
          <LeadersSchoolLogo
            customLogoUrl={navSettings.logoUrl}
            variant={collapsed ? 'compact' : 'full'}
            className="max-h-10"
          />
        </button>

        {!collapsed && (
          <div className="flex items-center gap-1 shrink-0">
            {onToggleSlideOverMode && (
              <button
                type="button"
                onClick={() => {
                  onToggleSlideOverMode();
                  if (isDrawer) {
                    onCloseDesktopDrawer?.();
                  }
                }}
                className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-white/80 hover:text-white hover:bg-white/15 border border-transparent hover:border-white/20 transition-all cursor-pointer"
                title={
                  isSlideOverMode
                    ? 'Dock glassy slidebar to left'
                    : 'Switch to floating slide-over glass drawer'
                }
                aria-label={
                  isSlideOverMode
                    ? 'Dock sidebar'
                    : 'Switch to floating slide-over glass drawer'
                }
              >
                {isSlideOverMode ? (
                  <Pin className="w-3.5 h-3.5" />
                ) : (
                  <PanelLeftDashed className="w-3.5 h-3.5" />
                )}
              </button>
            )}

            {!isDrawer && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-white/80 hover:text-white hover:bg-white/15 border border-transparent hover:border-white/20 transition-all cursor-pointer"
                title="Collapse sidebar to icon rail"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}

            {isDrawer && (
              <button
                type="button"
                onClick={handleCloseAllDrawers}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-white/85 hover:text-white hover:bg-white/15 border border-transparent hover:border-white/25 transition-all cursor-pointer"
                aria-label="Close slidebar navigation"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Collapsed Expand Trigger */}
      {collapsed && (
        <div className="relative z-10 hidden lg:flex justify-center py-2.5 border-b border-white/15 shrink-0">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex items-center justify-center w-10 h-9 rounded-xl text-white/85 hover:text-white hover:bg-white/15 border border-transparent hover:border-white/25 transition-all cursor-pointer"
            title="Expand glassy slidebar"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Active Institution Indicator & Quick Menu Filter */}
      {!collapsed && (
        <div className="relative z-10 px-3 pt-3 pb-2.5 space-y-2.5 border-b border-white/15 shrink-0">
          <div className="glass-inset-card rounded-xl px-3 py-2">
            <div className="flex items-center gap-2 text-[11.5px] font-semibold text-white truncate">
              <Building2 className="w-3.5 h-3.5 text-[#7CE7F5] shrink-0" />
              <span className="truncate">{activeSchoolShortName}</span>
            </div>
            <p className="text-[10.5px] text-white/75 truncate mt-0.5 pl-5.5">
              {activeCampusLabel}
            </p>
          </div>

          <div className="glass-search-field rounded-xl flex items-center gap-2 px-2.5 py-1.5">
            <Search className="w-3.5 h-3.5 text-white/70 shrink-0" />
            <input
              type="search"
              value={menuFilter}
              onChange={(e) => setMenuFilter(e.target.value)}
              placeholder="Filter navigation..."
              aria-label="Filter navigation menus"
              className="w-full bg-transparent text-xs text-white placeholder:text-white/60 focus:outline-none"
            />
            {menuFilter && (
              <button
                type="button"
                onClick={() => setMenuFilter('')}
                className="text-white/70 hover:text-white cursor-pointer"
                aria-label="Clear menu filter"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* All 17 Main ERP Modules Tree */}
      <nav
        className="relative z-10 flex-1 overflow-y-auto sidebar-scroll py-3 px-2.5"
        aria-label="Multi-School ERP Glassy Slidebar Navigation"
      >
        {!collapsed && (
          <div className="px-2.5 pb-2 flex items-center justify-between text-[10.5px] font-medium text-white/70">
            <span>TLGS-ERP · {filteredMenus.length} Modules</span>
            <span>{isSlideOverMode ? 'Slide-Over' : 'Docked'}</span>
          </div>
        )}

        <ul className="space-y-1">
          {filteredMenus.map((item) => {
            const isCustom = item.id === 'CUSTOM_MENU';
            const isActive = isCustom
              ? currentSection === 'CUSTOM_MENU' &&
                (activeSubItem === item.menuId ||
                  item.subItems.some((s) => s.actionId === activeSubItem))
              : activeParentId === item.id;
            const isExpanded =
              Boolean(menuFilter.trim()) || Boolean(expandedMenus[item.menuId]);
            const Icon = item.icon;
            const firstSub = item.subItems[0];

            return (
              <li
                key={item.menuId}
                className="glass-nav-entry relative"
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
                      setExpandedMenus((prev) => ({
                        ...prev,
                        [item.menuId]: true,
                      }));
                    } else {
                      handleToggleSubmenu(item.menuId);
                    }
                  }}
                  title={collapsed ? `${item.index}. ${item.label}` : undefined}
                  aria-expanded={!collapsed && item.subItems.length > 0 ? isExpanded : undefined}
                  className={`glass-nav-btn w-full min-h-[40px] flex items-center ${
                    collapsed
                      ? 'glass-nav-btn-collapsed justify-center px-0 py-2.5'
                      : 'justify-between px-3 py-2.5'
                  } rounded-xl text-[12.5px] font-medium cursor-pointer group focus-visible:outline-2 focus-visible:outline-white/80 ${
                    isActive
                      ? 'glass-nav-btn-active font-semibold'
                      : 'text-white/92 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                        isActive
                          ? 'text-current'
                          : 'text-white/85 group-hover:text-white'
                      }`}
                    />
                    {!collapsed && (
                      <span className="truncate tracking-tight">
                        {item.label}
                      </span>
                    )}
                  </div>

                  {!collapsed && item.subItems.length > 0 && (
                    <ChevronRight
                      data-expanded={isExpanded ? 'true' : 'false'}
                      className="glass-chevron w-3.5 h-3.5 shrink-0 ml-1 opacity-80"
                    />
                  )}
                </button>

                {/* Pure-CSS Smooth Accordion Submenu */}
                {!collapsed && item.subItems.length > 0 && (
                  <div
                    className="glass-submenu-grid"
                    data-expanded={isExpanded ? 'true' : 'false'}
                  >
                    <div className="glass-submenu-overflow">
                      <ul className="mt-1 mb-1.5 ml-4 pl-2.5 border-l border-white/22 space-y-0.5">
                        {item.subItems.map((sub) => {
                          const targetSec = sub.targetSection || item.id;
                          const isSubActive =
                            currentSection === targetSec &&
                            (activeSubItem === sub.actionId ||
                              (!activeSubItem &&
                                sub.actionId === firstSub?.actionId));
                          return (
                            <li key={sub.id} className="glass-submenu-item">
                              <button
                                type="button"
                                tabIndex={isExpanded ? 0 : -1}
                                onClick={() =>
                                  handleNavigateAndClose(targetSec, sub.actionId)
                                }
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11.5px] transition-all flex items-center gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-white/80 ${
                                  isSubActive
                                    ? 'bg-white/22 text-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]'
                                    : 'text-white/78 hover:text-white hover:bg-white/12'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full shrink-0 transition-transform ${
                                    isSubActive
                                      ? 'bg-[#7CE7F5] scale-125'
                                      : 'bg-white/45'
                                  }`}
                                />
                                <span className="truncate">{sub.label}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Collapsed Rail Frosted Glass Flyout */}
                {collapsed && hoveredFlyout === item.menuId && (
                  <div className="hidden lg:block fixed left-[72px] -mt-10 pl-2 z-50">
                    <div className="glass-flyout-panel rounded-2xl py-2 min-w-[232px]">
                      <div className="px-3.5 py-2 border-b border-white/16">
                        <span className="text-xs font-bold tracking-tight text-white">
                          {item.label}
                        </span>
                      </div>
                      <div className="py-1.5 px-1.5 max-h-72 overflow-y-auto sidebar-scroll space-y-0.5">
                        {item.subItems.map((sub) => {
                          const targetSec = sub.targetSection || item.id;
                          const isSubActive =
                            currentSection === targetSec &&
                            activeSubItem === sub.actionId;
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() =>
                                handleNavigateAndClose(targetSec, sub.actionId)
                              }
                              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer ${
                                isSubActive
                                  ? 'bg-white/22 text-white font-semibold'
                                  : 'text-white/82 hover:bg-white/12 hover:text-white hover:translate-x-0.5'
                              }`}
                            >
                              <span className="truncate">{sub.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {!collapsed && filteredMenus.length === 0 && (
          <div className="glass-inset-card rounded-xl p-4 text-center text-xs text-white/80 mt-2">
            No modules matched "{menuFilter}".
          </div>
        )}
      </nav>

      {/* Footer Brand & Theme Control */}
      <div className="relative z-10 p-2.5 border-t border-white/16 bg-black/10 shrink-0">
        <button
          type="button"
          onClick={onOpenAppearanceModal}
          className={`glass-nav-btn w-full min-h-[40px] flex items-center ${
            collapsed ? 'glass-nav-btn-collapsed justify-center p-2' : 'justify-between px-3 py-2'
          } rounded-xl text-xs text-white/90 hover:text-white cursor-pointer`}
          title="Customize Logo & Accent Colour"
        >
          <span className="flex items-center gap-2 min-w-0">
            <Palette className="w-4 h-4 text-[#7CE7F5] shrink-0" />
            {!collapsed && (
              <span className="truncate font-medium">Brand &amp; Theme</span>
            )}
          </span>
          {!collapsed && (
            <span className="text-[10.5px] font-semibold text-white/75">
              Customize
            </span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Docked Glassy Slidebar */}
      {!isSlideOverMode && (
        <aside
          ref={dockedRef}
          className={`glass-slidebar-docked glass-slidebar-open hidden lg:block shrink-0 sticky top-0 h-screen z-30 no-print ${
            isCollapsed ? 'w-[76px]' : 'w-[272px]'
          }`}
        >
          {renderSidebarContent(isCollapsed, false)}
        </aside>
      )}

      {/* Desktop Left-Edge Glassy Pull Handle (Active when Slide-Over Mode is enabled) */}
      {isSlideOverMode && !isDesktopDrawerOpen && (
        <button
          type="button"
          onClick={onOpenDesktopDrawer}
          className="glass-edge-handle hidden lg:flex flex-col items-center gap-2 px-2.5 py-4 rounded-r-2xl text-white cursor-pointer no-print"
          title="Slide open glassy navigation menu"
          aria-label="Open glassy slidebar navigation"
        >
          <Menu className="w-4 h-4 text-[#7CE7F5]" />
          <span className="text-[10.5px] font-semibold tracking-wider [writing-mode:vertical-rl] rotate-180">
            Menu
          </span>
        </button>
      )}

      {/* Animated Frosted Glass Slide-Over Drawer (Mobile + Desktop Slide-Over Mode) */}
      <div
        ref={drawerRef}
        data-open={isAnyDrawerOpen ? 'true' : 'false'}
        aria-hidden={!isAnyDrawerOpen}
        className={`glass-drawer-root no-print ${
          isAnyDrawerOpen ? 'glass-slidebar-open' : ''
        } ${isSlideOverMode ? '' : 'lg:hidden'}`}
      >
        <div
          className="glass-drawer-backdrop"
          onClick={handleCloseAllDrawers}
          aria-hidden="true"
        />
        <div className="glass-drawer-panel">
          {renderSidebarContent(false, true)}
        </div>
      </div>
    </>
  );
};
