import { useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { APP_NAME } from '@shared/constants';
import { Button } from '../ui/Button';
import { formatDateLabel, todayLocal } from '@client/lib/clientDates';
import { useQuickAdd } from '@client/hooks/useQuickAdd';

const titles: Record<string, string> = {
  '/': '首页',
  '/today': '今日计划',
  '/study/subjects': '学习科目',
  '/study/materials': '学习资料',
  '/fitness': '健身计划',
  '/diet': '饮食计划',
  '/games': '游戏娱乐',
  '/settings': '数据与设置',
};

export function TopBar() {
  const { pathname } = useLocation();
  const { openMenu } = useQuickAdd();
  const title = titles[pathname] ?? APP_NAME;

  useEffect(() => {
    document.title =
      title === APP_NAME ? APP_NAME : `${title} · ${APP_NAME}`;
  }, [title]);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-surface/80 px-6 backdrop-blur">
      <h1 className="text-lg font-semibold text-ink">{title}</h1>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted">{formatDateLabel(todayLocal())}</span>
        <Button size="sm" variant="secondary" onClick={openMenu}>
          <Plus size={16} />
          快速添加
        </Button>
      </div>
    </header>
  );
}
