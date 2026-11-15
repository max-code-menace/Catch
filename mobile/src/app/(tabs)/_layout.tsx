import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';

import { ONGLETS, TabBar } from '@/components/tab-bar';

export default function TabsLayout() {
  return (
    <Tabs>
      <TabSlot />
      <TabBar />
      {/* Liste cachée : elle déclare les 4 onglets, la vraie barre est TabBar. */}
      <TabList style={{ display: 'none' }}>
        {ONGLETS.map((o) => (
          <TabTrigger key={o.name} name={o.name} href={o.href} />
        ))}
      </TabList>
    </Tabs>
  );
}
