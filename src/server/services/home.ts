import type { DatabaseSync } from 'node:sqlite';
import type { HomeAggregate, HomeItem, Meal } from '@shared/types';
import { gameStats } from '../repositories/games';
import { listMemos } from '../repositories/memos';
import { getSubject } from '../repositories/subjects';
import { getDay } from './day';

const MEAL_LABELS: Record<Meal, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
};

export function getHome(db: DatabaseSync, date: string): HomeAggregate {
  const day = getDay(db, date);
  const items: HomeItem[] = [];

  for (const task of day.tasks) {
    items.push({
      id: `task-${task.id}`,
      group: 'task',
      title: task.title,
      subtitle: `${task.category} · ${task.priority}`,
      done: task.done,
      href: '/today',
    });
  }

  for (const arrangement of day.study.arrangements) {
    const subject = getSubject(db, arrangement.subjectId);
    items.push({
      id: `study-${arrangement.id}`,
      group: 'study',
      title: arrangement.content,
      subtitle: `${subject?.name ?? '学习'} · ${arrangement.plannedMinutes} 分钟`,
      done: arrangement.done,
      href: '/study/subjects',
    });
  }

  if (
    day.fitness.session ||
    (day.fitness.plan && !day.fitness.plan.isRest && day.fitness.plan.exercises.length > 0)
  ) {
    const session = day.fitness.session;
    items.push({
      id: `fitness-${session?.id ?? 'plan'}`,
      group: 'fitness',
      title: session?.name ?? day.fitness.plan?.name ?? '今日训练',
      subtitle: session
        ? `${session.durationMinutes ?? 0} 分钟`
        : '今日训练',
      done: session?.status === 'completed',
      href: '/fitness?tab=today',
    });
  }

  for (const meal of day.diet.meals.filter((item) => item.planned)) {
    items.push({
      id: `diet-${meal.meal}`,
      group: 'diet',
      title: MEAL_LABELS[meal.meal],
      subtitle: `计划 ${Math.round(meal.plannedCalories)} kcal`,
      done: meal.done,
      href: '/diet',
    });
  }

  const studyMinutes = day.study.arrangements.reduce(
    (sum, arrangement) => sum + arrangement.actualMinutes,
    0,
  );

  return {
    date,
    progress: day.progress,
    items: items.slice(0, 5),
    memos: listMemos(db),
    studySummary: {
      minutes: studyMinutes,
      arrangements: day.study.arrangements.length,
    },
    fitnessSummary: {
      planName: day.fitness.plan?.name || null,
      completed: day.fitness.session?.status === 'completed',
      minutes: day.fitness.session?.durationMinutes ?? 0,
    },
    dietSummary: day.diet.summary,
    gameSummary: gameStats(db),
  };
}
