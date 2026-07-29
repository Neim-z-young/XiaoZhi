import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { MessageSquare, Bot, Puzzle, Settings, ChevronLeft, ChevronRight, Server, Folder, Wrench, Cpu } from 'lucide-react';

const navItems = [
  { path: '/chat', icon: MessageSquare, label: '对话' },
  { path: '/agents', icon: Bot, label: '智能体' },
  { path: '/plugins', icon: Puzzle, label: '插件' },
  { path: '/mcp-servers', icon: Server, label: 'MCP' },
  { path: '/workspaces', icon: Folder, label: '工作区' },
  { path: '/tools', icon: Wrench, label: '工具' },
  { path: '/models', icon: Cpu, label: '模型' },
  { path: '/settings', icon: Settings, label: '设置' },
];

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-surface">
      {/* 侧边栏 */}
      <aside
        className={`${
          collapsed ? 'w-16' : 'w-56'
        } bg-surface-light border-r border-border flex flex-col transition-all duration-300`}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-border">
          {!collapsed && (
            <span className="text-lg font-bold text-textPrimary">小智</span>
          )}
        </div>

        {/* 导航 */}
        <nav className="flex-1 py-4">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-textSecondary hover:text-textPrimary hover:bg-surface-lighter'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* 折叠按钮 */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="h-12 flex items-center justify-center border-t border-border text-textMuted hover:text-textPrimary hover:bg-surface-lighter transition-colors"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </aside>

      {/* 主内容 */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
