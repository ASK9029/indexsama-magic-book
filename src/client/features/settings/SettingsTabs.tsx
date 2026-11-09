import { Tabs } from '@client/components/ui/Tabs';

const items = [
  { value: 'data', label: '数据' },
  { value: 'appearance', label: '外观' },
  { value: 'preferences', label: '偏好' },
  { value: 'danger', label: '危险区' },
];

export function SettingsTabs({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return <Tabs items={items} value={value} onChange={onChange} />;
}
