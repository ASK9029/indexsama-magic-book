import { NavLink } from 'react-router-dom';
import { cn } from '@client/lib/cn';

const groups = [
  {
    label: '总览',
    items: [
      { to: '/', label: '首页' },
      { to: '/today', label: '今日计划' },
    ],
  },
  {
    label: '学习',
    items: [
      { to: '/study/subjects', label: '学习科目' },
      { to: '/study/materials', label: '学习资料' },
    ],
  },
  {
    label: '生活',
    items: [
      { to: '/fitness', label: '健身计划' },
      { to: '/diet', label: '饮食计划' },
      { to: '/games', label: '游戏娱乐' },
    ],
  },
  {
    label: '系统',
    items: [{ to: '/settings', label: '数据与设置' }],
  },
];

export function Sidebar() {
  return (
    <aside className="flex h-screen w-[232px] shrink-0 flex-col border-r border-line bg-[var(--sidebar)] px-4 py-5">
      <div className="mb-6 px-2 text-lg font-semibold tracking-wide">我的生活</div>

      <nav className="flex-1 space-y-5 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="mb-2 px-2 text-xs font-medium tracking-wider text-muted">
              {group.label}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-[10px] px-3 py-2 text-sm text-muted transition hover:bg-canvas hover:text-ink',
                      isActive && 'bg-accent/10 font-medium text-accent',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-4 rounded-[10px] border border-line bg-surface/60 px-3 py-2 text-xs text-muted">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          数据已保存在本机
        </div>
        <div className="mt-1">尚未备份</div>
      </div>
    </aside>
  );
}
