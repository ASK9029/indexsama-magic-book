import { useRef, useState } from 'react';
import { Button } from '@client/components/ui/Button';
import { useGameMutations } from '@client/hooks/useGames';

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const max = 600;
      const scale = Math.min(1, max / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');

      if (!context) {
        URL.revokeObjectURL(url);
        resolve(file);
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          resolve(
            blob ? new File([blob], 'cover.jpg', { type: 'image/jpeg' }) : file,
          );
        },
        'image/jpeg',
        0.85,
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    image.src = url;
  });
}

export function GameCoverUploader({
  gameId,
  hasCover,
}: {
  gameId: string;
  hasCover: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const { uploadCover, removeCover } = useGameMutations();

  const handleFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const compressed = await compressImage(file);
      await uploadCover.mutateAsync({ id: gameId, file: compressed });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
      <Button
        size="sm"
        variant="secondary"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? '上传中…' : hasCover ? '更换封面' : '上传封面'}
      </Button>
      {hasCover ? (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => removeCover.mutate(gameId)}
        >
          删除封面
        </Button>
      ) : null}
    </div>
  );
}
