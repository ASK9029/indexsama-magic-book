import { Input } from '@client/components/ui/Input';
import { Select } from '@client/components/ui/Select';
import type { MaterialFiltersValue } from '@client/hooks/useMaterials';
import type { Subject } from '@shared/types';

export function MaterialFilters({
  value,
  onChange,
  subjects,
}: {
  value: MaterialFiltersValue;
  onChange: (value: MaterialFiltersValue) => void;
  subjects: Subject[];
}) {
  return (
    <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
      <Input
        placeholder="搜索标题、笔记、标签"
        value={value.q ?? ''}
        onChange={(event) => onChange({ ...value, q: event.target.value })}
      />
      <Select
        value={value.subjectId ?? ''}
        onChange={(event) =>
          onChange({ ...value, subjectId: event.target.value || undefined })
        }
      >
        <option value="">全部科目</option>
        {subjects.map((subject) => (
          <option key={subject.id} value={subject.id}>
            {subject.name}
          </option>
        ))}
      </Select>
      <Select
        value={value.type ?? ''}
        onChange={(event) =>
          onChange({ ...value, type: event.target.value || undefined })
        }
      >
        <option value="">全部类型</option>
        <option value="link">链接</option>
        <option value="note">笔记</option>
        <option value="file">文件</option>
      </Select>
      <Select
        value={value.status ?? ''}
        onChange={(event) =>
          onChange({ ...value, status: event.target.value || undefined })
        }
      >
        <option value="">全部状态</option>
        <option value="not_started">未开始</option>
        <option value="learning">学习中</option>
        <option value="completed">已完成</option>
      </Select>
      <Select
        value={value.sort ?? 'updated'}
        onChange={(event) => onChange({ ...value, sort: event.target.value })}
      >
        <option value="updated">最近更新</option>
        <option value="created">最近添加</option>
        <option value="title">标题</option>
      </Select>
    </div>
  );
}
