import { Tabs } from '@client/components/ui/Tabs';

const items = [
  { value: 'today', label: '今日训练' },
  { value: 'plan', label: '周计划' },
  { value: 'exercises', label: '动作库' },
  { value: 'stats', label: '统计' },
];

export function FitnessTabs({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return <Tabs items={items} value={value} onChange={onChange} />;
}
