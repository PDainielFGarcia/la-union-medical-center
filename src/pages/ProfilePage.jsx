import { useState } from 'react'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Card, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/FormFields'
import { useAuth } from '../auth/AuthContext'
import { ROLE_LABELS } from '../utils/constants'
import { getErrorMessage } from '../utils/errors'

export function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    middle_name: user?.middle_name || '',
    last_name: user?.last_name || '',
    login: user?.login || '',
    contact_number: user?.contact_number || '',
    password: '',
  })
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [saving, setSaving] = useState(false)

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function save(event) {
    event.preventDefault()
    setError('')
    setOk('')
    if (form.contact_number && !/^\d{11}$/.test(form.contact_number)) {
      setError('Contact number must be exactly 11 digits when provided.')
      return
    }
    setSaving(true)
    try {
      const body = {
        first_name: form.first_name,
        middle_name: form.middle_name || null,
        last_name: form.last_name,
        login: form.login,
        contact_number: form.contact_number || null,
      }
      if (form.password) body.password = form.password
      await updateProfile(body)
      setForm((prev) => ({ ...prev, password: '' }))
      setOk('Profile updated.')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Update your name, contact number, and login. Role and office cannot be changed here." />
      <Card className="max-w-xl">
        <CardTitle>Account</CardTitle>
        <p className="text-sm text-slate-500 mb-4">
          Role: {ROLE_LABELS[user?.role] || user?.role}
          {user?.department ? ` · ${user.department}` : ''}
        </p>
        <form className="space-y-3" onSubmit={save}>
          <Input label="First name *" value={form.first_name} onChange={(e) => update('first_name', e.target.value)} required />
          <Input label="Middle name" value={form.middle_name} onChange={(e) => update('middle_name', e.target.value)} />
          <Input label="Last name *" value={form.last_name} onChange={(e) => update('last_name', e.target.value)} required />
          <Input label="Login *" value={form.login} onChange={(e) => update('login', e.target.value)} required />
          <Input label="Contact number (optional, 11 digits)" value={form.contact_number} onChange={(e) => update('contact_number', e.target.value.replace(/\D/g, '').slice(0, 11))} />
          <Input label="New password (leave blank to keep)" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {ok ? <p className="text-sm text-green-700">{ok}</p> : null}
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
        </form>
      </Card>
    </div>
  )
}
