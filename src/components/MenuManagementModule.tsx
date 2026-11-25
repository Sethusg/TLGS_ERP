import React, { useState, useMemo } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Power,
  PowerOff,
  ArrowUp,
  ArrowDown,
  Search,
  Shield,
  ShieldAlert,
  FolderPlus,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Sliders,
  Lock,
  Layers,
  CornerDownRight,
} from 'lucide-react';
import {
  ErpRole,
  ManagedMainMenu,
  ManagedSubMenu,
  MenuIconName,
  MenuOperationPermissions,
  NavSection,
  RoleMenuPermissionMap,
  RolePermissionMatrix,
} from '../types';
import {
  ALL_ERP_ROLES,
  canAccessModule,
  getMenuOperationPermissions,
} from '../config/rbac';
import {
  DEFAULT_ORGANIZATIONS,
  MENU_ICON_NAMES,
  getMenuIconComponent,
} from '../config/navigation';
import { useSchoolContext } from '../contexts/SchoolContext';
import {
  EnterpriseConfirmDialog,
  EnterpriseFormModal,
} from './Common/EnterpriseUI';

interface MenuManagementModuleProps {
  currentRole: ErpRole;
  managedMenus: ManagedMainMenu[];
  onChangeManagedMenus: (
    updater: (prev: ManagedMainMenu[]) => ManagedMainMenu[],
    auditRemark: string,
    referenceId?: string
  ) => void;
  permissionMatrix: RolePermissionMatrix;
  menuOperationPermissions: RoleMenuPermissionMap;
  onUpdateMenuOperationPermission: (
    role: ErpRole,
    operation: keyof MenuOperationPermissions,
    value: boolean
  ) => void;
  onNotify: (msg: string) => void;
}

const TARGET_SECTION_OPTIONS: { value: NavSection; label: string }[] = [
  { value: 'CUSTOM_MENU', label: 'Custom Module Page (Auto-Generated Workspace)' },
  { value: 'HOME', label: 'Dashboard' },
  { value: 'ORGANIZATION', label: 'Organization Management' },
  { value: 'ACADEMICS', label: 'Academic Management' },
  { value: 'STUDENT', label: 'Student Management' },
  { value: 'STAFFS', label: 'Staff Management' },
  { value: 'ATTENDANCE', label: 'Attendance Management' },
  { value: 'FEE MANAGEMENT', label: 'Fee Management' },
  { value: 'MARKCHART', label: 'Examination Management' },
  { value: 'HR', label: 'Human Resources' },
  { value: 'FINANCE', label: 'Finance & Accounts' },
  { value: 'LIBRARY', label: 'Library Management' },
  { value: 'TRANSPORT', label: 'Transport Management' },
  { value: 'HOSTEL', label: 'Hostel Management' },
  { value: 'INVENTORY', label: 'Inventory & Assets' },
  { value: 'COMMUNICATIONS', label: 'Communication Management' },
  { value: 'REPORTS', label: 'Reports & Analytics' },
  { value: 'ADMIN', label: 'System Administration' },
];

const MENU_OP_KEYS: { key: keyof MenuOperationPermissions; label: string }[] = [
  { key: 'view', label: 'View' },
  { key: 'add', label: 'Add' },
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete' },
  { key: 'activate', label: 'Activate' },
  { key: 'deactivate', label: 'Deactivate' },
];

function toggleInArray<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

