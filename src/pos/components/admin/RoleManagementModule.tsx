import React, { useState, useMemo } from 'react';
import {
  Role,
  PermissionCode,
  ALL_PERMISSIONS,
  getStoredRoles,
  saveStoredRoles,
} from '../../utils/rbac';
import { PosUser } from '../../types/pos';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Ban,
  CheckSquare,
  Square,
  X,
  Save,
  Users,
  Lock,
} from 'lucide-react';

interface RoleManagementModuleProps {
  currentUser: PosUser;
  users: PosUser[];
  onUpdateUserRole?: (userId: string, newRole: string) => void;
}

export const RoleManagementModule: React.FC<RoleManagementModuleProps> = ({
  currentUser,
  users,
}) => {
  const [roles, setRoles] = useState<Role[]>(getStoredRoles);
  const [search, setSearch] = useState('');
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [roleName, setRoleName] = useState('');
  const [roleCode, setRoleCode] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionCode[]>([]);

  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreateModal = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleCode('');
    setRoleDesc('');
    setIsActive(true);
    setSelectedPermissions([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleCode(role.code);
    setRoleDesc(role.description);
    setIsActive(role.isActive);
    setSelectedPermissions([...role.permissions]);
    setIsModalOpen(true);
  };

  const handleTogglePermission = (code: PermissionCode) => {
    setSelectedPermissions((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code]
    );
  };

  const handleSelectAllModule = (moduleName: string) => {
    const modCodes = ALL_PERMISSIONS.filter((p) => p.module === moduleName).map((p) => p.code);
    const allSelected = modCodes.every((c) => selectedPermissions.includes(c));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((c) => !modCodes.includes(c)));
    } else {
      const combined = Array.from(new Set([...selectedPermissions, ...modCodes]));
      setSelectedPermissions(combined);
    }
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim() || !roleCode.trim()) return;

    if (editingRole) {
      const updated = roles.map((r) =>
        r.id === editingRole.id
          ? {
              ...r,
              name: roleName.trim(),
              code: roleCode.trim().toLowerCase(),
              description: roleDesc.trim(),
              isActive,
              permissions: selectedPermissions,
            }
          : r
      );
      setRoles(updated);
      saveStoredRoles(updated);
      setSuccessMsg(`Role "${roleName}" successfully updated.`);
    } else {
      const newRole: Role = {
        id: `role-${Date.now()}`,
        name: roleName.trim(),
        code: roleCode.trim().toLowerCase(),
        description: roleDesc.trim(),
        isActive,
        permissions: selectedPermissions,
        createdAt: new Date().toISOString(),
      };
      const updated = [...roles, newRole];
      setRoles(updated);
      saveStoredRoles(updated);
      setSuccessMsg(`New role "${roleName}" created successfully.`);
    }
    setIsModalOpen(false);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleDeleteRole = (role: Role) => {
    if (role.code === 'admin' || role.code === 'super_admin') {
      alert('Cannot delete the built-in Super Admin role.');
      return;
    }
    const inUseCount = users.filter((u) => u.role === role.code).length;
    if (inUseCount > 0) {
      alert(`Cannot delete role "${role.name}" because ${inUseCount} user(s) are currently assigned to it.`);
      return;
    }
    if (window.confirm(`Delete security role "${role.name}"?`)) {
      const updated = roles.filter((r) => r.id !== role.id);
      setRoles(updated);
      saveStoredRoles(updated);
      setSuccessMsg(`Role "${role.name}" deleted.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // Group permissions by module
  const modulesMap = useMemo(() => {
    const map: Record<string, typeof ALL_PERMISSIONS> = {};
    ALL_PERMISSIONS.forEach((p) => {
      if (!map[p.module]) map[p.module] = [];
      map[p.module].push(p);
    });
    return map;
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 p-5 rounded-2xl shadow-sm">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <span>Role & Permission Management (RBAC)</span>
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Define granular access permissions for cashiers, managers, accountants, teachers, and administrators.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Role</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 p-3 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles by name, code, or description..."
            className="w-full bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 px-3.5 py-2 rounded-xl focus:outline-none focus:border-amber-500"
          />
        </div>
        <span className="text-xs text-neutral-400 font-mono">
          Showing {filteredRoles.length} roles
        </span>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRoles.map((role) => {
          const assignedUsersCount = users.filter((u) => u.role === role.code).length;
          return (
            <div
              key={role.id}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:border-amber-500/40 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <span>{role.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-amber-300 font-bold">
                        {role.code}
                      </span>
                    </h4>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        role.isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {role.isActive ? 'Active Role' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(role)}
                      className="p-1.5 text-neutral-400 hover:text-white bg-neutral-800 rounded-lg transition-colors"
                      title="Edit role"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {role.code !== 'admin' && role.code !== 'super_admin' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRole(role)}
                        className="p-1.5 text-red-400 hover:text-white bg-red-950/40 rounded-lg transition-colors"
                        title="Delete role"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-neutral-400 line-clamp-2">{role.description}</p>

                {/* Permissions summary */}
                <div className="pt-2 border-t border-neutral-800 space-y-1">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
                    Permissions ({role.permissions.length} granted):
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                    {role.permissions.map((p) => (
                      <span
                        key={p}
                        className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-neutral-950 text-neutral-300 border border-neutral-800"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
                <span className="flex items-center gap-1 font-mono">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>{assignedUsersCount} User(s) Assigned</span>
                </span>
                <span className="text-[10px] font-mono">ID: {role.id.slice(-6)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT ROLE MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>{editingRole ? 'Edit Security Role' : 'Create New Security Role'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="p-6 space-y-5 overflow-y-auto text-xs flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Role Name</label>
                  <input
                    type="text"
                    required
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="e.g. Canteen Supervisor"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Role Code (Unique)</label>
                  <input
                    type="text"
                    required
                    value={roleCode}
                    onChange={(e) => setRoleCode(e.target.value)}
                    placeholder="e.g. canteen_supervisor"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-neutral-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                  placeholder="Brief description of role responsibilities..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="roleActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-neutral-950 border-neutral-800"
                />
                <label htmlFor="roleActiveCheck" className="text-neutral-300 font-medium cursor-pointer">
                  Role is Active (Enabled for user authentication)
                </label>
              </div>

              {/* Granular Permissions Checkboxes Grouped by Module */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="font-bold text-white text-xs uppercase tracking-wider">
                    Assigned Permissions ({selectedPermissions.length} / {ALL_PERMISSIONS.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPermissions(ALL_PERMISSIONS.map((p) => p.code))}
                      className="text-[11px] text-amber-400 hover:underline font-mono"
                    >
                      Select All
                    </button>
                    <span className="text-neutral-600">·</span>
                    <button
                      type="button"
                      onClick={() => setSelectedPermissions([])}
                      className="text-[11px] text-red-400 hover:underline font-mono"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {Object.entries(modulesMap).map(([modName, perms]) => {
                    const modCodes = perms.map((p) => p.code);
                    const allModSelected = modCodes.every((c) => selectedPermissions.includes(c));
                    return (
                      <div key={modName} className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2.5">
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-850">
                          <span className="font-bold text-amber-400 text-xs">{modName}</span>
                          <button
                            type="button"
                            onClick={() => handleSelectAllModule(modName)}
                            className="text-[10px] text-neutral-400 hover:text-white font-mono uppercase"
                          >
                            {allModSelected ? 'Deselect Module' : 'Select Module'}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {perms.map((perm) => {
                            const isChecked = selectedPermissions.includes(perm.code);
                            return (
                              <label
                                key={perm.code}
                                className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all cursor-pointer ${
                                  isChecked
                                    ? 'bg-amber-500/10 border-amber-500/40 text-neutral-100'
                                    : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleTogglePermission(perm.code)}
                                  className="mt-0.5 w-3.5 h-3.5 rounded text-amber-500 focus:ring-0 bg-neutral-900 border-neutral-700 cursor-pointer"
                                />
                                <div className="space-y-0.5">
                                  <span className="font-semibold text-xs block text-white">{perm.name}</span>
                                  <span className="text-[10px] font-mono text-neutral-500 block">{perm.code}</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-neutral-400 hover:text-white bg-neutral-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-xl flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingRole ? 'Update Role' : 'Create Role'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
