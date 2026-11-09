import { Button } from '@client/components/ui/Button';
import { Modal } from '@client/components/ui/Modal';
import type { CheckinPhoto } from '@shared/types';

export function CheckinLightbox({
  open,
  photos,
  index,
  onClose,
  onNavigate,
  onDelete,
}: {
  open: boolean;
  photos: CheckinPhoto[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onDelete: (photo: CheckinPhoto) => void;
}) {
  const photo = photos[index];
  if (!open || !photo) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${photo.date} 打卡`}
      className="max-w-3xl"
    >
      <img
        src={`/api/files/${photo.fileId}`}
        alt={photo.date}
        className="max-h-[65vh] w-full object-contain"
      />
      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={index <= 0}
            onClick={() => onNavigate(index - 1)}
          >
            上一张
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={index >= photos.length - 1}
            onClick={() => onNavigate(index + 1)}
          >
            下一张
          </Button>
        </div>
        <Button variant="danger" size="sm" onClick={() => onDelete(photo)}>
          删除
        </Button>
      </div>
      <p className="mt-2 text-center text-xs text-muted">
        {index + 1} / {photos.length}
      </p>
    </Modal>
  );
}
