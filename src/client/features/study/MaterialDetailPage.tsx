import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiPatch } from '@client/api/client';
import { queryKeys } from '@client/api/queryKeys';
import { Button } from '@client/components/ui/Button';
import { Card } from '@client/components/ui/Card';
import { EmptyState } from '@client/components/ui/EmptyState';
import { Input } from '@client/components/ui/Input';
import { PageHeader } from '@client/components/ui/PageHeader';
import { Select } from '@client/components/ui/Select';
import { Textarea } from '@client/components/ui/Textarea';
import { useConfirm } from '@client/components/ui/Confirm';
import { useMaterial } from '@client/hooks/useMaterials';
import { useStudyTimer } from '@client/hooks/useStudyTimer';
import { useSubjects } from '@client/hooks/useSubjects';
import { formatMinutes } from '@shared/format';
import type { Material } from '@shared/types';

const typeLabels: Record<Material['type'], string> = {
  link: '链接资料',
  note: '笔记',
  file: '本地文件',
};

const statusLabels: Record<Material['status'], string> = {
  not_started: '未开始',
  learning: '学习中',
  completed: '已完成',
};

export function MaterialDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const { start } = useStudyTimer();
  const { data: material, isLoading } = useMaterial(id);
  const { subjects } = useSubjects(false);

  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const loaded = useRef<string | null>(null);

  const update = useMutation({
    mutationFn: (patch: Partial<Material>) =>
      apiPatch<Material>(`/api/materials/${id}`, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.material(id) });
      void queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });

  const remove = useMutation({
    mutationFn: () => apiDelete<{ ok: true }>(`/api/materials/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['materials'] });
      navigate('/study/materials');
    },
  });

  useEffect(() => {
    if (!material) return;
    if (loaded.current === material.id) return;
    loaded.current = material.id;
    setNoteTitle(material.title);
    setNoteBody(material.body);
  }, [material]);

  useEffect(() => {
    if (!material || material.type !== 'note') return;
    if (noteTitle === material.title && noteBody === material.body) return;

    const timer = window.setTimeout(() => {
      update.mutate({ title: noteTitle, body: noteBody });
    }, 500);

    return () => window.clearTimeout(timer);
  }, [noteTitle, noteBody, material, update]);

  if (isLoading) {
    return <p className="text-sm text-muted">正在加载…</p>;
  }

  if (!material) {
    return (
      <div>
        <Link to="/study/materials" className="text-sm text-accent">
          ← 返回资料
        </Link>
        <div className="mt-4">
          <EmptyState title="资料不存在" description="它可能已经被删除。" />
        </div>
      </div>
    );
  }

  const isNote = material.type === 'note';
  const subjectName = subjects.find(
    (subject) => subject.id === material.subjectId,
  )?.name;
  const extension = material.title.split('.').pop()?.toLowerCase() ?? '';
  const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(extension);

  const handleDelete = async () => {
    const ok = await confirm({
      title: '删除资料',
      description: '删除后无法恢复。',
      confirmText: '删除',
      danger: true,
    });
    if (ok) remove.mutate();
  };

  return (
    <div>
      <div className="mb-3">
        <Link to="/study/materials" className="text-sm text-accent">
          ← 返回资料
        </Link>
      </div>

      <PageHeader
        title={isNote ? '编辑笔记' : material.title}
        subtitle={typeLabels[material.type]}
        action={
          <Button
            onClick={() =>
              material.subjectId && start(material.subjectId, material.id)
            }
            disabled={!material.subjectId}
          >
            开始学习
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {material.type === 'link' ? (
            <Card>
              <a
                href={material.url ?? '#'}
                target="_blank"
                rel="noreferrer"
                className="break-all text-sm text-accent"
              >
                {material.url}
              </a>
              <p className="mt-3 whitespace-pre-wrap text-sm text-ink">
                {material.excerpt || '还没有摘录。'}
              </p>
            </Card>
          ) : isNote ? (
            <Card>
              <Input
                value={noteTitle}
                onChange={(event) => setNoteTitle(event.target.value)}
                className="border-0 px-0 text-lg font-semibold focus:border-0"
              />
              <Textarea
                value={noteBody}
                onChange={(event) => setNoteBody(event.target.value)}
                className="mt-3 border-0 px-0 focus:border-0"
                rows={18}
                placeholder="开始写…"
              />
              <p className="mt-2 text-xs text-muted">
                {noteBody.length} 字 · 自动保存
              </p>
            </Card>
          ) : (
            <Card>
              {material.fileMissing ? (
                <p className="text-sm text-amber-700">
                  文件丢失 [重新上传]
                </p>
              ) : extension === 'pdf' ? (
                <iframe
                  src={`/api/files/${material.fileId}?mode=inline`}
                  title={material.title}
                  className="h-[60vh] w-full rounded"
                />
              ) : isImage ? (
                <img
                  src={`/api/files/${material.fileId}?mode=inline`}
                  alt={material.title}
                  className="max-h-[60vh] w-full object-contain"
                />
              ) : (
                <a
                  href={`/api/files/${material.fileId}?mode=attachment`}
                  className="text-sm text-accent"
                >
                  打开 / 下载文件
                </a>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <h2 className="text-base font-medium text-ink">资料信息</h2>
            <div className="mt-3 space-y-2 text-sm text-muted">
              <p>类型：{typeLabels[material.type]}</p>
              <p>科目：{subjectName ?? '未指定'}</p>
              <p>累计学习：{formatMinutes(material.totalStudyMinutes)}</p>
              <p>更新时间：{material.updatedAt.slice(0, 10)}</p>
              <p>标签：{material.tags.length > 0 ? material.tags.join('、') : '无'}</p>
            </div>

            {!isNote ? (
              <div className="mt-4 space-y-3">
                <div>
                  <label htmlFor="material-status" className="text-xs text-muted">
                    状态
                  </label>
                  <Select
                    id="material-status"
                    className="mt-1"
                    value={material.status}
                    onChange={(event) =>
                      update.mutate({
                        status: event.target.value as Material['status'],
                      })
                    }
                  >
                    <option value="not_started">未开始</option>
                    <option value="learning">学习中</option>
                    <option value="completed">已完成</option>
                  </Select>
                </div>
                <div>
                  <label htmlFor="material-progress" className="text-xs text-muted">
                    进度（%）
                  </label>
                  <Input
                    id="material-progress"
                    className="mt-1"
                    type="number"
                    min={0}
                    max={100}
                    value={material.progress}
                    onChange={(event) =>
                      update.mutate({
                        progress: Math.max(
                          0,
                          Math.min(100, Number(event.target.value) || 0),
                        ),
                      })
                    }
                  />
                </div>
              </div>
            ) : null}

            <div className="mt-4">
              <Button variant="danger" size="sm" onClick={() => void handleDelete()}>
                删除资料
              </Button>
            </div>
          </Card>

          <Card>
            <h2 className="text-base font-medium text-ink">状态</h2>
            <p className="mt-2 text-sm text-muted">
              {isNote ? '笔记没有状态和进度。' : statusLabels[material.status]}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
