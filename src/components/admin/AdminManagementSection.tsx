import React, { useState, useEffect } from 'react';
import { User, AdminPermissions } from '../../types';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/authContext';
import { 
  Shield, ShieldCheck, ShieldAlert, UserPlus, Trash2, Edit3, 
  Check, X, Crown, Sparkles, AlertCircle, RefreshCw, KeyRound
} from 'lucide-react';

interface AdminManagementSectionProps {
  onRefreshGlobalData?: () => void;
  showToast: (msg: string) => void;
}

const DEFAULT_PERMISSIONS: AdminPermissions = {
  canManagePrompts: true,
  canManageCategories: true,
  canManageUsers: true,
  canManageSubscriptions: true,
  canManageVideos: true,
  canManageRequests: true,
  canManageReports: true,
  canManageAdmins: false
};

const OWNER_EMAIL = 'usagiptiktok@gmail.com';

export const AdminManagementSection: React.FC<AdminManagementSectionProps> = ({
  onRefreshGlobalData,
  showToast
}) => {
  const { user, isSuperAdmin } = useAuth();
  const [admins, setAdmins] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Promote Form State
  const [targetEmail, setTargetEmail] = useState('');
  const [targetName, setTargetName] = useState('');
  const [permissions, setPermissions] = useState<AdminPermissions>({ ...DEFAULT_PERMISSIONS });

  // Edit Permissions Modal
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null);
  const [editPermissions, setEditPermissions] = useState<AdminPermissions>({ ...DEFAULT_PERMISSIONS });

  const loadAdmins = async () => {
    setIsLoading(true);
    try {
      const list = await api.getAdmins();
      setAdmins(list);
    } catch (err: any) {
      console.error('Failed to load administrators', err);
      showToast(err.message || 'Failed to load admins');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      loadAdmins();
    }
  }, [isSuperAdmin]);

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail.trim()) {
      showToast('Please provide a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.promoteUserToAdmin(targetEmail.trim(), targetName.trim() || undefined, permissions);
      showToast(res.message || `Promoted ${targetEmail} to Administrator!`);
      setTargetEmail('');
      setTargetName('');
      setPermissions({ ...DEFAULT_PERMISSIONS });
      loadAdmins();
      if (onRefreshGlobalData) onRefreshGlobalData();
    } catch (err: any) {
      showToast(err.message || 'Failed to promote user to Admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (admin: User) => {
    setEditingAdmin(admin);
    setEditPermissions({
      canManagePrompts: admin.adminPermissions?.canManagePrompts ?? true,
      canManageCategories: admin.adminPermissions?.canManageCategories ?? true,
      canManageUsers: admin.adminPermissions?.canManageUsers ?? true,
      canManageSubscriptions: admin.adminPermissions?.canManageSubscriptions ?? true,
      canManageVideos: admin.adminPermissions?.canManageVideos ?? true,
      canManageRequests: admin.adminPermissions?.canManageRequests ?? true,
      canManageReports: admin.adminPermissions?.canManageReports ?? true,
      canManageAdmins: admin.adminPermissions?.canManageAdmins ?? false
    });
  };

  const handleSavePermissions = async () => {
    if (!editingAdmin) return;
    try {
      await api.updateAdminPermissions(editingAdmin.uid, editPermissions);
      showToast(`Updated permissions for ${editingAdmin.name}`);
      setEditingAdmin(null);
      loadAdmins();
      if (onRefreshGlobalData) onRefreshGlobalData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update admin permissions');
    }
  };

  const handleRemoveAdmin = async (admin: User) => {
    if (admin.email.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
      showToast('The primary Super Admin owner account cannot be removed.');
      return;
    }

    if (!confirm(`Are you sure you want to revoke Administrator status for ${admin.name} (${admin.email})? They will be demoted to a regular user.`)) {
      return;
    }

    try {
      const res = await api.removeAdmin(admin.uid);
      showToast(res.message || `Revoked admin privileges for ${admin.email}`);
      loadAdmins();
      if (onRefreshGlobalData) onRefreshGlobalData();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove admin');
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-8 rounded-2xl bg-white dark:bg-[#0A101E] border border-rose-500/20 text-center space-y-4 shadow-lg">
        <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 w-fit mx-auto ring-1 ring-rose-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">
          Super Admin Clearance Required
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          Admin authorization management is exclusively restricted to the platform owner account (<span className="text-amber-400 font-semibold">{OWNER_EMAIL}</span>).
          Standard administrators cannot create, promote, or alter permissions of other administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Super Admin Status Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Super Admin Master Control
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Owner Clearance
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Logged in as <span className="font-semibold text-slate-700 dark:text-slate-200">{user?.email}</span>. You have supreme authority to promote admins, assign granular access, and manage the platform.
            </p>
          </div>
        </div>

        <button
          onClick={loadAdmins}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 w-fit transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          <span>Refresh Admins</span>
        </button>
      </div>

      {/* 1. Add / Promote New Admin Form */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0A101E] border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 dark:border-slate-800/80">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
              Promote User to Administrator
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter any user account's email to grant immediate administrative privileges and configure module permissions.
            </p>
          </div>
        </div>

        <form onSubmit={handlePromote} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                User Email Address *
              </label>
              <input
                type="email"
                required
                value={targetEmail}
                onChange={e => setTargetEmail(e.target.value)}
                placeholder="e.g. collaborator@company.com"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#060911] border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Full Name (Optional)
              </label>
              <input
                type="text"
                value={targetName}
                onChange={e => setTargetName(e.target.value)}
                placeholder="e.g. Sarah Connor"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#060911] border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
          </div>

          {/* Granular Permissions Checkboxes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Assigned Permissions & Feature Clearances
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {[
                { key: 'canManagePrompts', label: 'Master Prompts CRUD' },
                { key: 'canManageCategories', label: 'Categories Management' },
                { key: 'canManageUsers', label: 'User Directory & Roles' },
                { key: 'canManageSubscriptions', label: 'Subscription Tiers' },
                { key: 'canManageVideos', label: 'Showcase Moderation' },
                { key: 'canManageRequests', label: 'Custom VIP Requests' },
                { key: 'canManageReports', label: 'Community Reports' }
              ].map(perm => (
                <label
                  key={perm.key}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                    (permissions as any)[perm.key]
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 font-semibold'
                      : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!(permissions as any)[perm.key]}
                    onChange={e => setPermissions(prev => ({ ...prev, [perm.key]: e.target.checked }))}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span>{perm.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Promoting...' : 'Promote to Administrator'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Platform Administrators List */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0A101E] border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Current Platform Administrators ({admins.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All authorized administrators with access to the /admin control panel.
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="pb-3 font-bold">Admin User</th>
                <th className="pb-3 font-bold">Role & Clearance</th>
                <th className="pb-3 font-bold">Granted Modules</th>
                <th className="pb-3 font-bold">Member Since</th>
                <th className="pb-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {admins.map(adm => {
                const isOwner = adm.email.toLowerCase() === OWNER_EMAIL.toLowerCase();
                const isSuper = isOwner || adm.role === 'superadmin' || adm.isSuperAdmin;

                return (
                  <tr key={adm.uid} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={adm.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'}
                          alt={adm.name}
                          className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-700"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-white">{adm.name}</span>
                            {isOwner && (
                              <Crown className="w-3.5 h-3.5 text-amber-400" title="Primary Platform Owner" />
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{adm.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 pr-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                        isSuper
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                      }`}>
                        <Shield className="w-3 h-3" />
                        <span>{isSuper ? 'Super Admin' : 'Admin'}</span>
                      </span>
                    </td>

                    <td className="py-3.5 pr-4">
                      {isSuper ? (
                        <span className="text-amber-400 font-semibold text-[11px] flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Full Platform Clearance</span>
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {adm.adminPermissions?.canManagePrompts && (
                            <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px]">Prompts</span>
                          )}
                          {adm.adminPermissions?.canManageCategories && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px]">Categories</span>
                          )}
                          {adm.adminPermissions?.canManageUsers && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px]">Users</span>
                          )}
                          {adm.adminPermissions?.canManageSubscriptions && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px]">Billing</span>
                          )}
                          {adm.adminPermissions?.canManageVideos && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px]">Videos</span>
                          )}
                          {adm.adminPermissions?.canManageRequests && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px]">Requests</span>
                          )}
                          {adm.adminPermissions?.canManageReports && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 text-[10px]">Reports</span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 pr-4 text-slate-500 font-mono text-[11px]">
                      {adm.createdAt || '2026-01-01'}
                    </td>

                    <td className="py-3.5 text-right">
                      {isOwner ? (
                        <span className="text-[11px] text-slate-500 font-medium italic">Owner (Protected)</span>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(adm)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-cyan-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            title="Edit Permissions"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveAdmin(adm)}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                            title="Revoke Admin Clearance"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Permissions Modal */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                    Edit Admin Permissions
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {editingAdmin.name} ({editingAdmin.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingAdmin(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Module Clearances
              </label>
              {[
                { key: 'canManagePrompts', label: 'Master Prompts CRUD' },
                { key: 'canManageCategories', label: 'Categories Management' },
                { key: 'canManageUsers', label: 'User Directory & Roles' },
                { key: 'canManageSubscriptions', label: 'Subscription Tiers' },
                { key: 'canManageVideos', label: 'Showcase Video Moderation' },
                { key: 'canManageRequests', label: 'Custom VIP Requests' },
                { key: 'canManageReports', label: 'Community Content Reports' }
              ].map(perm => (
                <label
                  key={perm.key}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                    (editPermissions as any)[perm.key]
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 font-semibold'
                      : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <span>{perm.label}</span>
                  <input
                    type="checkbox"
                    checked={!!(editPermissions as any)[perm.key]}
                    onChange={e => setEditPermissions(prev => ({ ...prev, [perm.key]: e.target.checked }))}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                  />
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingAdmin(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePermissions}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
