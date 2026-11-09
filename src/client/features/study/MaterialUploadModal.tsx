import { useEffect, useState } from 'react';
import { Button } from '@client/components/ui/Button';
import { Input } from '@client/components/ui/Input';
import { Modal } from '@client/components/ui/Modal';
import { Select } from '@client/components/ui/Select';
import type { Subject } from '@shared/types';

export function MaterialUploadModal({
  open,
  onClose,
  subjects,
  defaultSubjectId,
  onUpload,
}: {
  open: boolean;
  onClose: () => void;
  subjects: Subject[];
  defaultSubjectId?: string;
  onUpload: (form: FormData) => Promise<unknown>;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('not_started');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFiles([]);
    setSubjectId(defaultSubjectId ?? '');
    setTags('');
    setStatus('not_started');
  }, [open, defaultSubjectId]);

  const upload = async () => {
    if (files.length === 0) return;
    setUploading(true);

    try {
      const form = new FormData();
      form.append('subjectId', subjectId);
      form.append('tags', tags);
      form.append('status', status);
      for (const file of files) form.append('files', file, file.name);

      await onUpload(form);
      onClose();
    } catch {
      // The mutation reports through the page-level toast layer.
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="上传文件资料">
      <div className="space-y-3">
        <input
          type="file"
          multiple
          onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          className="block w-full text-sm text-muted"
        />
        {files.length > 0 ? (
          <ul className="space-y-1 text-xs text-muted">
            {files.map((file) => (
              <li key={file.name}>{file.name}</li>
            ))}
          </ul>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="material-upload-subject" className="text-sm text-muted">
              科目
            </label>
            <Select
              id="material-upload-subject"
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
            <label htmlFor="material-upload-tags" className="text-sm text-muted">
              标签
            </label>
            <Input
              id="material-upload-tags"
              className="mt-1"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="用逗号分隔"
            />
          </div>
        </div>

        <div>
          <label htmlFor="material-upload-status" className="text-sm text-muted">
            状态
          </label>
          <Select
            id="material-upload-status"
            className="mt-1"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="not_started">未开始</option>
            <option value="learning">学习中</option>
            <option value="completed">已完成</option>
          </Select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={upload} disabled={files.length === 0 || uploading}>
            {uploading ? '上传中…' : '上传'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
