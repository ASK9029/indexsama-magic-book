import { useEffect, useState } from 'react';
import { Button } from '@client/components/ui/Button';
import { Input } from '@client/components/ui/Input';
import { Modal } from '@client/components/ui/Modal';
import { Select } from '@client/components/ui/Select';
import { Textarea } from '@client/components/ui/Textarea';
import type { MaterialLinkInput } from '@client/hooks/useMaterials';
import type { Subject } from '@shared/types';

export function MaterialLinkModal({
  open,
  onClose,
  subjects,
  defaultSubjectId,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  subjects: Subject[];
  defaultSubjectId?: string;
  onSave: (input: MaterialLinkInput) => void;
}) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [tags, setTags] = useState('');
  const [excerpt, setExcerpt] = useState('');

  useEffect(() => {
    if (!open) return;
    setTitle('');
    setUrl('');
    setSubjectId(defaultSubjectId ?? '');
    setTags('');
    setExcerpt('');
  }, [open, defaultSubjectId]);

  const submit = () => {
    if (!title.trim() || !url.trim()) return;
    onSave({
      title: title.trim(),
      url: url.trim(),
      subjectId: subjectId || null,
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      excerpt,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="添加链接资料">
      <div className="space-y-3">
        <div>
          <label htmlFor="material-link-title" className="text-sm text-muted">
            标题
          </label>
          <Input
            id="material-link-title"
            className="mt-1"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="资料标题"
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="material-link-url" className="text-sm text-muted">
            链接
          </label>
          <Input
            id="material-link-url"
            className="mt-1"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://…"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="material-link-subject" className="text-sm text-muted">
              科目
            </label>
            <Select
              id="material-link-subject"
              className="mt-1"
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
            >
              <option value="">不指定</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="material-link-tags" className="text-sm text-muted">
              标签
            </label>
            <Input
              id="material-link-tags"
              className="mt-1"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="用逗号分隔"
            />
          </div>
        </div>
        <div>
          <label htmlFor="material-link-excerpt" className="text-sm text-muted">
            摘录
          </label>
          <Textarea
            id="material-link-excerpt"
            className="mt-1"
            rows={2}
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={submit} disabled={!title.trim() || !url.trim()}>
            保存
          </Button>
        </div>
      </div>
    </Modal>
  );
}
