import { useEffect, useState } from 'react';

export function ServiceBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener('api:online', onOnline);
    window.addEventListener('api:offline', onOffline);
    return () => {
      window.removeEventListener('api:online', onOnline);
      window.removeEventListener('api:offline', onOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="border-b border-amber-300 bg-amber-50 px-6 py-2 text-sm text-amber-900">
      本地服务已断开，请重新双击启动图标。
    </div>
  );
}
