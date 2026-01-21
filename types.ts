// The phases of the application
export enum GamePhase {
  INIT = 'INIT', 
  CHECKING_CAMERA = 'CHECKING_CAMERA', 
  LOADING_MODEL = 'LOADING_MODEL', 
  RULES = 'RULES', 
  PLAYING = 'PLAYING', 
  PRACTICE = 'PRACTICE',
  GAME_OVER = 'GAME_OVER', 
}

// The "Reality" mode of the game
export enum RealityMode {
  NORMAL = 'NORMAL', // Head Left = Move Left
  INVERTED = 'INVERTED' // Head Left = Move Right
}

// Game State for the Ref (High frequency)
export interface GameState {
  playerX: number; // 0 to 100
  headX: number; // Raw head input -1 to 1 (0 to 1 normalized)
  headY: number; // Raw head input 0 to 1 normalized (Vertical)
  score: number;
  lives: number; // New: Player lives
  speed: number;
  mode: RealityMode;
  walls: Wall[];
  lastModeSwitchScore: number;
  isGameOver: boolean;
  gameStartTime: number;
  practiceProgress: number; // Total successful dodges in practice
}

export interface Wall {
  id: number;
  y: number; // 0 to 100 (percentage of screen height)
  gapX: number; // 0 to 100 (center of the gap)
  gapWidth: number; // width in percentage
  passed: boolean;
}

export type Language = 'en' | 'zh';