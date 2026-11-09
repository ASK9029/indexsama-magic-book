import { Tabs } from '@client/components/ui/Tabs';

const items = [
  { value: 'today', label: '今日饮食' },
  { value: 'library', label: '食物库' },
  { value: 'stats', label: '统计' },
];

export function DietTabs({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return <Tabs items={items} value={value} onChange={onChange} />;
}
