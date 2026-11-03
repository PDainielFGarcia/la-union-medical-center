import { Route, Routes } from 'react-router-dom'
import { GuestRoute, ProtectedRoute } from '../auth/ProtectedRoute'
import { AppLayout } from '../layouts/AppLayout'
import { HomeGate } from '../pages/HomePage'
import { HospitalInfoPage } from '../pages/HospitalInfoPage'
import { LoginPage } from '../pages/LoginPage'
import { DashboardPage } from '../pages/DashboardPage'
import { TriagePage } from '../pages/TriagePage'
import { CurrentVisitorsPage, VisitorApprovalsPage, VisitorHistoryPage, VisitorPassPage, VisitorScanPage } from '../pages/VisitorPages'
import { VisitorRegistrationPage } from '../pages/VisitorRegistrationPage'
import { NurseScreeningPage, OpdRegistrationPage, PatientRecordDetailPage, PatientRecordsPage, PatientRegistrationPage, PatientSearchPage } from '../pages/PatientPages'
import { ClinicQueuesPage, PublicDisplayPage, QueueHistoryPage, QueueMonitorPage } from '../pages/QueuePages'
import { DoctorAvailabilityPage, DoctorListPage } from '../pages/DoctorPages'
import { ProfilePage } from '../pages/ProfilePage'
import { SecurityDashboardPage, SecurityLogsPage, VehiclesPage } from '../pages/SecurityPages'
import { AdmissionsPage, BedAssignmentPage, BedHistoryPage, BedOverviewPage, WardsPage } from '../pages/BedPages'
import { AuditLogsPage, BackupsPage, NotFoundPage, ParkingAreasPage, ReportsPage, SettingsPage, UsersPage } from '../pages/SystemPages'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeGate />} />
      <Route path="/hospital-information" element={<HospitalInfoPage />} />
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/public-display" element={<ProtectedRoute><PublicDisplayPage /></ProtectedRoute>} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/triage" element={<TriagePage />} />
        <Route path="/security" element={<SecurityDashboardPage />} />
        <Route path="/visitors" element={<VisitorRegistrationPage />} />
        <Route path="/scan" element={<VisitorScanPage />} />
        <Route path="/current-visitors" element={<CurrentVisitorsPage />} />
        <Route path="/visitor-approvals" element={<VisitorApprovalsPage />} />
        <Route path="/visitor-history" element={<VisitorHistoryPage />} />
        <Route path="/visitor-pass/:id" element={<VisitorPassPage />} />
        <Route path="/patient-registration" element={<PatientRegistrationPage />} />
        <Route path="/patient-search" element={<PatientSearchPage />} />
        <Route path="/opd-registration" element={<OpdRegistrationPage />} />
        <Route path="/screening" element={<NurseScreeningPage />} />
        <Route path="/patient-records" element={<PatientRecordsPage />} />
        <Route path="/patient-records/:id" element={<PatientRecordDetailPage />} />
        <Route path="/queue-monitor" element={<QueueMonitorPage />} />
        <Route path="/clinic-queues" element={<ClinicQueuesPage />} />
        <Route path="/queue-history" element={<QueueHistoryPage />} />
        <Route path="/doctors" element={<DoctorListPage />} />
        <Route path="/doctor-availability" element={<DoctorAvailabilityPage />} />
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/security-logs" element={<SecurityLogsPage />} />
        <Route path="/bed-overview" element={<BedOverviewPage />} />
        <Route path="/wards" element={<WardsPage />} />
        <Route path="/bed-assignment" element={<BedAssignmentPage />} />
        <Route path="/admissions" element={<AdmissionsPage />} />
        <Route path="/bed-history" element={<BedHistoryPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/backups" element={<BackupsPage />} />
        <Route path="/parking-areas" element={<ParkingAreasPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/audit-logs" element={<AuditLogsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
