import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiUpload,
} from '@client/api/client';
import { queryKeys } from '@client/api/queryKeys';
import type { Material } from '@shared/types';

export interface MaterialFiltersValue {
  q?: string;
  subjectId?: string;
  type?: string;
  status?: string;
  sort?: string;
}

export interface MaterialDetail extends Material {
  totalStudyMinutes: number;
  fileMissing: boolean;
}

export interface MaterialLinkInput {
  url: string;
  title: string;
  subjectId?: string | null;
  tags?: string[];
  excerpt?: string;
}

export interface MaterialNoteInput {
  title: string;
  body: string;
  subjectId?: string | null;
  tags?: string[];
}

export function useMaterials(filters: MaterialFiltersValue) {
  const queryClient = useQueryClient();
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const queryString = params.toString();

  const query = useQuery({
    queryKey: queryKeys.materials(
      filters as Record<string, string | undefined>,
    ),
    queryFn: () =>
      apiGet<Material[]>(
        `/api/materials${queryString ? `?${queryString}` : ''}`,
      ),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['materials'] });
  };

  const createLink = useMutation({
    mutationFn: (input: MaterialLinkInput) =>
      apiPost<Material>('/api/materials/link', input),
    onSuccess: invalidate,
  });

  const createNote = useMutation({
    mutationFn: (input: MaterialNoteInput) =>
      apiPost<Material>('/api/materials/note', input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Material> }) =>
      apiPatch<Material>(`/api/materials/${id}`, patch),
    onSuccess: (data) => {
      invalidate();
      void queryClient.invalidateQueries({
        queryKey: queryKeys.material(data.id),
      });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ ok: true }>(`/api/materials/${id}`),
    onSuccess: invalidate,
  });

  const upload = useMutation({
    mutationFn: (form: FormData) =>
      apiUpload<Material[]>('/api/materials/files', form),
    onSuccess: invalidate,
  });

  return {
    materials: query.data ?? [],
    isLoading: query.isLoading,
    createLink,
    createNote,
    update,
    remove,
    upload,
  };
}

export function useMaterial(id: string) {
  return useQuery({
    queryKey: queryKeys.material(id),
    queryFn: () => apiGet<MaterialDetail>(`/api/materials/${id}`),
  });
}
