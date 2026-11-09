export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} 分钟`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} 小时` : `${hours} 小时 ${rest} 分钟`;
}

export function formatWeight(kg: number, unit: 'kg' | 'jin'): string {
  if (unit === 'jin') return `${(kg * 2).toFixed(1)} 斤`;
  return `${kg.toFixed(1)} kg`;
}

export function formatCalories(calories: number): string {
  return `${new Intl.NumberFormat('zh-CN').format(Math.round(calories))} kcal`;
}
