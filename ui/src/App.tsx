import { Workspace } from '@/components/workspace/Workspace';
import { SettingsProvider } from '@/contexts/SettingsProvider';

function App() {
  return (
    <SettingsProvider>
      <Workspace />
    </SettingsProvider>
  );
}

export default App;
