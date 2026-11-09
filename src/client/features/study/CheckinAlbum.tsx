import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGet } from '@client/api/client';
import { queryKeys } from '@client/api/queryKeys';
import { Card } from '@client/components/ui/Card';
import { todayLocal } from '@client/lib/clientDates';
import type { CheckinPhoto, CheckinSummary } from '@shared/types';
import { CheckinLightbox } from './CheckinLightbox';
import { CheckinUploader } from './CheckinUploader';

export function CheckinAlbum({ subjectId }: { subjectId: string }) {
  const [date, setDate] = useState(todayLocal());
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.checkins(subjectId),
    queryFn: () =>
      apiGet<CheckinSummary>(`/api/subjects/${subjectId}/checkins`),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ ok: true }>(`/api/checkins/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.checkins(subjectId),
      });
    },
  });

  const photos = data?.photos ?? [];
  const dates = [...new Set(photos.map((photo) => photo.date))];
  const byDate = new Map<string, CheckinPhoto[]>();
  for (const photo of photos) {
    const list = byDate.get(photo.date) ?? [];
    list.push(photo);
    byDate.set(photo.date, list);
  }

  const deletePhoto = async (photo: CheckinPhoto) => {
    await remove.mutateAsync(photo.id);
    setLightboxIndex(null);
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-medium text-ink">打卡相册</h2>
        <span className="text-xs text-muted">
          {data?.days ?? 0} 天 · {data?.totalPhotos ?? 0} 张
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="checkin-date" className="text-xs text-muted">
            打卡日期
          </label>
          <input
            id="checkin-date"
            type="date"
            max={todayLocal()}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="mt-1 block h-9 rounded-[10px] border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-accent"
          />
        </div>
        <CheckinUploader subjectId={subjectId} date={date} />
      </div>

      {isLoading ? (
        <p className="mt-3 text-sm text-muted">正在加载…</p>
      ) : photos.length === 0 ? (
        <p className="mt-3 text-sm text-muted">还没有打卡照片。</p>
      ) : (
        <div className="mt-4 space-y-4">
          {dates.map((day) => {
            const list = byDate.get(day)!;
            return (
              <div key={day}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-ink">{day}</h3>
                  <span className="text-xs text-muted">{list.length} 张</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex(
                      photos.findIndex((photo) => photo.id === list[0].id),
                    )
                  }
                  className="mt-2 overflow-hidden rounded-[10px]"
                >
                  <img
                    src={`/api/files/${list[0].fileId}`}
                    alt={`${day} 打卡封面`}
                    className="h-24 w-24 object-cover"
                  />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <CheckinLightbox
        open={lightboxIndex !== null}
        photos={photos}
        index={lightboxIndex ?? 0}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
        onDelete={(photo) => void deletePhoto(photo)}
      />
    </Card>
  );
}
