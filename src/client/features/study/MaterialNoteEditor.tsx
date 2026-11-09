import { useEffect, useState } from 'react';
import { Button } from '@client/components/ui/Button';
import { Input } from '@client/components/ui/Input';
import { Modal } from '@client/components/ui/Modal';
import { Select } from '@client/components/ui/Select';
import { Textarea } from '@client/components/ui/Textarea';
import type { MaterialNoteInput } from '@client/hooks/useMaterials';
import type { Subject } from '@shared/types';

export function MaterialNoteEditor({
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
  onSave: (input: MaterialNoteInput) => void;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (!open) return;
    setTitle('');
    setBody('');
    setSubjectId(defaultSubjectId ?? '');
    setTags('');
  }, [open, defaultSubjectId]);

  const submit = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      body,
      subjectId: subjectId || null,
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="新建笔记">
      <div className="space-y-3">
        <div>
          <label htmlFor="material-note-title" className="text-sm text-muted">
            标题
          </label>
          <Input
            id="material-note-title"
            className="mt-1"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="material-note-body" className="text-sm text-muted">
            正文
          </label>
          <Textarea
            id="material-note-body"
            className="mt-1"
            rows={8}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="material-note-subject" className="text-sm text-muted">
              科目
            </label>
            <Select
              id="material-note-subject"
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
            <label htmlFor="material-note-tags" className="text-sm text-muted">
              标签
            </label>
            <Input
              id="material-note-tags"
              className="mt-1"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="用逗号分隔"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={submit} disabled={!title.trim()}>
            保存
          </Button>
        </div>
      </div>
    </Modal>
  );
}
