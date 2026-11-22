import { GameProvider } from "./game/GameProvider";
import { AppShell } from "./components/app/AppShell";

export default function App() {
  return (
    <GameProvider>
      <AppShell />
    </GameProvider>
  );
}
