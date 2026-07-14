import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout';
import { ChatPage } from './pages/Chat';
import { AgentsPage } from './pages/Agents';
import { PluginsPage } from './pages/Plugins';
import { SettingsPage } from './pages/Settings';
import { LoginPage } from './pages/Login';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/chat" replace />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="agents" element={<AgentsPage />} />
        <Route path="plugins" element={<PluginsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
