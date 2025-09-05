export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export interface FruitType {
  id: number;
  name: string;
  radius: number;
  color: string;
  score: number;
  emoji: string;
  nextFruitId?: number;
}

export interface Fruit {
  id: string;
  typeId: number;
  position: Position;
  velocity: Velocity;
  radius: number;
  color: string;
  isFalling: boolean;
  isStatic: boolean;
  matterBody: any; // Physics body reference
  createdAt: number;
}

export interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  score: number;
  startTime: number;
  elapsedTime: number;
  fruits: Fruit[];
  nextFruitType: FruitType;
  comboMultiplier: number;
  lastMergeTime: number;
}

export interface GameConfig {
  canvasWidth: number;
  canvasHeight: number;
  gameAreaWidth: number;
  gameAreaHeight: number;
  dropZoneHeight: number;
  gravity: number;
  restitution: number;
  frictionAir: number;
  maxFruits: number;
  gameOverThreshold: number;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  timeElapsed: number;
  date: string;
  fruitsCreated: number;
  maxFruitReached: number;
}

export interface GameStats {
  fruitsDropped: number;
  fruitsCreated: number;
  totalMerges: number;
  longestCombo: number;
  maxFruitReached: number;
  perfectDrops: number;
}

export interface GameEvents {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number, stats: GameStats) => void;
  onMerge: (fruit1: Fruit, fruit2: Fruit, newFruit: Fruit) => void;
  onDrop: (fruit: Fruit) => void;
  onCombo: (multiplier: number) => void;
}

export interface ParticleEffect {
  id: string;
  position: Position;
  velocity: Velocity;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'merge' | 'score' | 'combo';
}

export interface TouchInput {
  isActive: boolean;
  startPosition: Position;
  currentPosition: Position;
  dragDistance: number;
}

// Game constants
export const FRUIT_TYPES: FruitType[] = [
  { id: 1, name: 'Cherry', radius: 15, color: '#FF6B6B', score: 10, emoji: '🍒', nextFruitId: 2 },
  { id: 2, name: 'Strawberry', radius: 20, color: '#FF3E41', score: 25, emoji: '🍓', nextFruitId: 3 },
  { id: 3, name: 'Grape', radius: 25, color: '#8E44AD', score: 50, emoji: '🍇', nextFruitId: 4 },
  { id: 4, name: 'Orange', radius: 30, color: '#FF8C42', score: 100, emoji: '🍊', nextFruitId: 5 },
  { id: 5, name: 'Persimmon', radius: 35, color: '#F39C12', score: 200, emoji: '🥭', nextFruitId: 6 },
  { id: 6, name: 'Apple', radius: 40, color: '#E74C3C', score: 400, emoji: '🍎', nextFruitId: 7 },
  { id: 7, name: 'Pear', radius: 45, color: '#2ECC71', score: 800, emoji: '🍐', nextFruitId: 8 },
  { id: 8, name: 'Peach', radius: 50, color: '#FFB3BA', score: 1600, emoji: '🍑', nextFruitId: 9 },
  { id: 9, name: 'Pineapple', radius: 55, color: '#F1C40F', score: 3200, emoji: '🍍', nextFruitId: 10 },
  { id: 10, name: 'Melon', radius: 60, color: '#58D68D', score: 6400, emoji: '🍈', nextFruitId: 11 },
  { id: 11, name: 'Watermelon', radius: 70, color: '#27AE60', score: 12800, emoji: '🍉' }
];

export const GAME_CONFIG: GameConfig = {
  canvasWidth: 400,
  canvasHeight: 600,
  gameAreaWidth: 380,
  gameAreaHeight: 580,
  dropZoneHeight: 100,
  gravity: 0.8,
  restitution: 0.3,
  frictionAir: 0.01,
  maxFruits: 50,
  gameOverThreshold: 50
};