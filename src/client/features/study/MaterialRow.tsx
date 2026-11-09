import { Link } from 'react-router-dom';
import { FileText, Link2, StickyNote } from 'lucide-react';
import type { Material } from '@shared/types';

const statusLabels: Record<Material['status'], string> = {
  not_started: '未开始',
  learning: '学习中',
  completed: '已完成',
};

const typeLabels: Record<Material['type'], string> = {
  link: '链接',
  note: '笔记',
  file: '文件',
};

export function MaterialRow({
  material,
  subjectName,
}: {
  material: Material;
  subjectName?: string;
}) {
  const Icon =
    material.type === 'link'
      ? Link2
      : material.type === 'note'
        ? StickyNote
        : FileText;

  return (
    <Link
      to={`/study/materials/${material.id}`}
      className="flex items-start gap-3 rounded-card border border-line bg-surface p-3 transition hover:border-accent/40"
    >
      <Icon size={18} className="mt-0.5 shrink-0 text-muted" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium text-ink">
            {material.title}
          </span>
          {subjectName ? (
            <span className="rounded bg-canvas px-1.5 py-0.5 text-xs text-muted">
              {subjectName}
            </span>
          ) : null}
          <span className="text-xs text-muted">{statusLabels[material.status]}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
          <span>{typeLabels[material.type]}</span>
          {material.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
          <span>{new Date(material.updatedAt).toLocaleDateString('zh-CN')}</span>
        </div>
        {material.type !== 'note' ? (
          <div className="mt-2 h-1 rounded bg-line">
            <div
              className="h-1 rounded bg-accent"
              style={{ width: `${material.progress}%` }}
            />
          </div>
        ) : null}
      </div>
    </Link>
  );
}
