import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@client/components/ui/Button';
import { EmptyState } from '@client/components/ui/EmptyState';
import { PageHeader } from '@client/components/ui/PageHeader';
import {
  useMaterials,
  type MaterialFiltersValue,
  type MaterialLinkInput,
  type MaterialNoteInput,
} from '@client/hooks/useMaterials';
import { useSubjects } from '@client/hooks/useSubjects';
import { MaterialFilters } from './MaterialFilters';
import { MaterialLinkModal } from './MaterialLinkModal';
import { MaterialNoteEditor } from './MaterialNoteEditor';
import { MaterialRow } from './MaterialRow';
import { MaterialUploadModal } from './MaterialUploadModal';

export function MaterialsPage({
  defaultSubjectId,
  embedded = false,
}: {
  defaultSubjectId?: string;
  embedded?: boolean;
}) {
  const [params, setParams] = useSearchParams();
  const filters: MaterialFiltersValue = {
    q: params.get('q') ?? undefined,
    subjectId: params.get('subjectId') ?? defaultSubjectId,
    type: params.get('type') ?? undefined,
    status: params.get('status') ?? undefined,
    sort: params.get('sort') ?? undefined,
  };

  const { materials, isLoading, createLink, createNote, upload } =
    useMaterials(filters);
  const { subjects } = useSubjects(false);

  const [addOpen, setAddOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const subjectNames = new Map(
    subjects.map((subject) => [subject.id, subject.name]),
  );

  const setFilters = (next: MaterialFiltersValue) => {
    const nextParams = new URLSearchParams(params);
    for (const key of ['q', 'subjectId', 'type', 'status', 'sort'] as const) {
      const value = next[key];
      if (value) nextParams.set(key, value);
      else nextParams.delete(key);
    }
    setParams(nextParams);
  };

  const addMenu = (
    <div className="relative">
      <Button onClick={() => setAddOpen((open) => !open)}>添加资料</Button>
      {addOpen ? (
        <div className="absolute right-0 top-11 z-20 w-28 rounded-[10px] border border-line bg-surface p-1 shadow-lg">
          <button
            type="button"
            className="block w-full rounded px-2 py-1.5 text-left text-sm text-ink hover:bg-canvas"
            onClick={() => {
              setAddOpen(false);
              setLinkOpen(true);
            }}
          >
            链接
          </button>
          <button
            type="button"
            className="block w-full rounded px-2 py-1.5 text-left text-sm text-ink hover:bg-canvas"
            onClick={() => {
              setAddOpen(false);
              setNoteOpen(true);
            }}
          >
            笔记
          </button>
          <button
            type="button"
            className="block w-full rounded px-2 py-1.5 text-left text-sm text-ink hover:bg-canvas"
            onClick={() => {
              setAddOpen(false);
              setUploadOpen(true);
            }}
          >
            文件
          </button>
        </div>
      ) : null}
    </div>
  );

  const saveLink = (input: MaterialLinkInput) => {
    createLink.mutate(input);
    setLinkOpen(false);
  };

  const saveNote = (input: MaterialNoteInput) => {
    createNote.mutate(input);
    setNoteOpen(false);
  };

  return (
    <div>
      {embedded ? (
        <div className="mb-3 flex justify-end">{addMenu}</div>
      ) : (
        <PageHeader
          title="学习资料"
          subtitle="链接、笔记和本地文件"
          action={addMenu}
        />
      )}

      <MaterialFilters value={filters} onChange={setFilters} subjects={subjects} />

      {isLoading ? (
        <p className="text-sm text-muted">正在加载…</p>
      ) : materials.length === 0 ? (
        <EmptyState
          title="资料库为空"
          description="添加一个链接、写一篇笔记，或上传本地文件。"
        />
      ) : (
        <div className="space-y-2">
          {materials.map((material) => (
            <MaterialRow
              key={material.id}
              material={material}
              subjectName={subjectNames.get(material.subjectId ?? '')}
            />
          ))}
        </div>
      )}

      <MaterialLinkModal
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        subjects={subjects}
        defaultSubjectId={defaultSubjectId}
        onSave={saveLink}
      />
      <MaterialNoteEditor
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        subjects={subjects}
        defaultSubjectId={defaultSubjectId}
        onSave={saveNote}
      />
      <MaterialUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        subjects={subjects}
        defaultSubjectId={defaultSubjectId}
        onUpload={(form) => upload.mutateAsync(form)}
      />
    </div>
  );
}
