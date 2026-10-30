import { apiClient, request } from './apiClient'

export async function downloadFile(path, params, fallbackName = 'download') {
  const response = await apiClient.get(path, { params, responseType: 'blob' })
  const disposition = response.headers['content-disposition'] || ''
  const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i)
  const filename = match ? decodeURIComponent(match[1]) : fallbackName
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const authApi = {
  login: (login, password) => request('post', '/login', { body: { login, password } }),
  logout: () => request('post', '/logout'),
  me: () => request('get', '/user'),
  updateProfile: (body) => request('put', '/profile', { body }),
}

export const dashboardApi = {
  get: () => request('get', '/dashboard'),
  search: (q) => request('get', '/search', { params: { q } }),
}

export const notificationsApi = {
  list: () => request('get', '/notifications'),
  markRead: () => request('post', '/notifications/read'),
  markOneRead: (id) => request('post', `/notifications/${id}/read`),
}

export const catalogApi = {
  departments: () => request('get', '/departments'),
  clinics: () => request('get', '/clinics'),
  rejectionReasons: (appliesTo) => request('get', '/rejection-reasons', { params: appliesTo ? { applies_to: appliesTo } : undefined }),
}

export const visitorsApi = {
  list: (params) => request('get', '/visitors', { params }),
  getPass: (id) => request('get', `/visitors/${id}/pass`),
  scans: (id) => request('get', `/visitors/${id}/scans`),
  create: (body) => request('post', '/visitors', { body }),
  approve: (id, remarks) => request('post', `/visitors/${id}/approve`, { body: { remarks } }),
  reject: (id, body) => request('post', `/visitors/${id}/reject`, { body }),
  scanToken: (token) => request('post', '/visitor-passes/scan', { body: { token } }),
  manualScan: (id) => request('post', `/visitors/${id}/scan`),
  gateReject: (id, body) => request('post', `/visitors/${id}/gate-reject`, { body }),
  cancel: (id) => request('post', `/visitors/${id}/cancel`),
  inpatients: (params) => request('get', '/inpatients', { params }),
}

export const patientsApi = {
  list: (params) => request('get', '/patients', { params }),
  get: (id) => request('get', `/patients/${id}`),
  create: (body) => request('post', '/patients', { body }),
  update: (id, body) => request('put', `/patients/${id}`, { body }),
  opdList: (params) => request('get', '/opd-registrations', { params }),
  registerOpd: (body) => request('post', '/opd-registrations', { body }),
  triage: (encounterId, body) => request('post', `/opd-encounters/${encounterId}/triage`, { body }),
}

export const queuesApi = {
  list: (params) => request('get', '/queues', { params }),
  call: (id) => request('post', `/queues/${id}/call`),
  serve: (id) => request('post', `/queues/${id}/serve`),
  done: (id) => request('post', `/queues/${id}/done`),
  skip: (id) => request('post', `/queues/${id}/skip`),
  cancel: (id) => request('post', `/queues/${id}/cancel`),
  undo: (id) => request('post', `/queues/${id}/undo`),
}

export const doctorsApi = {
  list: (params) => request('get', '/doctors', { params }),
  assignableUsers: () => request('get', '/doctors/assignable-users'),
  create: (body) => request('post', '/doctors', { body }),
  update: (id, body) => request('put', `/doctors/${id}`, { body }),
}

export const bedsApi = {
  list: (params) => request('get', '/beds', { params }),
  wards: () => request('get', '/wards'),
  events: (params) => request('get', '/bed-events', { params }),
  reserve: (id, body) => request('post', `/beds/${id}/reserve`, { body }),
  setStatus: (id, body) => request('post', `/beds/${id}/status`, { body }),
}

export const admissionsApi = {
  list: (params) => request('get', '/admissions', { params }),
  create: (body) => request('post', '/admissions', { body }),
  assign: (id, bedId) => request('post', `/admissions/${id}/assign`, { body: { bed_id: bedId } }),
  discharge: (id, body) => request('post', `/admissions/${id}/discharge`, { body }),
  undo: (id) => request('post', `/admissions/${id}/undo`),
}

export const vehiclesApi = {
  list: (params) => request('get', '/vehicles', { params }),
  create: (body) => request('post', '/vehicles', { body }),
  exit: (id) => request('post', `/vehicles/${id}/exit`),
}

export const parkingApi = {
  list: (params) => request('get', '/parking-areas', { params }),
  create: (body) => request('post', '/parking-areas', { body }),
  update: (id, body) => request('put', `/parking-areas/${id}`, { body }),
}

export const usersApi = {
  list: () => request('get', '/users'),
  create: (body) => request('post', '/users', { body }),
  update: (id, body) => request('put', `/users/${id}`, { body }),
}

export const auditApi = {
  list: (params) => request('get', '/audit-logs', { params }),
}

export const reportsApi = {
  summary: () => request('get', '/reports/summary'),
  daily: (date) => request('get', '/reports/daily', { params: { date } }),
  downloadDailyPdf: (type, date) => downloadFile(`/reports/daily/${type}.pdf`, { date }, `lumc-${type}-${date}.pdf`),
  downloadCsv: (dataset, from, to) => downloadFile(`/exports/${dataset}.csv`, { from, to }, `lumc-${dataset}.csv`),
}

export const backupsApi = {
  list: () => request('get', '/backups'),
  create: () => request('post', '/backups'),
  download: (name) => downloadFile(`/backups/${name}`, undefined, name),
}

export const settingsApi = {
  get: () => request('get', '/settings'),
  update: (body) => request('put', '/settings', { body }),
}
