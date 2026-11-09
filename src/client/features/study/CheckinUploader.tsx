import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiUpload } from '@client/api/client';
import { queryKeys } from '@client/api/queryKeys';
import { Button } from '@client/components/ui/Button';
import { ProgressBar } from '@client/components/ui/ProgressBar';
import { useToast } from '@client/components/ui/Toast';
import { compressImage } from '@client/lib/compressImage';
import type { CheckinPhoto } from '@shared/types';

export function CheckinUploader({
  subjectId,
  date,
}: {
  subjectId: string;
  date: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    setUploading(true);
    setProgress(0);

    try {
      const compressed: File[] = [];
      for (const [index, file] of files.entries()) {
        compressed.push(await compressImage(file));
        setProgress(((index + 1) / (files.length + 1)) * 100);
      }

      const form = new FormData();
      form.append('date', date);
      for (const file of compressed) {
        form.append('files', file, file.name);
      }

      await apiUpload<CheckinPhoto[]>(
        `/api/subjects/${subjectId}/checkins`,
        form,
      );
      setProgress(100);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.checkins(subjectId),
      });
      toast('打卡照片已上传', 'success');
    } catch (error) {
      toast(error instanceof Error ? error.message : '上传失败', 'error');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(event) => void upload(event.target.files)}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? '上传中…' : '选择照片'}
        </Button>
        <span className="text-xs text-muted">支持 JPG/PNG/WebP，自动压缩</span>
      </div>
      {uploading ? <ProgressBar value={progress} /> : null}
    </div>
  );
}
