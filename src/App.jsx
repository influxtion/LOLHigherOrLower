import { useCallback, useState } from 'react';
import Sidebar from './components/Sidebar/Sidebar.jsx';
import MenuScreen from './components/MenuScreen/MenuScreen.jsx';
import GameScreen from './components/GameScreen/GameScreen.jsx';
import { MODES } from './utils/constants.js';
import styles from './App.module.css';

/*
 * Three screens — menu, game, and game-over (rendered as an overlay over
 * game). App owns the active screen and the active mode; everything else
 * reads from props.
 */
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
    // Selecting a mode from the sidebar always sends the player into that
    // mode's game, even if they were on the menu. The menu is a discovery
    // layer; the sidebar is the "I know what I want" shortcut.
    setScreen(SCREEN.game);
  }, []);

  const handleGoHome = useCallback(() => {
    setScreen(SCREEN.menu);
  }, []);

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
        ) : (
          <GameScreen
            // Keying on mode forces a fresh game state when the player
            // switches modes mid-game — the old round's score and champions
            // shouldn't bleed into the new mode.
            key={mode}
            mode={mode}
            onChangeMode={handleGoHome}
          />
        )}
      </div>
    </div>
  );
}
