import { useCallback, useState } from 'react';
import Sidebar from './components/Sidebar/Sidebar.jsx';
import MenuScreen from './components/MenuScreen/MenuScreen.jsx';
import GameScreen from './components/GameScreen/GameScreen.jsx';
import PixelRevealScreen from './components/PixelReveal/PixelRevealScreen.jsx';
import { MODES, isMinigameId } from './utils/constants.js';
import styles from './App.module.css';

const SCREEN = {
  menu: 'menu',
  game: 'game',
};

export default function App() {
  const [screen, setScreen] = useState(SCREEN.menu);
  const [mode, setMode] = useState(MODES.HP);

  const handleStart = useCallback((nextMode) => {
    setMode(nextMode);
    setScreen(SCREEN.game);
  }, []);

  const handleSelectMode = useCallback((nextMode) => {
    setMode(nextMode);
    setScreen(SCREEN.game);
  }, []);

  const handleGoHome = useCallback(() => {
    setScreen(SCREEN.menu);
  }, []);

  const isMinigame = isMinigameId(mode);

  return (
    <div className={styles.layout}>
      <Sidebar
        activeMode={mode}
        onSelectMode={handleSelectMode}
        onHome={handleGoHome}
      />
      <div className={styles.main}>
        {screen === SCREEN.menu ? (
          <MenuScreen onStart={handleStart} />
        ) : isMinigame ? (
          <PixelRevealScreen key={mode} onChangeMode={handleGoHome} />
        ) : (
          <GameScreen
            key={mode}
            mode={mode}
            onChangeMode={handleGoHome}
          />
        )}
      </div>
    </div>
  );
}