export const MenuManagementModule: React.FC<MenuManagementModuleProps> = ({
  currentRole,
  managedMenus,
  onChangeManagedMenus,
  permissionMatrix,
  menuOperationPermissions,
  onUpdateMenuOperationPermission,
  onNotify,
}) => {
  const { schools } = useSchoolContext();
  const isSuperAdmin = currentRole === 'Super Administrator';
  const ops = getMenuOperationPermissions(currentRole, menuOperationPermissions);

  const [subView, setSubView] = useState<'hierarchy' | 'rbac'>('hierarchy');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [expandedMenuIds, setExpandedMenuIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    managedMenus.slice(0, 3).forEach((m) => {
      initial[m.id] = true;
    });
    return initial;
  });

  // Drag-and-drop state
  const [draggedMainId, setDraggedMainId] = useState<string | null>(null);
  const [dragOverMainId, setDragOverMainId] = useState<string | null>(null);
  const [draggedSub, setDraggedSub] = useState<{
    parentId: string;
    subId: string;
  } | null>(null);
  const [dragOverSubKey, setDragOverSubKey] = useState<string | null>(null);

  // Add/Edit Main Menu Modal
  const [isMainModalOpen, setIsMainModalOpen] = useState(false);
  const [editingMainMenu, setEditingMainMenu] = useState<ManagedMainMenu | null>(null);
  const [mainForm, setMainForm] = useState<{
    label: string;
    shortLabel: string;
    description: string;
    iconName: MenuIconName;
    order: number;
    section: NavSection;
    isActive: boolean;
    isVisible: boolean;
    allowedOrganizations: string[];
    allowedSchoolIds: string[];
    allowedCampusIds: string[];
    allowedRoles: ErpRole[];
  }>({
    label: '',
    shortLabel: '',
    description: '',
    iconName: 'FolderKanban',
    order: 18,
    section: 'CUSTOM_MENU',
    isActive: true,
    isVisible: true,
    allowedOrganizations: [],
    allowedSchoolIds: [],
    allowedCampusIds: [],
    allowedRoles: [],
  });

  // Add/Edit Submenu Modal
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editingSubMenu, setEditingSubMenu] = useState<ManagedSubMenu | null>(null);
  const [subForm, setSubForm] = useState<{
    parentId: string;
    label: string;
    description: string;
    iconName: MenuIconName;
    targetSection: NavSection;
    order: number;
    isActive: boolean;
    isVisible: boolean;
    allowedSchoolIds: string[];
    allowedCampusIds: string[];
    allowedRoles: ErpRole[];
  }>({
    parentId: managedMenus[0]?.id || 'HOME',
    label: '',
    description: '',
    iconName: 'Layers',
    targetSection: 'CUSTOM_MENU',
    order: 1,
    isActive: true,
    isVisible: true,
    allowedSchoolIds: [],
    allowedCampusIds: [],
    allowedRoles: [],
  });

  // Delete Main Menu Dependency & Reassignment Modal
  const [deleteMainTarget, setDeleteMainTarget] = useState<ManagedMainMenu | null>(null);
  const [deleteStrategy, setDeleteStrategy] = useState<'reassign' | 'cascade'>('reassign');
  const [reassignTargetMenuId, setReassignTargetMenuId] = useState<string>('');
  const [cascadeAckChecked, setCascadeAckChecked] = useState(false);

  // Delete Submenu Confirmation Dialog
  const [deleteSubTarget, setDeleteSubTarget] = useState<{
    parent: ManagedMainMenu;
    sub: ManagedSubMenu;
  } | null>(null);

  const sortedMenus = useMemo(
    () =>
      [...managedMenus]
        .sort((a, b) => a.order - b.order)
        .map((m) => ({
          ...m,
          subItems: [...m.subItems].sort((a, b) => a.order - b.order),
        })),
    [managedMenus]
  );

  const filteredMenus = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sortedMenus.filter((m) => {
      if (statusFilter === 'active' && !m.isActive) return false;
      if (statusFilter === 'inactive' && m.isActive) {
        const hasInactiveSub = m.subItems.some((s) => !s.isActive);
        if (!hasInactiveSub) return false;
      }
      if (!q) return true;
      const matchesMain =
        m.label.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.shortLabel.toLowerCase().includes(q);
      const matchesSub = m.subItems.some(
        (s) =>
          s.label.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
      );
      return matchesMain || matchesSub;
    });
  }, [sortedMenus, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const totalMain = managedMenus.length;
    const activeMain = managedMenus.filter((m) => m.isActive).length;
    const allSubs = managedMenus.flatMap((m) => m.subItems);
    const activeSubs = allSubs.filter((s) => s.isActive).length;
    const hiddenMain = managedMenus.filter((m) => !m.isVisible).length;
    return {
      totalMain,
      activeMain,
      inactiveMain: totalMain - activeMain,
      totalSubs: allSubs.length,
      activeSubs,
      inactiveSubs: allSubs.length - activeSubs,
      hiddenMain,
    };
  }, [managedMenus]);

  const allCampuses = useMemo(
    () =>
      schools.flatMap((s) =>
        s.campuses.map((c) => ({ ...c, schoolShortName: s.shortName }))
      ),
    [schools]
  );

  // ---- Handlers: Add / Edit Main Menu ----
  const openAddMainModal = () => {
    setEditingMainMenu(null);
    setMainForm({
      label: '',
      shortLabel: '',
      description: '',
      iconName: 'FolderKanban',
      order: managedMenus.length + 1,
      section: 'CUSTOM_MENU',
      isActive: true,
      isVisible: true,
      allowedOrganizations: [],
      allowedSchoolIds: [],
      allowedCampusIds: [],
      allowedRoles: [],
    });
    setIsMainModalOpen(true);
  };

  const openEditMainModal = (menu: ManagedMainMenu) => {
    setEditingMainMenu(menu);
    setMainForm({
      label: menu.label,
      shortLabel: menu.shortLabel,
      description: menu.description,
      iconName: menu.iconName,
      order: menu.order,
      section: menu.section,
      isActive: menu.isActive,
      isVisible: menu.isVisible,
      allowedOrganizations: menu.allowedOrganizations || [],
      allowedSchoolIds: menu.allowedSchoolIds || [],
      allowedCampusIds: menu.allowedCampusIds || [],
      allowedRoles: menu.allowedRoles || [],
    });
    setIsMainModalOpen(true);
  };

  const handleSaveMainMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainForm.label.trim()) return;
    const label = mainForm.label.trim();
    const shortLabel = mainForm.shortLabel.trim() || label;
    const desiredOrder = Math.max(1, Math.round(mainForm.order || 1));

    if (editingMainMenu) {
      onChangeManagedMenus(
        (prev) => {
          const updated = prev.map((m) =>
            m.id === editingMainMenu.id
              ? {
                  ...m,
                  label,
                  shortLabel,
                  description: mainForm.description.trim(),
                  iconName: mainForm.iconName,
                  order: desiredOrder,
                  isActive: mainForm.isActive,
                  isVisible: mainForm.isVisible,
                  allowedOrganizations: mainForm.allowedOrganizations,
                  allowedSchoolIds: mainForm.allowedSchoolIds,
                  allowedCampusIds: mainForm.allowedCampusIds,
                  allowedRoles: mainForm.allowedRoles,
                }
              : m
          );
          return [...updated]
            .sort((a, b) => a.order - b.order)
            .map((m, idx) => ({ ...m, order: idx + 1 }));
        },
        `Updated main menu "${label}" (Order #${desiredOrder}, ${mainForm.isActive ? 'Active' : 'Inactive'})`,
        editingMainMenu.id
      );
      onNotify(`Main menu "${label}" updated.`);
    } else {
      const newId = `custom-menu-${Date.now()}`;
      const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const defaultSub: ManagedSubMenu = {
        id: `${newId}::overview`,
        parentId: newId,
        label: `${shortLabel} Overview`,
        description: `Primary overview page for ${label}`,
        iconName: mainForm.iconName,
        actionId: `${slug}-overview-${Date.now()}`,
        targetSection: mainForm.section,
        order: 1,
        isActive: true,
        isVisible: true,
        isSystem: false,
        allowedRoles: [],
        allowedSchoolIds: [],
        allowedCampusIds: [],
      };
      const created: ManagedMainMenu = {
        id: newId,
        section: mainForm.section,
        label,
        shortLabel,
        description:
          mainForm.description.trim() || `Custom enterprise module for ${label}`,
        iconName: mainForm.iconName,
        order: desiredOrder,
        isActive: mainForm.isActive,
        isVisible: mainForm.isVisible,
        isSystem: false,
        allowedOrganizations: mainForm.allowedOrganizations,
        allowedSchoolIds: mainForm.allowedSchoolIds,
        allowedCampusIds: mainForm.allowedCampusIds,
        allowedRoles: mainForm.allowedRoles,
        subItems: [defaultSub],
      };

      onChangeManagedMenus(
        (prev) =>
          [...prev, created]
            .sort((a, b) => a.order - b.order)
            .map((m, idx) => ({ ...m, order: idx + 1 })),
        `Created new main menu "${label}" with default overview submenu`,
        newId
      );
      setExpandedMenuIds((prev) => ({ ...prev, [newId]: true }));
      onNotify(`Created main menu "${label}". It is now live in the sidebar.`);
    }
    setIsMainModalOpen(false);
  };

  // ---- Handlers: Add / Edit Submenu ----
  const openAddSubModal = (parentMenuId?: string) => {
    const parent =
      sortedMenus.find((m) => m.id === parentMenuId) || sortedMenus[0];
    if (!parent) return;
    setEditingSubMenu(null);
    setSubForm({
      parentId: parent.id,
      label: '',
      description: '',
      iconName: parent.iconName,
      targetSection: parent.section,
      order: parent.subItems.length + 1,
      isActive: true,
      isVisible: true,
      allowedSchoolIds: [],
      allowedCampusIds: [],
      allowedRoles: [],
    });
    setIsSubModalOpen(true);
  };

  const openEditSubModal = (sub: ManagedSubMenu) => {
    setEditingSubMenu(sub);
    setSubForm({
      parentId: sub.parentId,
      label: sub.label,
      description: sub.description,
      iconName: sub.iconName,
      targetSection: sub.targetSection || 'CUSTOM_MENU',
      order: sub.order,
      isActive: sub.isActive,
      isVisible: sub.isVisible,
      allowedSchoolIds: sub.allowedSchoolIds || [],
      allowedCampusIds: sub.allowedCampusIds || [],
      allowedRoles: sub.allowedRoles || [],
    });
    setIsSubModalOpen(true);
  };

  const handleSaveSubMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subForm.label.trim() || !subForm.parentId) return;
    const label = subForm.label.trim();
    const desiredOrder = Math.max(1, Math.round(subForm.order || 1));

    if (editingSubMenu) {
      const movedParent = editingSubMenu.parentId !== subForm.parentId;
      onChangeManagedMenus(
        (prev) => {
          const updatedSub: ManagedSubMenu = {
            ...editingSubMenu,
            parentId: subForm.parentId,
            label,
            description: subForm.description.trim(),
            iconName: subForm.iconName,
            targetSection: subForm.targetSection,
            order: desiredOrder,
            isActive: subForm.isActive,
            isVisible: subForm.isVisible,
            allowedSchoolIds: subForm.allowedSchoolIds,
            allowedCampusIds: subForm.allowedCampusIds,
            allowedRoles: subForm.allowedRoles,
          };

          return prev.map((menu) => {
            // Remove from old parent if re-parented
            if (movedParent && menu.id === editingSubMenu.parentId) {
              const remaining = menu.subItems
                .filter((s) => s.id !== editingSubMenu.id)
                .map((s, idx) => ({ ...s, order: idx + 1 }));
              return { ...menu, subItems: remaining };
            }
            // Add to new parent if re-parented
            if (movedParent && menu.id === subForm.parentId) {
              const nextSubs = [...menu.subItems, updatedSub]
                .sort((a, b) => a.order - b.order)
                .map((s, idx) => ({ ...s, order: idx + 1 }));
              return { ...menu, subItems: nextSubs };
            }
            // Update in place within same parent
            if (!movedParent && menu.id === subForm.parentId) {
              const nextSubs = menu.subItems
                .map((s) => (s.id === editingSubMenu.id ? updatedSub : s))
                .sort((a, b) => a.order - b.order)
                .map((s, idx) => ({ ...s, order: idx + 1 }));
              return { ...menu, subItems: nextSubs };
            }
            return menu;
          });
        },
        movedParent
          ? `Updated & moved submenu "${label}" to new parent menu`
          : `Updated submenu "${label}" (Order #${desiredOrder})`,
        editingSubMenu.id
      );
      setExpandedMenuIds((prev) => ({ ...prev, [subForm.parentId]: true }));
      onNotify(
        movedParent
          ? `Submenu "${label}" updated and reassigned to its new parent menu.`
          : `Submenu "${label}" updated.`
      );
    } else {
      const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const newSub: ManagedSubMenu = {
        id: `sub-${Date.now()}`,
        parentId: subForm.parentId,
        label,
        description:
          subForm.description.trim() || `Submenu module for ${label}`,
        iconName: subForm.iconName,
        actionId: `custom-sub-${slug}-${Date.now()}`,
        targetSection: subForm.targetSection,
        order: desiredOrder,
        isActive: subForm.isActive,
        isVisible: subForm.isVisible,
        isSystem: false,
        allowedSchoolIds: subForm.allowedSchoolIds,
        allowedCampusIds: subForm.allowedCampusIds,
        allowedRoles: subForm.allowedRoles,
      };
      onChangeManagedMenus(
        (prev) =>
          prev.map((m) =>
            m.id === subForm.parentId
              ? {
                  ...m,
                  subItems: [...m.subItems, newSub]
                    .sort((a, b) => a.order - b.order)
                    .map((s, idx) => ({ ...s, order: idx + 1 })),
                }
              : m
          ),
        `Added submenu "${label}" under parent menu ${subForm.parentId}`,
        newSub.id
      );
      setExpandedMenuIds((prev) => ({ ...prev, [subForm.parentId]: true }));
      onNotify(`Submenu "${label}" added successfully.`);
    }
    setIsSubModalOpen(false);
  };

  // ---- Activate / Deactivate / Visibility ----
  const handleToggleMainActive = (menu: ManagedMainMenu) => {
    if (menu.id === 'ADMIN' && menu.isActive) {
      onNotify('System Administration cannot be deactivated to protect governance access.');
      return;
    }
    const nextActive = !menu.isActive;
    if (nextActive && !ops.activate) return;
    if (!nextActive && !ops.deactivate) return;

    onChangeManagedMenus(
      (prev) =>
        prev.map((m) => (m.id === menu.id ? { ...m, isActive: nextActive } : m)),
      `${nextActive ? 'Activated' : 'Deactivated'} main menu "${menu.label}"`,
      menu.id
    );
    onNotify(
      nextActive
        ? `"${menu.label}" activated and restored to sidebar navigation.`
        : `"${menu.label}" deactivated and hidden from user navigation (record preserved).`
    );
  };

  const handleToggleMainVisible = (menu: ManagedMainMenu) => {
    if (!ops.edit) return;
    const nextVisible = !menu.isVisible;
    onChangeManagedMenus(
      (prev) =>
        prev.map((m) =>
          m.id === menu.id ? { ...m, isVisible: nextVisible } : m
        ),
      `Set main menu "${menu.label}" visibility to ${nextVisible ? 'Visible' : 'Hidden from standard roles'}`,
      menu.id
    );
    onNotify(
      `"${menu.label}" is now ${nextVisible ? 'visible in navigation' : 'hidden from standard user roles'}.`
    );
  };

  const handleToggleSubActive = (parent: ManagedMainMenu, sub: ManagedSubMenu) => {
    if (sub.actionId === 'admin-menus' && sub.isActive) {
      onNotify('Menu Management submenu cannot be deactivated to prevent lockout.');
      return;
    }
    const nextActive = !sub.isActive;
    if (nextActive && !ops.activate) return;
    if (!nextActive && !ops.deactivate) return;

    onChangeManagedMenus(
      (prev) =>
        prev.map((m) =>
          m.id === parent.id
            ? {
                ...m,
                subItems: m.subItems.map((s) =>
                  s.id === sub.id ? { ...s, isActive: nextActive } : s
                ),
              }
            : m
        ),
      `${nextActive ? 'Activated' : 'Deactivated'} submenu "${sub.label}" under "${parent.label}"`,
      sub.id
    );
    onNotify(
      nextActive
        ? `Submenu "${sub.label}" activated.`
        : `Submenu "${sub.label}" deactivated and hidden from navigation.`
    );
  };

  const handleToggleSubVisible = (parent: ManagedMainMenu, sub: ManagedSubMenu) => {
    if (!ops.edit) return;
    const nextVisible = !sub.isVisible;
    onChangeManagedMenus(
      (prev) =>
        prev.map((m) =>
          m.id === parent.id
            ? {
                ...m,
                subItems: m.subItems.map((s) =>
                  s.id === sub.id ? { ...s, isVisible: nextVisible } : s
                ),
              }
            : m
        ),
      `Set submenu "${sub.label}" visibility to ${nextVisible ? 'Visible' : 'Hidden'}`,
      sub.id
    );
  };

  // ---- Ordering & Drag-and-Drop ----
  const reorderMainMenus = (sourceId: string, targetId: string) => {
    if (!ops.edit || sourceId === targetId) return;
    onChangeManagedMenus(
      (prev) => {
        const list = [...prev].sort((a, b) => a.order - b.order);
        const fromIdx = list.findIndex((m) => m.id === sourceId);
        const toIdx = list.findIndex((m) => m.id === targetId);
        if (fromIdx === -1 || toIdx === -1) return prev;
        const [moved] = list.splice(fromIdx, 1);
        list.splice(toIdx, 0, moved);
        return list.map((m, idx) => ({ ...m, order: idx + 1 }));
      },
      `Reordered main menu hierarchy`,
      sourceId
    );
  };

  const moveMainByDelta = (menuId: string, delta: -1 | 1) => {
    if (!ops.edit) return;
    const idx = sortedMenus.findIndex((m) => m.id === menuId);
    const target = sortedMenus[idx + delta];
    if (target) reorderMainMenus(menuId, target.id);
  };

  const reorderSubMenus = (
    sourceParentId: string,
    sourceSubId: string,
    targetParentId: string,
    targetSubId?: string
  ) => {
    if (!ops.edit) return;
    if (sourceParentId === targetParentId && sourceSubId === targetSubId) return;

    onChangeManagedMenus(
      (prev) => {
        const sourceParent = prev.find((m) => m.id === sourceParentId);
        const movingSub = sourceParent?.subItems.find((s) => s.id === sourceSubId);
        if (!movingSub) return prev;

        return prev.map((menu) => {
          if (sourceParentId === targetParentId && menu.id === sourceParentId) {
            const subs = [...menu.subItems].sort((a, b) => a.order - b.order);
            const fromIdx = subs.findIndex((s) => s.id === sourceSubId);
            const toIdx = targetSubId
              ? subs.findIndex((s) => s.id === targetSubId)
              : subs.length - 1;
            if (fromIdx === -1 || toIdx === -1) return menu;
            const [item] = subs.splice(fromIdx, 1);
            subs.splice(toIdx, 0, item);
            return {
              ...menu,
              subItems: subs.map((s, idx) => ({ ...s, order: idx + 1 })),
            };
          }

          if (menu.id === sourceParentId) {
            return {
              ...menu,
              subItems: menu.subItems
                .filter((s) => s.id !== sourceSubId)
                .map((s, idx) => ({ ...s, order: idx + 1 })),
            };
          }

          if (menu.id === targetParentId) {
            const subs = [...menu.subItems].sort((a, b) => a.order - b.order);
            const reassigned: ManagedSubMenu = {
              ...movingSub,
              parentId: targetParentId,
            };
            const toIdx = targetSubId
              ? subs.findIndex((s) => s.id === targetSubId)
              : subs.length;
            subs.splice(toIdx === -1 ? subs.length : toIdx, 0, reassigned);
            return {
              ...menu,
              subItems: subs.map((s, idx) => ({ ...s, order: idx + 1 })),
            };
          }

          return menu;
        });
      },
      sourceParentId === targetParentId
        ? `Reordered submenus inside "${sourceParentId}"`
        : `Moved submenu "${sourceSubId}" from "${sourceParentId}" to "${targetParentId}"`,
      sourceSubId
    );
  };

  const moveSubByDelta = (
    parent: ManagedMainMenu,
    subId: string,
    delta: -1 | 1
  ) => {
    if (!ops.edit) return;
    const idx = parent.subItems.findIndex((s) => s.id === subId);
    const target = parent.subItems[idx + delta];
    if (target) reorderSubMenus(parent.id, subId, parent.id, target.id);
  };

  // ---- Delete with Dependency Check & Reassignment ----
  const initiateDeleteMainMenu = (menu: ManagedMainMenu) => {
    if (!ops.delete) return;
    if (menu.id === 'ADMIN') {
      onNotify('System Administration is a core protected menu and cannot be deleted.');
      return;
    }
    const otherMenus = sortedMenus.filter((m) => m.id !== menu.id);
    setReassignTargetMenuId(otherMenus[0]?.id || '');
    setDeleteStrategy(menu.subItems.length > 0 ? 'reassign' : 'cascade');
    setCascadeAckChecked(false);
    setDeleteMainTarget(menu);
  };

  const confirmDeleteMainMenu = () => {
    if (!deleteMainTarget) return;
    const hasDeps = deleteMainTarget.subItems.length > 0;
    if (hasDeps && deleteStrategy === 'reassign' && !reassignTargetMenuId) {
      return;
    }
    if (hasDeps && deleteStrategy === 'cascade' && !cascadeAckChecked) {
      return;
    }

    const targetLabel = deleteMainTarget.label;
    const childCount = deleteMainTarget.subItems.length;
    const reassignDest = sortedMenus.find((m) => m.id === reassignTargetMenuId);

    onChangeManagedMenus(
      (prev) => {
        const orphans =
          hasDeps && deleteStrategy === 'reassign'
            ? deleteMainTarget.subItems.map((s) => ({
                ...s,
                parentId: reassignTargetMenuId,
              }))
            : [];

        return prev
          .filter((m) => m.id !== deleteMainTarget.id)
          .map((m) => {
            if (orphans.length > 0 && m.id === reassignTargetMenuId) {
              const merged = [...m.subItems, ...orphans].map((s, idx) => ({
                ...s,
                order: idx + 1,
              }));
              return { ...m, subItems: merged };
            }
            return m;
          })
          .sort((a, b) => a.order - b.order)
          .map((m, idx) => ({ ...m, order: idx + 1 }));
      },
      hasDeps && deleteStrategy === 'reassign'
        ? `Deleted main menu "${targetLabel}" after reassigning ${childCount} submenu(s) to "${reassignDest?.label || reassignTargetMenuId}"`
        : `Deleted main menu "${targetLabel}"${childCount > 0 ? ` and ${childCount} child submenu(s)` : ''}`,
      deleteMainTarget.id
    );

    onNotify(
      hasDeps && deleteStrategy === 'reassign'
        ? `Deleted "${targetLabel}" and reassigned ${childCount} submenu(s) to "${reassignDest?.label}".`
        : `Deleted main menu "${targetLabel}".`
    );
    setDeleteMainTarget(null);
  };

  const confirmDeleteSubMenu = () => {
    if (!deleteSubTarget) return;
    const { parent, sub } = deleteSubTarget;
    onChangeManagedMenus(
      (prev) =>
        prev.map((m) =>
          m.id === parent.id
            ? {
                ...m,
                subItems: m.subItems
                  .filter((s) => s.id !== sub.id)
                  .map((s, idx) => ({ ...s, order: idx + 1 })),
              }
            : m
        ),
      `Deleted submenu "${sub.label}" from "${parent.label}"`,
      sub.id
    );
    onNotify(`Submenu "${sub.label}" deleted from "${parent.label}".`);
    setDeleteSubTarget(null);
  };

  // Dependent RBAC role count helper
  const getDependentRoleCount = (section: NavSection) => {
    if (section === 'CUSTOM_MENU') return 0;
    return ALL_ERP_ROLES.filter((r) =>
      canAccessModule(r.role, section, permissionMatrix)
    ).length;
  };

  if (!ops.view) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-xl p-8 text-center space-y-3">
        <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-[#0B1F3A]">
          Menu Management View Restricted
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          The active role (<strong>{currentRole}</strong>) does not hold the <strong>View</strong> permission for Menu Management. Ask a Super Administrator to grant access in the Menu RBAC Permission Matrix.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
            Main Menus
          </p>
          <p className="text-2xl font-extrabold text-[#0B1F3A] tabular-nums mt-1">
            {stats.totalMain}
          </p>
          <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
            {stats.activeMain} Active · {stats.inactiveMain} Inactive
          </p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
            Submenus
          </p>
          <p className="text-2xl font-extrabold text-[#0B1F3A] tabular-nums mt-1">
            {stats.totalSubs}
          </p>
          <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
            {stats.activeSubs} Active · {stats.inactiveSubs} Inactive
          </p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
            Navigation Visibility
          </p>
          <p className="text-2xl font-extrabold text-[#0B1F3A] tabular-nums mt-1">
            {stats.totalMain - stats.hiddenMain}/{stats.totalMain}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {stats.hiddenMain} hidden from standard roles
          </p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
            Active Role Capabilities
          </p>
          <p className="text-xs font-bold text-[#0B1F3A] mt-1.5 truncate">
            {currentRole}
          </p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {MENU_OP_KEYS.map((op) => (
              <span
                key={op.key}
                className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
                  ops[op.key]
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-400 line-through'
                }`}
              >
                {op.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Sub-view Switcher & Primary Actions */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSubView('hierarchy')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              subView === 'hierarchy'
                ? 'bg-[#0B1F3A] text-[#D4AF37]'
                : 'bg-slate-100 text-slate-600 hover:text-[#0B1F3A]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Menu Structure &amp; Hierarchy</span>
          </button>
          <button
            type="button"
            onClick={() => setSubView('rbac')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              subView === 'rbac'
                ? 'bg-[#0B1F3A] text-[#D4AF37]'
                : 'bg-slate-100 text-slate-600 hover:text-[#0B1F3A]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Menu RBAC Permissions (6 Operations)</span>
          </button>
        </div>

        {subView === 'hierarchy' && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!ops.add}
              onClick={() => openAddSubModal()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#0B1F3A]/20 bg-white hover:bg-slate-50 text-[#0B1F3A] text-xs font-semibold disabled:opacity-40 cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5 text-[#9A7418]" />
              <span>Add Submenu</span>
            </button>
            <button
              type="button"
              disabled={!ops.add}
              onClick={openAddMainModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#132E54] text-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Add Main Menu</span>
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: HIERARCHICAL MAIN MENU & SUBMENU STRUCTURE */}
      {subView === 'hierarchy' && (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden">
          {/* Search & Filter Bar */}
          <div className="px-5 py-3.5 border-b border-slate-200/80 bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search main menus, submenus, or descriptions..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#0B1F3A]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-[11px] font-semibold">
                {(['all', 'active', 'inactive'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`px-2.5 py-1 rounded-md capitalize cursor-pointer ${
                      statusFilter === status
                        ? 'bg-[#0B1F3A] text-[#D4AF37]'
                        : 'text-slate-600 hover:text-[#0B1F3A]'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  const allOpen: Record<string, boolean> = {};
                  sortedMenus.forEach((m) => (allOpen[m.id] = true));
                  setExpandedMenuIds(allOpen);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-[11px] font-semibold text-slate-700 cursor-pointer"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={() => setExpandedMenuIds({})}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-[11px] font-semibold text-slate-700 cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* Drag-and-Drop Hint Strip */}
          <div className="px-5 py-2 bg-[#0B1F3A]/[0.03] border-b border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
            <span className="flex items-center gap-1.5">
              <GripVertical className="w-3.5 h-3.5 text-[#9A7418]" />
              <span>
                Drag main menus or submenus by their grip handle to sort order, or drop a submenu onto another main menu to reassign its parent. Inactive menus are automatically hidden from normal user navigation.
              </span>
            </span>
          </div>

          {/* Hierarchical Tree List */}
          <div className="divide-y divide-slate-200/80">
            {filteredMenus.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No menus match your search or status filter.
              </div>
            ) : (
              filteredMenus.map((menu, menuIdx) => {
                const Icon = getMenuIconComponent(menu.iconName);
                const isExpanded = Boolean(expandedMenuIds[menu.id]);
                const activeSubCount = menu.subItems.filter((s) => s.isActive).length;
                const isDropTarget = dragOverMainId === menu.id;
                const hasCustomScope =
                  (menu.allowedOrganizations && menu.allowedOrganizations.length > 0) ||
                  (menu.allowedSchoolIds && menu.allowedSchoolIds.length > 0) ||
                  (menu.allowedCampusIds && menu.allowedCampusIds.length > 0) ||
                  (menu.allowedRoles && menu.allowedRoles.length > 0);

                return (
                  <div
                    key={menu.id}
                    draggable={ops.edit}
                    onDragStart={(e) => {
                      if (draggedSub) return;
                      setDraggedMainId(menu.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverMainId(menu.id);
                    }}
                    onDragLeave={() => {
                      if (dragOverMainId === menu.id) setDragOverMainId(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverMainId(null);
                      if (draggedSub) {
                        reorderSubMenus(
                          draggedSub.parentId,
                          draggedSub.subId,
                          menu.id
                        );
                        setExpandedMenuIds((prev) => ({ ...prev, [menu.id]: true }));
                        setDraggedSub(null);
                        onNotify(`Reassigned submenu to "${menu.label}".`);
                      } else if (draggedMainId && draggedMainId !== menu.id) {
                        reorderMainMenus(draggedMainId, menu.id);
                        setDraggedMainId(null);
                        onNotify('Main menu display order updated.');
                      }
                    }}
                    onDragEnd={() => {
                      setDraggedMainId(null);
                      setDragOverMainId(null);
                    }}
                    className={`transition-colors ${
                      !menu.isActive ? 'bg-slate-50/90' : 'bg-white'
                    } ${isDropTarget ? 'ring-2 ring-inset ring-[#D4AF37] bg-[#D4AF37]/5' : ''}`}
                  >
                    {/* Main Menu Row */}
                    <div className="px-4 sm:px-5 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        {ops.edit && (
                          <span
                            className="text-slate-400 hover:text-[#0B1F3A] cursor-grab active:cursor-grabbing shrink-0 pt-1 sm:pt-0"
                            title="Drag to reorder main menu"
                          >
                            <GripVertical className="w-4 h-4" />
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedMenuIds((prev) => ({
                              ...prev,
                              [menu.id]: !prev[menu.id],
                            }))
                          }
                          className="w-6 h-6 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 cursor-pointer"
                          aria-label={isExpanded ? 'Collapse submenus' : 'Expand submenus'}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>

                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                            menu.isActive
                              ? 'bg-[#0B1F3A] text-[#D4AF37] border-[#0B1F3A]'
                              : 'bg-slate-200 text-slate-500 border-slate-300'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              #{String(menu.order).padStart(2, '0')}
                            </span>
                            <p
                              className={`text-xs font-bold truncate ${
                                menu.isActive
                                  ? 'text-[#0B1F3A]'
                                  : 'text-slate-500 line-through'
                              }`}
                            >
                              {menu.label}
                            </p>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                menu.isActive
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {menu.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {!menu.isVisible && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                Hidden from Std Roles
                              </span>
                            )}
                            {!menu.isSystem && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#D4AF37]/15 text-[#8A6712] border border-[#D4AF37]/40">
                                Custom
                              </span>
                            )}
                            {hasCustomScope && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center gap-0.5">
                                <Building2 className="w-2.5 h-2.5" />
                                Scoped
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xl">
                            {menu.description} ·{' '}
                            <strong className="text-slate-700">
                              {activeSubCount}/{menu.subItems.length} active submenus
                            </strong>
                          </p>
                        </div>
                      </div>

                      {/* Main Menu Operations Toolbar */}
                      <div className="flex flex-wrap items-center gap-1.5 shrink-0 pl-9 lg:pl-0">
                        {ops.edit && (
                          <div className="inline-flex rounded-md border border-slate-200 bg-white overflow-hidden">
                            <button
                              type="button"
                              disabled={menuIdx === 0}
                              onClick={() => moveMainByDelta(menu.id, -1)}
                              className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-[#0B1F3A] disabled:opacity-30 cursor-pointer"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={menuIdx === filteredMenus.length - 1}
                              onClick={() => moveMainByDelta(menu.id, 1)}
                              className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-[#0B1F3A] border-l border-slate-200 disabled:opacity-30 cursor-pointer"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {ops.add && (
                          <button
                            type="button"
                            onClick={() => openAddSubModal(menu.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold text-[#0B1F3A] cursor-pointer"
                            title="Add Submenu under this Main Menu"
                          >
                            <Plus className="w-3 h-3 text-[#9A7418]" />
                            <span>Submenu</span>
                          </button>
                        )}

                        {ops.edit && (
                          <button
                            type="button"
                            onClick={() => handleToggleMainVisible(menu)}
                            className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                              menu.isVisible
                                ? 'border-slate-200 bg-white text-slate-600 hover:text-[#0B1F3A]'
                                : 'border-amber-200 bg-amber-50 text-amber-800'
                            }`}
                            title={
                              menu.isVisible
                                ? 'Visible in navigation (click to hide from standard roles)'
                                : 'Hidden from standard roles (click to make visible)'
                            }
                          >
                            {menu.isVisible ? (
                              <Eye className="w-3.5 h-3.5" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}

                        {ops.edit && (
                          <button
                            type="button"
                            onClick={() => openEditMainModal(menu)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold text-[#0B1F3A] cursor-pointer"
                            title="Edit menu name, description, icon, order, and scope"
                          >
                            <Edit className="w-3 h-3 text-[#9A7418]" />
                            <span>Edit</span>
                          </button>
                        )}

                        {menu.isActive ? (
                          <button
                            type="button"
                            disabled={!ops.deactivate || menu.id === 'ADMIN'}
                            onClick={() => handleToggleMainActive(menu)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100/70 text-[11px] font-semibold text-amber-800 disabled:opacity-40 cursor-pointer"
                            title={
                              menu.id === 'ADMIN'
                                ? 'Core governance module protected'
                                : 'Deactivate menu (hides from user navigation without deleting)'
                            }
                          >
                            <PowerOff className="w-3 h-3" />
                            <span>Deactivate</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!ops.activate}
                            onClick={() => handleToggleMainActive(menu)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100/70 text-[11px] font-semibold text-emerald-700 disabled:opacity-40 cursor-pointer"
                            title="Activate menu and restore to sidebar navigation"
                          >
                            <Power className="w-3 h-3" />
                            <span>Activate</span>
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={!ops.delete || menu.id === 'ADMIN'}
                          onClick={() => initiateDeleteMainMenu(menu)}
                          className="p-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 disabled:opacity-35 cursor-pointer"
                          title={
                            menu.id === 'ADMIN'
                              ? 'System Administration is protected from deletion'
                              : 'Delete Main Menu (with dependency checks)'
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Nested Submenus */}
                    {isExpanded && (
                      <div className="bg-[#F8FAFC]/80 border-t border-slate-100 pl-8 sm:pl-14 pr-4 sm:pr-5 py-2.5 space-y-1.5">
                        {menu.subItems.length === 0 ? (
                          <div className="py-3 px-3 rounded-lg border border-dashed border-slate-300 bg-white text-[11px] text-slate-500 flex items-center justify-between">
                            <span>No submenus configured under {menu.label}.</span>
                            {ops.add && (
                              <button
                                type="button"
                                onClick={() => openAddSubModal(menu.id)}
                                className="text-[#0B1F3A] font-semibold hover:text-[#9A7418] cursor-pointer"
                              >
                                + Add first submenu
                              </button>
                            )}
                          </div>
                        ) : (
                          menu.subItems
                            .filter((sub) => {
                              if (statusFilter === 'active') return sub.isActive;
                              if (statusFilter === 'inactive') return !sub.isActive;
                              return true;
                            })
                            .map((sub, subIdx) => {
                              const SubIcon = getMenuIconComponent(sub.iconName);
                              const subKey = `${menu.id}::${sub.id}`;
                              const isSubDropTarget = dragOverSubKey === subKey;
                              return (
                                <div
                                  key={sub.id}
                                  draggable={ops.edit}
                                  onDragStart={(e) => {
                                    e.stopPropagation();
                                    setDraggedSub({ parentId: menu.id, subId: sub.id });
                                    e.dataTransfer.effectAllowed = 'move';
                                  }}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (draggedSub) setDragOverSubKey(subKey);
                                  }}
                                  onDragLeave={(e) => {
                                    e.stopPropagation();
                                    if (dragOverSubKey === subKey) setDragOverSubKey(null);
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDragOverSubKey(null);
                                    if (draggedSub) {
                                      reorderSubMenus(
                                        draggedSub.parentId,
                                        draggedSub.subId,
                                        menu.id,
                                        sub.id
                                      );
                                      setDraggedSub(null);
                                      onNotify('Submenu order updated.');
                                    }
                                  }}
                                  onDragEnd={() => {
                                    setDraggedSub(null);
                                    setDragOverSubKey(null);
                                  }}
                                  className={`px-3 py-2 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors ${
                                    sub.isActive
                                      ? 'bg-white border-slate-200/90'
                                      : 'bg-slate-100/80 border-slate-200 opacity-85'
                                  } ${isSubDropTarget ? 'ring-2 ring-[#D4AF37]' : ''}`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {ops.edit && (
                                      <GripVertical className="w-3.5 h-3.5 text-slate-400 hover:text-[#0B1F3A] cursor-grab shrink-0" />
                                    )}
                                    <CornerDownRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <div className="w-6 h-6 rounded-md bg-[#0B1F3A]/8 text-[#0B1F3A] flex items-center justify-center shrink-0">
                                      <SubIcon className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="font-mono text-[10px] text-slate-400">
                                          {menu.order}.{sub.order}
                                        </span>
                                        <span
                                          className={`text-xs font-semibold truncate ${
                                            sub.isActive
                                              ? 'text-[#0B1F3A]'
                                              : 'text-slate-500 line-through'
                                          }`}
                                        >
                                          {sub.label}
                                        </span>
                                        <span
                                          className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
                                            sub.isActive
                                              ? 'bg-emerald-50 text-emerald-700'
                                              : 'bg-rose-50 text-rose-700'
                                          }`}
                                        >
                                          {sub.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                        {!sub.isVisible && (
                                          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-amber-50 text-amber-800">
                                            Hidden
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[10.5px] text-slate-500 truncate max-w-md">
                                        {sub.description} · Route:{' '}
                                        <span className="font-mono">{sub.actionId}</span>
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-1 shrink-0 pl-6 sm:pl-0">
                                    {ops.edit && (
                                      <div className="inline-flex rounded border border-slate-200 bg-white overflow-hidden">
                                        <button
                                          type="button"
                                          disabled={subIdx === 0}
                                          onClick={() => moveSubByDelta(menu, sub.id, -1)}
                                          className="p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                                          title="Move Submenu Up"
                                        >
                                          <ArrowUp className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          disabled={subIdx === menu.subItems.length - 1}
                                          onClick={() => moveSubByDelta(menu, sub.id, 1)}
                                          className="p-1 text-slate-500 hover:bg-slate-100 border-l border-slate-200 disabled:opacity-30 cursor-pointer"
                                          title="Move Submenu Down"
                                        >
                                          <ArrowDown className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}

                                    {ops.edit && (
                                      <button
                                        type="button"
                                        onClick={() => handleToggleSubVisible(menu, sub)}
                                        className={`p-1 rounded border cursor-pointer ${
                                          sub.isVisible
                                            ? 'border-slate-200 bg-white text-slate-500 hover:text-[#0B1F3A]'
                                            : 'border-amber-200 bg-amber-50 text-amber-800'
                                        }`}
                                        title={sub.isVisible ? 'Visible' : 'Hidden'}
                                      >
                                        {sub.isVisible ? (
                                          <Eye className="w-3 h-3" />
                                        ) : (
                                          <EyeOff className="w-3 h-3" />
                                        )}
                                      </button>
                                    )}

                                    {ops.edit && (
                                      <button
                                        type="button"
                                        onClick={() => openEditSubModal(sub)}
                                        className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-[10.5px] font-semibold text-[#0B1F3A] cursor-pointer"
                                      >
                                        Edit
                                      </button>
                                    )}

                                    {sub.isActive ? (
                                      <button
                                        type="button"
                                        disabled={
                                          !ops.deactivate || sub.actionId === 'admin-menus'
                                        }
                                        onClick={() => handleToggleSubActive(menu, sub)}
                                        className="px-2 py-1 rounded border border-amber-200 bg-amber-50 text-[10.5px] font-semibold text-amber-800 disabled:opacity-40 cursor-pointer"
                                      >
                                        Deactivate
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        disabled={!ops.activate}
                                        onClick={() => handleToggleSubActive(menu, sub)}
                                        className="px-2 py-1 rounded border border-emerald-200 bg-emerald-50 text-[10.5px] font-semibold text-emerald-700 disabled:opacity-40 cursor-pointer"
                                      >
                                        Activate
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      disabled={
                                        !ops.delete || sub.actionId === 'admin-menus'
                                      }
                                      onClick={() => setDeleteSubTarget({ parent: menu, sub })}
                                      className="p-1 rounded border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 disabled:opacity-35 cursor-pointer"
                                      title="Delete Submenu"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: INTEGRATED MENU MANAGEMENT RBAC PERMISSIONS (ALL 19 ROLES) */}
      {subView === 'rbac' && (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-[#0B1F3A] flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#9A7418]" />
                <span>Menu Management RBAC Matrix (All 19 User Roles)</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Configure granular View, Add, Edit, Delete, Activate, and Deactivate permissions for Menu Management. Super Administrator always retains unrestricted governance.
              </p>
            </div>
            {!isSuperAdmin && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold">
                <Lock className="w-3 h-3" />
                Super Admin Required to Edit Matrix
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-slate-200 text-[10.5px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">ERP Role</th>
                  <th className="px-4 py-3 font-semibold">Scope</th>
                  {MENU_OP_KEYS.map((op) => (
                    <th key={op.key} className="px-3 py-3 font-semibold text-center">
                      {op.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ALL_ERP_ROLES.map((def) => {
                  const roleOps = getMenuOperationPermissions(
                    def.role,
                    menuOperationPermissions
                  );
                  const isLockedSuper = def.role === 'Super Administrator';
                  return (
                    <tr key={def.role} className="hover:bg-[#F8FAFC]">
                      <td className="px-4 py-2.5">
                        <p className="font-bold text-[#0B1F3A]">{def.role}</p>
                        <p className="text-[10.5px] text-slate-500">{def.shortCode}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10.5px] font-semibold">
                          {def.scope}
                        </span>
                      </td>
                      {MENU_OP_KEYS.map((op) => (
                        <td key={op.key} className="px-3 py-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={roleOps[op.key]}
                            disabled={!isSuperAdmin || isLockedSuper}
                            onChange={(e) => {
                              onUpdateMenuOperationPermission(
                                def.role,
                                op.key,
                                e.target.checked
                              );
                              onNotify(
                                `Updated Menu "${op.label}" permission for ${def.role}.`
                              );
                            }}
                            className="w-4 h-4 accent-[#0B1F3A] rounded cursor-pointer disabled:opacity-50"
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT MAIN MENU (WITH ICON PICKER & ORG/SCHOOL/CAMPUS/ROLE SCOPE) */}
      <EnterpriseFormModal
        isOpen={isMainModalOpen}
        onClose={() => setIsMainModalOpen(false)}
        title={
          editingMainMenu
            ? `Edit Main Menu — ${editingMainMenu.label}`
            : 'Add New Main Menu'
        }
        subtitle="Configure menu identity, icon, ordering, active/visibility status, and organization/school/campus/role access."
        maxWidthClass="max-w-3xl"
      >
        <form onSubmit={handleSaveMainMenu} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#0B1F3A] mb-1">
                Menu Name *
              </label>
              <input
                type="text"
                required
                value={mainForm.label}
                onChange={(e) =>
                  setMainForm({ ...mainForm, label: e.target.value })
                }
                placeholder="e.g., Sports & Co-Curricular"
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:border-[#0B1F3A]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#0B1F3A] mb-1">
                Short Sidebar Label
              </label>
              <input
                type="text"
                value={mainForm.shortLabel}
                onChange={(e) =>
                  setMainForm({ ...mainForm, shortLabel: e.target.value })
                }
                placeholder="e.g., Sports"
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:border-[#0B1F3A]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#0B1F3A] mb-1">
              Description
            </label>
            <input
              type="text"
              value={mainForm.description}
              onChange={(e) =>
                setMainForm({ ...mainForm, description: e.target.value })
              }
              placeholder="Brief summary of modules under this main menu"
              className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:border-[#0B1F3A]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-[#0B1F3A] mb-1">
                Display Order
              </label>
              <input
                type="number"
                min={1}
                max={99}
                value={mainForm.order}
                onChange={(e) =>
                  setMainForm({ ...mainForm, order: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg"
              />
            </div>
            <label className="flex items-center gap-2 pt-5 cursor-pointer">
              <input
                type="checkbox"
                checked={mainForm.isActive}
                disabled={editingMainMenu?.id === 'ADMIN'}
                onChange={(e) =>
                  setMainForm({ ...mainForm, isActive: e.target.checked })
                }
                className="w-4 h-4 accent-[#0B1F3A]"
              />
              <span className="font-semibold text-[#0B1F3A]">Active Menu</span>
            </label>
            <label className="flex items-center gap-2 pt-5 cursor-pointer">
              <input
                type="checkbox"
                checked={mainForm.isVisible}
                onChange={(e) =>
                  setMainForm({ ...mainForm, isVisible: e.target.checked })
                }
                className="w-4 h-4 accent-[#0B1F3A]"
              />
              <span className="font-semibold text-[#0B1F3A]">
                Visible to Standard Roles
              </span>
            </label>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block font-semibold text-[#0B1F3A] mb-1.5">
              Select Menu Icon ({mainForm.iconName})
            </label>
            <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5 p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-lg">
              {MENU_ICON_NAMES.map((iconKey) => {
                const IconComp = getMenuIconComponent(iconKey);
                const selected = mainForm.iconName === iconKey;
                return (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => setMainForm({ ...mainForm, iconName: iconKey })}
                    title={iconKey}
                    className={`w-8 h-8 rounded-md flex items-center justify-center cursor-pointer transition-colors ${
                      selected
                        ? 'bg-[#0B1F3A] text-[#D4AF37] ring-2 ring-[#D4AF37]'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-[#0B1F3A]'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Super Admin Tenant & Role Access Scoping */}
          {isSuperAdmin && (
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-[#9A7418]" />
                <span className="font-bold text-[#0B1F3A]">
                  Super Admin Access Scope (Leave unchecked for All)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-semibold text-slate-600 mb-1">
                    Organizations
                  </p>
                  <div className="space-y-1 bg-white p-2 rounded-lg border border-slate-200">
                    {DEFAULT_ORGANIZATIONS.map((org) => (
                      <label
                        key={org.id}
                        className="flex items-center gap-2 text-[11px] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={mainForm.allowedOrganizations.includes(org.id)}
                          onChange={() =>
                            setMainForm({
                              ...mainForm,
                              allowedOrganizations: toggleInArray(
                                mainForm.allowedOrganizations,
                                org.id
                              ),
                            })
                          }
                          className="accent-[#0B1F3A]"
                        />
                        <span>{org.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-slate-600 mb-1">
                    Schools
                  </p>
                  <div className="space-y-1 bg-white p-2 rounded-lg border border-slate-200 max-h-28 overflow-y-auto">
                    {schools.map((sch) => (
                      <label
                        key={sch.id}
                        className="flex items-center gap-2 text-[11px] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={mainForm.allowedSchoolIds.includes(sch.id)}
                          onChange={() =>
                            setMainForm({
                              ...mainForm,
                              allowedSchoolIds: toggleInArray(
                                mainForm.allowedSchoolIds,
                                sch.id
                              ),
                            })
                          }
                          className="accent-[#0B1F3A]"
                        />
                        <span>{sch.shortName}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-semibold text-slate-600 mb-1">
                    Campuses
                  </p>
                  <div className="space-y-1 bg-white p-2 rounded-lg border border-slate-200 max-h-28 overflow-y-auto">
                    {allCampuses.map((cmp) => (
                      <label
                        key={cmp.id}
                        className="flex items-center gap-2 text-[11px] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={mainForm.allowedCampusIds.includes(cmp.id)}
                          onChange={() =>
                            setMainForm({
                              ...mainForm,
                              allowedCampusIds: toggleInArray(
                                mainForm.allowedCampusIds,
                                cmp.id
                              ),
                            })
                          }
                          className="accent-[#0B1F3A]"
                        />
                        <span className="truncate">
                          {cmp.name} ({cmp.schoolShortName})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-slate-600 mb-1">
                    Explicit Allowed Roles
                  </p>
                  <div className="space-y-1 bg-white p-2 rounded-lg border border-slate-200 max-h-28 overflow-y-auto">
                    {ALL_ERP_ROLES.map((r) => (
                      <label
                        key={r.role}
                        className="flex items-center gap-2 text-[11px] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={mainForm.allowedRoles.includes(r.role)}
                          onChange={() =>
                            setMainForm({
                              ...mainForm,
                              allowedRoles: toggleInArray(
                                mainForm.allowedRoles,
                                r.role
                              ),
                            })
                          }
                          className="accent-[#0B1F3A]"
                        />
                        <span>{r.role}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsMainModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#132E54] text-white font-semibold cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{editingMainMenu ? 'Save Main Menu' : 'Create Main Menu'}</span>
            </button>
          </div>
        </form>
      </EnterpriseFormModal>

      {/* MODAL 2: ADD / EDIT SUBMENU (WITH PARENT MENU REASSIGNMENT & ICON PICKER) */}
      <EnterpriseFormModal
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        title={
          editingSubMenu
            ? `Edit Submenu — ${editingSubMenu.label}`
            : 'Add New Submenu'
        }
        subtitle="Assign parent main menu, update display order, icon, target route, and visibility."
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleSaveSubMenu} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#0B1F3A] mb-1">
                Parent Main Menu *
              </label>
              <select
                value={subForm.parentId}
                onChange={(e) =>
                  setSubForm({ ...subForm, parentId: e.target.value })
                }
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:border-[#0B1F3A]"
              >
                {sortedMenus.map((m) => (
                  <option key={m.id} value={m.id}>
                    #{m.order} {m.label} {!m.isActive ? '(Inactive)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#0B1F3A] mb-1">
                Submenu Name *
              </label>
              <input
                type="text"
                required
                value={subForm.label}
                onChange={(e) =>
                  setSubForm({ ...subForm, label: e.target.value })
                }
                placeholder="e.g., Inter-School Tournaments"
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:border-[#0B1F3A]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#0B1F3A] mb-1">
              Description
            </label>
            <input
              type="text"
              value={subForm.description}
              onChange={(e) =>
                setSubForm({ ...subForm, description: e.target.value })
              }
              placeholder="Describe what this submenu opens or manages"
              className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:border-[#0B1F3A]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#0B1F3A] mb-1">
                Target ERP Module
              </label>
              <select
                value={subForm.targetSection}
                onChange={(e) =>
                  setSubForm({
                    ...subForm,
                    targetSection: e.target.value as NavSection,
                  })
                }
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg"
              >
                {TARGET_SECTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#0B1F3A] mb-1">
                Submenu Order
              </label>
              <input
                type="number"
                min={1}
                max={99}
                value={subForm.order}
                onChange={(e) =>
                  setSubForm({ ...subForm, order: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={subForm.isActive}
                onChange={(e) =>
                  setSubForm({ ...subForm, isActive: e.target.checked })
                }
                className="w-4 h-4 accent-[#0B1F3A]"
              />
              <span className="font-semibold text-[#0B1F3A]">Active Submenu</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={subForm.isVisible}
                onChange={(e) =>
                  setSubForm({ ...subForm, isVisible: e.target.checked })
                }
                className="w-4 h-4 accent-[#0B1F3A]"
              />
              <span className="font-semibold text-[#0B1F3A]">
                Visible to Standard Roles
              </span>
            </label>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block font-semibold text-[#0B1F3A] mb-1.5">
              Icon ({subForm.iconName})
            </label>
            <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5 p-2 bg-[#F8FAFC] border border-slate-200 rounded-lg">
              {MENU_ICON_NAMES.map((iconKey) => {
                const IconComp = getMenuIconComponent(iconKey);
                const selected = subForm.iconName === iconKey;
                return (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => setSubForm({ ...subForm, iconName: iconKey })}
                    title={iconKey}
                    className={`w-7 h-7 rounded-md flex items-center justify-center cursor-pointer ${
                      selected
                        ? 'bg-[#0B1F3A] text-[#D4AF37] ring-2 ring-[#D4AF37]'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-[#0B1F3A]'
                    }`}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsSubModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#132E54] text-white font-semibold cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{editingSubMenu ? 'Save Submenu' : 'Add Submenu'}</span>
            </button>
          </div>
        </form>
      </EnterpriseFormModal>

      {/* MODAL 3: DELETE MAIN MENU WITH DEPENDENCY CHECK & SUBMENU REASSIGNMENT */}
      <EnterpriseFormModal
        isOpen={Boolean(deleteMainTarget)}
        onClose={() => setDeleteMainTarget(null)}
        title={`Delete Main Menu — ${deleteMainTarget?.label || ''}`}
        subtitle="Dependency inspection and safe reassignment before deleting navigation records."
        maxWidthClass="max-w-xl"
      >
        {deleteMainTarget && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-amber-900">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Dependency Check Report</p>
                <p className="text-[11px]">
                  • Child Submenus:{' '}
                  <strong>{deleteMainTarget.subItems.length}</strong> (
                  {deleteMainTarget.subItems.filter((s) => s.isActive).length}{' '}
                  active)
                </p>
                <p className="text-[11px]">
                  • RBAC Roles referencing module:{' '}
                  <strong>
                    {getDependentRoleCount(deleteMainTarget.section)}
                  </strong>
                </p>
                <p className="text-[11px] text-amber-800">
                  Tip: If you only want to hide this menu temporarily without losing records, use <strong>Deactivate</strong> instead.
                </p>
              </div>
            </div>

            {deleteMainTarget.subItems.length > 0 && (
              <div className="space-y-2.5">
                <p className="font-bold text-[#0B1F3A]">
                  How should the {deleteMainTarget.subItems.length} dependent submenu(s) be handled?
                </p>

                <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-[#F8FAFC] cursor-pointer">
                  <input
                    type="radio"
                    name="deleteStrategy"
                    checked={deleteStrategy === 'reassign'}
                    onChange={() => setDeleteStrategy('reassign')}
                    className="mt-0.5 accent-[#0B1F3A]"
                  />
                  <div className="flex-1 space-y-2">
                    <span className="font-bold text-[#0B1F3A] block">
                      Reassign all submenus to another Main Menu (Recommended)
                    </span>
                    {deleteStrategy === 'reassign' && (
                      <select
                        value={reassignTargetMenuId}
                        onChange={(e) => setReassignTargetMenuId(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      >
                        {sortedMenus
                          .filter((m) => m.id !== deleteMainTarget.id)
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              #{m.order} {m.label}
                            </option>
                          ))}
                      </select>
                    )}
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-lg border border-rose-200 bg-rose-50/50 cursor-pointer">
                  <input
                    type="radio"
                    name="deleteStrategy"
                    checked={deleteStrategy === 'cascade'}
                    onChange={() => setDeleteStrategy('cascade')}
                    className="mt-0.5 accent-rose-600"
                  />
                  <div className="flex-1 space-y-2">
                    <span className="font-bold text-rose-800 block">
                      Permanently delete menu and all {deleteMainTarget.subItems.length} child submenus
                    </span>
                    {deleteStrategy === 'cascade' && (
                      <label className="flex items-center gap-2 text-[11px] text-rose-900 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cascadeAckChecked}
                          onChange={(e) => setCascadeAckChecked(e.target.checked)}
                          className="accent-rose-600"
                        />
                        <span>
                          I confirm permanent deletion of all dependent submenus.
                        </span>
                      </label>
                    )}
                  </div>
                </label>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDeleteMainTarget(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  deleteMainTarget.subItems.length > 0 &&
                  ((deleteStrategy === 'reassign' && !reassignTargetMenuId) ||
                    (deleteStrategy === 'cascade' && !cascadeAckChecked))
                }
                onClick={confirmDeleteMainMenu}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold disabled:opacity-40 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {deleteMainTarget.subItems.length > 0 &&
                  deleteStrategy === 'reassign'
                    ? 'Reassign & Delete Menu'
                    : 'Confirm Permanent Delete'}
                </span>
              </button>
            </div>
          </div>
        )}
      </EnterpriseFormModal>

      {/* DIALOG 4: DELETE SUBMENU CONFIRMATION WITH DEPENDENCY INFO */}
      <EnterpriseConfirmDialog
        isOpen={Boolean(deleteSubTarget)}
        title="Delete Submenu Record?"
        message={
          deleteSubTarget
            ? `Delete submenu "${deleteSubTarget.sub.label}" (route: ${deleteSubTarget.sub.actionId}) from "${deleteSubTarget.parent.label}"?${
                deleteSubTarget.parent.subItems.filter((s) => s.isActive).length <= 1
                  ? ' Warning: This is the last active submenu under this parent menu.'
                  : ''
              } Consider Deactivating if you want to preserve this record.`
            : ''
        }
        confirmLabel="Delete Submenu"
        tone="danger"
        onCancel={() => setDeleteSubTarget(null)}
        onConfirm={confirmDeleteSubMenu}
      />
    </div>
  );
};
