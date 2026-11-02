import { Shell } from '@/components/Layout/Shell';
import { SettingsProvider } from '@/contexts/SettingsProvider';

function App() {
  return (
    <SettingsProvider>
      <Shell />
    </SettingsProvider>
  );
}

export default App;
