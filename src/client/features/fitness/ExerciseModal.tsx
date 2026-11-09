import { useEffect, useState } from 'react';
import { Button } from '@client/components/ui/Button';
import { Input } from '@client/components/ui/Input';
import { Modal } from '@client/components/ui/Modal';
import { Select } from '@client/components/ui/Select';
import { Textarea } from '@client/components/ui/Textarea';
import type { ExerciseInput } from '@client/hooks/useExercises';
import type { Exercise } from '@shared/types';

const GROUPS = ['胸', '背', '腿', '肩', '手臂', '核心', '全身'];
const EQUIPMENT = ['杠铃', '哑铃', '器械', '绳索', '自重', '其他'];

export function ExerciseModal({
  open,
  onClose,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Exercise | null;
  onSave: (input: ExerciseInput) => void;
}) {
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('胸');
  const [equipment, setEquipment] = useState('杠铃');
  const [type, setType] = useState<'weight' | 'bodyweight'>('weight');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setMuscleGroup(initial?.muscleGroup ?? '胸');
    setEquipment(initial?.equipment ?? '杠铃');
    setType(initial?.type ?? 'weight');
    setNotes(initial?.notes ?? '');
  }, [open, initial]);

  const submit = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      muscleGroup,
      equipment,
      type,
      notes,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? '编辑动作' : '新增动作'}>
      <div className="space-y-3">
        <div>
          <label htmlFor="exercise-name" className="text-sm text-muted">
            名称
          </label>
          <Input
            id="exercise-name"
            className="mt-1"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="exercise-group" className="text-sm text-muted">
              部位
            </label>
            <Select
              id="exercise-group"
              className="mt-1"
              value={muscleGroup}
              onChange={(event) => setMuscleGroup(event.target.value)}
            >
              {GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="exercise-equipment" className="text-sm text-muted">
              器械
            </label>
            <Select
              id="exercise-equipment"
              className="mt-1"
              value={equipment}
              onChange={(event) => setEquipment(event.target.value)}
            >
              {EQUIPMENT.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="exercise-type" className="text-sm text-muted">
              类型
            </label>
            <Select
              id="exercise-type"
              className="mt-1"
              value={type}
              onChange={(event) =>
                setType(event.target.value as 'weight' | 'bodyweight')
              }
            >
              <option value="weight">重量</option>
              <option value="bodyweight">徒手</option>
            </Select>
          </div>
        </div>
        <div>
          <label htmlFor="exercise-notes" className="text-sm text-muted">
            备注
          </label>
          <Textarea
            id="exercise-notes"
            className="mt-1"
            rows={2}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={submit} disabled={!name.trim()}>
            保存
          </Button>
        </div>
      </div>
    </Modal>
  );
}
