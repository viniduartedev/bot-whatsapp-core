import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { ProjectProvider } from './context/ProjectContext';
import { AppointmentsPage } from './pages/Appointments';
import { ContactsPage } from './pages/Contacts';
import { Dashboard } from './pages/Dashboard';
import { EventsPage } from './pages/Events';
import { IntegrationsPage } from './pages/Integrations';
import { ProjectConnectionsPage } from './pages/ProjectConnections';
import { ProjectsPage } from './pages/Projects';
import { Requests } from './pages/Requests';
import { SettingsPage } from './pages/Settings';
import { ServiceRequestsPage } from './pages/ServiceRequests';

function App() {
  return (
    <BrowserRouter>
      <ProjectProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="integrations" element={<IntegrationsPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="project-connections" element={<ProjectConnectionsPage />} />
            <Route path="contacts" element={<ContactsPage />} />
            <Route path="service-requests" element={<ServiceRequestsPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="legacy-requests" element={<Requests />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ProjectProvider>
    </BrowserRouter>
  );
}

export default App;
