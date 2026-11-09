import type { DatabaseSync } from 'node:sqlite';

export const BUILT_IN_EXERCISES = [
  { id: 'builtin-bench-press', name: '杠铃卧推', muscleGroup: '胸', equipment: '杠铃', type: 'weight', notes: '' },
  { id: 'builtin-incline-db-press', name: '上斜哑铃卧推', muscleGroup: '胸', equipment: '哑铃', type: 'weight', notes: '' },
  { id: 'builtin-pushup', name: '俯卧撑', muscleGroup: '胸', equipment: '自重', type: 'bodyweight', notes: '' },
  { id: 'builtin-pullup', name: '引体向上', muscleGroup: '背', equipment: '自重', type: 'bodyweight', notes: '' },
  { id: 'builtin-barbell-row', name: '杠铃划船', muscleGroup: '背', equipment: '杠铃', type: 'weight', notes: '' },
  { id: 'builtin-lat-pulldown', name: '高位下拉', muscleGroup: '背', equipment: '器械', type: 'weight', notes: '' },
  { id: 'builtin-squat', name: '杠铃深蹲', muscleGroup: '腿', equipment: '杠铃', type: 'weight', notes: '' },
  { id: 'builtin-leg-press', name: '腿举', muscleGroup: '腿', equipment: '器械', type: 'weight', notes: '' },
  { id: 'builtin-bulgarian-split-squat', name: '保加利亚分腿蹲', muscleGroup: '腿', equipment: '哑铃', type: 'weight', notes: '' },
  { id: 'builtin-overhead-press', name: '杠铃肩推', muscleGroup: '肩', equipment: '杠铃', type: 'weight', notes: '' },
  { id: 'builtin-lateral-raise', name: '哑铃侧平举', muscleGroup: '肩', equipment: '哑铃', type: 'weight', notes: '' },
  { id: 'builtin-barbell-curl', name: '杠铃弯举', muscleGroup: '手臂', equipment: '杠铃', type: 'weight', notes: '' },
  { id: 'builtin-triceps-pushdown', name: '绳索下压', muscleGroup: '手臂', equipment: '绳索', type: 'weight', notes: '' },
  { id: 'builtin-plank', name: '平板支撑', muscleGroup: '核心', equipment: '自重', type: 'bodyweight', notes: '按秒计时' },
  { id: 'builtin-crunch', name: '卷腹', muscleGroup: '核心', equipment: '自重', type: 'bodyweight', notes: '' },
  { id: 'builtin-deadlift', name: '杠铃硬拉', muscleGroup: '全身', equipment: '杠铃', type: 'weight', notes: '' },
  { id: 'builtin-kettlebell-swing', name: '壶铃摆荡', muscleGroup: '全身', equipment: '其他', type: 'weight', notes: '可用哑铃替代' },
] as const;

export function seedExercises(db: DatabaseSync): void {
  const insert = db.prepare(
    'INSERT OR IGNORE INTO exercises(id, name, muscle_group, equipment, type, notes, built_in) VALUES (?, ?, ?, ?, ?, ?, 1)',
  );

  for (const exercise of BUILT_IN_EXERCISES) {
    insert.run(
      exercise.id,
      exercise.name,
      exercise.muscleGroup,
      exercise.equipment,
      exercise.type,
      exercise.notes,
    );
  }
}
