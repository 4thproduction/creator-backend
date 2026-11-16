import { useState, useEffect } from 'react'
import { FormControl, MenuItem, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { listUsers, createUser, updateUser, deleteUser } from '../actions/userActions'
import { listRoles } from '../actions/roleActions'
import {
  USER_CREATE_RESET,
  USER_UPDATE_RESET,
  USER_DELETE_RESET,
} from '../constants/userConstants'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'

const Modal = ({ title, onClose, onSubmit, loading, error, children }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
    <div className="portal-card shadow-xl w-full max-w-md p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-stone-800">{title}</h3>
        <button
          onClick={onClose}
          className="text-stone-400 hover:text-stone-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
          {error}
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        {children}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-[#faf8f2] text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="portal-button flex-1 text-sm"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  </div>
)

const inputClass =
  'w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500'

const UsersScreen = () => {
  const dispatch = useDispatch()

  const { userInfo } = useSelector((state) => state.auth)
  const permissions = userInfo?.user?.role?.permissions || []

  const { users, total, loading: listLoading, error: listError } = useSelector((state) => state.userList)
  const { success: createSuccess, loading: createLoading, error: createError } = useSelector(
    (state) => state.userCreate
  )
  const { success: updateSuccess, loading: updateLoading, error: updateError } = useSelector(
    (state) => state.userUpdate
  )
  const { success: deleteSuccess } = useSelector((state) => state.userDelete)
  const { roles } = useSelector((state) => state.roleList)

  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: '' })
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  useEffect(() => {
    dispatch(listUsers(page, limit))
  }, [dispatch, page, limit])

  useEffect(() => {
    dispatch(listRoles())
  }, [dispatch])

  useEffect(() => {
    if (createSuccess) {
      setShowCreate(false)
      setForm({ name: '', email: '', password: '', role: '' })
      dispatch({ type: USER_CREATE_RESET })
      if (page !== 1) setPage(1)
      else dispatch(listUsers(page, limit))
    }
  }, [createSuccess, dispatch, page, limit])

  useEffect(() => {
    if (updateSuccess) {
      setShowEdit(false)
      setSelectedUser(null)
      dispatch({ type: USER_UPDATE_RESET })
      dispatch(listUsers(page, limit))
    }
  }, [updateSuccess, dispatch, page, limit])

  useEffect(() => {
    if (deleteSuccess) {
      dispatch({ type: USER_DELETE_RESET })
      if (users.length === 1 && page > 1) setPage(page - 1)
      else dispatch(listUsers(page, limit))
    }
  }, [deleteSuccess, dispatch, page, limit, users.length])

  const openEdit = (user) => {
    setSelectedUser(user)
    setForm({ name: user.name, email: user.email, password: '', role: user.role?._id || '' })
    setShowEdit(true)
  }

  const handleCreate = (e) => {
    e.preventDefault()
    dispatch(createUser(form))
  }

  const handleUpdate = (e) => {
    e.preventDefault()
    const payload = { name: form.name, email: form.email, role: form.role }
    if (form.password) payload.password = form.password
    dispatch(updateUser(selectedUser._id, payload))
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      dispatch(deleteUser(id))
    }
  }

  const closeCreate = () => {
    setShowCreate(false)
    dispatch({ type: USER_CREATE_RESET })
  }

  const closeEdit = () => {
    setShowEdit(false)
    dispatch({ type: USER_UPDATE_RESET })
  }

  return (
    <div className="portal-shell flex">
      <Sidebar />
      <div className="portal-main ml-0 flex flex-1 flex-col md:ml-72">
        <Navbar title="Users" />
        <div className="portal-content flex-1 p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-stone-500">
              {total} user{total !== 1 ? 's' : ''} total
            </p>
            {permissions.includes('create_user') && (
              <button
                onClick={() => setShowCreate(true)}
                className="portal-button text-sm"
              >
                <Plus className="h-4 w-4" />
                Add User
              </button>
            )}
          </div>

          {listError && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{listError}</p>}

          <TableContainer className="overflow-x-auto rounded-xl border border-stone-300 bg-white shadow-sm">
            <Table aria-label="Users" className="min-w-[620px] border-collapse">
              <TableHead className="bg-stone-100">
                <TableRow>
                  <TableCell className="!w-24 !whitespace-nowrap !border-b !border-stone-300 !px-4 !py-3 !text-xs !font-bold !uppercase !tracking-wide !text-stone-700">Serial No.</TableCell>
                  <TableCell className="!border-b !border-stone-300 !px-4 !py-3 !text-xs !font-bold !uppercase !tracking-wide !text-stone-700">Name</TableCell>
                  <TableCell className="!border-b !border-stone-300 !px-4 !py-3 !text-xs !font-bold !uppercase !tracking-wide !text-stone-700">Email</TableCell>
                  <TableCell className="!border-b !border-stone-300 !px-4 !py-3 !text-xs !font-bold !uppercase !tracking-wide !text-stone-700">Role</TableCell>
                  {(permissions.includes('update_user') || permissions.includes('delete_user')) && (
                    <TableCell align="right" className="!border-b !border-stone-300 !px-4 !py-3 !text-xs !font-bold !uppercase !tracking-wide !text-stone-700">Actions</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {listLoading || users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={permissions.includes('update_user') || permissions.includes('delete_user') ? 5 : 4} align="center" className="!border-stone-300 !py-10 !text-sm !text-stone-500">
                      {listLoading ? 'Loading...' : 'No users found. Create one to get started.'}
                    </TableCell>
                  </TableRow>
                ) : users.map((user, index) => (
                  <TableRow key={user._id} className="hover:bg-stone-50">
                    <TableCell className="!border-stone-300 !px-4 !py-3 !text-sm !text-stone-600">{(page - 1) * limit + index + 1}</TableCell>
                    <TableCell className="!border-stone-300 !px-4 !py-3 !text-sm !font-medium !text-stone-800">{user.name}</TableCell>
                    <TableCell className="!border-stone-300 !px-4 !py-3 !text-sm !text-stone-600">{user.email}</TableCell>
                    <TableCell className="!border-stone-300 !px-4 !py-3">
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900">{user.role?.name || 'No Role'}</span>
                    </TableCell>
                    {(permissions.includes('update_user') || permissions.includes('delete_user')) && (
                      <TableCell align="right" className="!border-stone-300 !px-4 !py-3">
                        <div className="flex justify-end gap-2">
                          {permissions.includes('update_user') && <button type="button" onClick={() => openEdit(user)} aria-label={`Edit ${user.name}`} title="Edit" className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-stone-100 text-stone-700 hover:bg-stone-200"><Pencil aria-hidden="true" className="h-4 w-4" /></button>}
                          {permissions.includes('delete_user') && <button type="button" onClick={() => handleDelete(user._id)} aria-label={`Delete ${user.name}`} title="Delete" className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-red-100 text-red-700 hover:bg-red-200"><Trash2 aria-hidden="true" className="h-4 w-4" /></button>}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-stone-600"><label htmlFor="user-page-size">Rows per page</label><FormControl size="small"><Select id="user-page-size" value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1) }} aria-label="Rows per page">{[10, 20, 50, 100].map((size) => <MenuItem key={size} value={size}>{size}</MenuItem>)}</Select></FormControl></div>
            <nav aria-label="User table pagination" className="flex items-center gap-2">
              <button type="button" disabled={page === 1 || listLoading} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
              <span className="min-w-20 text-center text-sm text-stone-600">Page <strong className="text-stone-900">{page}</strong> of {Math.max(1, Math.ceil(total / limit))}</span>
              <button type="button" disabled={page >= Math.ceil(total / limit) || listLoading} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
            </nav>
          </div>
        </div>
      </div>

      {showCreate && (
        <Modal
          title="Create User"
          onClose={closeCreate}
          onSubmit={handleCreate}
          loading={createLoading}
          error={createError}
        >
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={inputClass}
              placeholder="Min 6 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Role</label>
            <select
              required
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className={inputClass}
            >
              <option value="">Select a role</option>
              {roles.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </Modal>
      )}

      {showEdit && (
        <Modal
          title="Edit User"
          onClose={closeEdit}
          onSubmit={handleUpdate}
          loading={updateLoading}
          error={updateError}
        >
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              New Password{' '}
              <span className="text-stone-400 font-normal">(leave blank to keep current)</span>
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={inputClass}
              placeholder="Leave blank to keep"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Role</label>
            <select
              required
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className={inputClass}
            >
              <option value="">Select a role</option>
              {roles.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default UsersScreen
