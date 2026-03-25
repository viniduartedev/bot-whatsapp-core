import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { AppointmentsPage } from './pages/Appointments';
import { ContactsPage } from './pages/Contacts';
import { Dashboard } from './pages/Dashboard';
import { ProjectsPage } from './pages/Projects';
import { Requests } from './pages/Requests';
import { ServiceRequestsPage } from './pages/ServiceRequests';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="service-requests" element={<ServiceRequestsPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="legacy-requests" element={<Requests />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
