import { Routes, Route, Navigate } from 'react-router-dom';
import { ChatPage } from './pages/Chat';
import { AgentsPage } from './pages/Agents';
import { PluginsPage } from './pages/Plugins';
import { SettingsPage } from './pages/Settings';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/chat" replace />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/agents" element={<AgentsPage />} />
      <Route path="/plugins" element={<PluginsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
}

export default App;
