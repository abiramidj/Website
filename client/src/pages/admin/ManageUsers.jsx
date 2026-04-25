import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser } from '../../lib/api.js';
import styles from './ManageUsers.module.css';

const EMPTY_CREATE = { full_name: '', email: '', password: '', role: 'student', subscription_status: '' };
const EMPTY_EDIT   = { full_name: '', role: 'student', subscription_status: '' };

const SUB_OPTIONS = [
  { value: '',          label: '— None —' },
  { value: 'trialing',  label: 'Trialing' },
  { value: 'active',    label: 'Active' },
  { value: 'canceled',  label: 'Canceled' },
];

function initials(name) {
  return (name || '?').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function RoleBadge({ role }) {
  return (
    <span className={`${styles.roleBadge} ${role === 'admin' ? styles.roleAdmin : styles.roleStudent}`}>
      {role}
    </span>
  );
}

function SubBadge({ status }) {
  const map = { active: styles.subActive, trialing: styles.subTrialing, canceled: styles.subCanceled };
  const cls  = map[status] || styles.subFree;
  return <span className={`${styles.subBadge} ${cls}`}>{status || 'free'}</span>;
}

/* ── Add User Modal ── */
function AddModal({ onClose, onCreated }) {
  const { getToken } = useAuth();
  const [form, setForm] = useState(EMPTY_CREATE);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        email: form.email.trim(),
        password: form.password,
        full_name: form.full_name.trim(),
        role: form.role,
        ...(form.subscription_status ? { subscription_status: form.subscription_status } : {}),
      };
      const user = await createAdminUser(payload, getToken);
      onCreated(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Add New User</span>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && <div className={styles.modalError}>{error}</div>}

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Full Name</label>
              <input className={styles.fieldInput} value={form.full_name}
                onChange={e => set('full_name', e.target.value)}
                placeholder="Jane Smith" required />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Email</label>
              <input className={styles.fieldInput} type="email" value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="jane@example.com" required />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Password</label>
              <input className={styles.fieldInput} type="password" value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="Min 8 characters" required minLength={8} />
              <span className={styles.fieldHint}>User can change this after signing in.</span>
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Role</label>
              <select className={styles.fieldSelect} value={form.role}
                onChange={e => set('role', e.target.value)}>
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Subscription Status</label>
              <select className={styles.fieldSelect} value={form.subscription_status}
                onChange={e => set('subscription_status', e.target.value)}>
                {SUB_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Edit User Modal ── */
function EditModal({ user, onClose, onSaved }) {
  const { getToken } = useAuth();
  const [form, setForm] = useState({
    full_name: user.full_name || '',
    role: user.role || 'student',
    subscription_status: user.subscription_status || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await updateAdminUser(user.user_id, {
        full_name: form.full_name.trim(),
        role: form.role,
        subscription_status: form.subscription_status || null,
      }, getToken);
      onSaved({ ...user, ...form, subscription_status: form.subscription_status || null });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Edit User</span>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && <div className={styles.modalError}>{error}</div>}

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Email</label>
              <input className={styles.fieldInput} value={user.email} disabled />
              <span className={styles.fieldHint}>Email cannot be changed here.</span>
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Full Name</label>
              <input className={styles.fieldInput} value={form.full_name}
                onChange={e => set('full_name', e.target.value)}
                placeholder="Full name" required />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Role</label>
              <select className={styles.fieldSelect} value={form.role}
                onChange={e => set('role', e.target.value)}>
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Subscription Status</label>
              <select className={styles.fieldSelect} value={form.subscription_status}
                onChange={e => set('subscription_status', e.target.value)}>
                {SUB_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Delete Confirm Modal ── */
function DeleteModal({ user, onClose, onDeleted }) {
  const { getToken } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [error, setError]       = useState('');

  async function handleDelete() {
    setError('');
    setDeleting(true);
    try {
      await deleteAdminUser(user.user_id, getToken);
      onDeleted(user.user_id);
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Delete User</span>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.deleteBody}>
          {error && <div className={styles.modalError}>{error}</div>}
          <p className={styles.deleteWarning}>
            Are you sure you want to delete <strong>{user.full_name || user.email}</strong>?
            Their account and all associated data will be permanently removed.
          </p>
          <div className={styles.deleteNote}>
            This action cannot be undone. The user will lose access immediately.
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={deleting}>Cancel</button>
          <button className={styles.confirmDeleteBtn} onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Yes, Delete User'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function ManageUsers() {
  const { getToken } = useAuth();

  const [users, setUsers]         = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [showAdd, setShowAdd]     = useState(false);
  const [editUser, setEditUser]   = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);

  const LIMIT = 20;

  const load = useCallback(async (p = 1, s = search, r = roleFilter) => {
    setLoading(true);
    setError('');
    try {
      const params = { page: p, limit: LIMIT };
      if (s) params.search = s;
      if (r) params.role   = r;
      const data = await getAdminUsers(getToken, params);
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setPage(p);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken, search, roleFilter]);

  useEffect(() => { load(1, search, roleFilter); }, [search, roleFilter]);

  function handleCreated(newUser) {
    setShowAdd(false);
    load(page);
  }

  function handleSaved(updated) {
    setUsers(us => us.map(u => u.user_id === updated.user_id ? { ...u, ...updated } : u));
    setEditUser(null);
  }

  function handleDeleted(userId) {
    setUsers(us => us.filter(u => u.user_id !== userId));
    setTotal(t => t - 1);
    setDeleteUser(null);
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Manage Users</h1>
          <p className={styles.subtitle}>{total} user{total !== 1 ? 's' : ''} total</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowAdd(true)}>
          + Add User
        </button>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <input
          className={styles.search}
          type="search"
          placeholder="Search by name…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <select
          className={styles.filterSelect}
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
        >
          <option value="">All roles</option>
          <option value="student">Students</option>
          <option value="admin">Admins</option>
        </select>
        <span className={styles.totalLabel}>{total} result{total !== 1 ? 's' : ''}</span>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Subscription</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className={styles.emptyCell}>Loading…</td></tr>
            )}
            {!loading && users.length === 0 && (
              <tr><td colSpan={5} className={styles.emptyCell}>No users found.</td></tr>
            )}
            {!loading && users.map(u => (
              <tr key={u.user_id}>
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.avatar}>{initials(u.full_name)}</div>
                    <div>
                      <div className={styles.userName}>{u.full_name || '—'}</div>
                      <div className={styles.userEmail}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td><RoleBadge role={u.role} /></td>
                <td><SubBadge status={u.subscription_status} /></td>
                <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                <td>
                  <div className={styles.actionBtns}>
                    <button className={styles.editBtn} onClick={() => setEditUser(u)}>Edit</button>
                    <button className={styles.deleteBtn} onClick={() => setDeleteUser(u)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button className={styles.pageBtn} onClick={() => load(page - 1)} disabled={page <= 1}>
            ← Prev
          </button>
          <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
          <button className={styles.pageBtn} onClick={() => load(page + 1)} disabled={page >= totalPages}>
            Next →
          </button>
        </div>
      )}

      {/* Modals */}
      {showAdd   && <AddModal onClose={() => setShowAdd(false)} onCreated={handleCreated} />}
      {editUser  && <EditModal user={editUser} onClose={() => setEditUser(null)} onSaved={handleSaved} />}
      {deleteUser && <DeleteModal user={deleteUser} onClose={() => setDeleteUser(null)} onDeleted={handleDeleted} />}
    </div>
  );
}
