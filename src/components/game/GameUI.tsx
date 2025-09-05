'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { FRUIT_TYPES } from '@/types/game';
import type { GameState, GameStats } from '@/types/game';

interface GameUIProps {
  gameState: GameState;
  gameStats: GameStats;
  onStartGame: () => void;
  onPauseGame: () => void;
  onResetGame: () => void;
}

export const GameUI: React.FC<GameUIProps> = ({
  gameState,
  gameStats,
  onStartGame,
  onPauseGame,
  onResetGame,
}) => {
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatScore = (score: number): string => {
    return score.toLocaleString();
  };

  const getMaxFruitName = (): string => {
    const fruitType = FRUIT_TYPES.find(ft => ft.id === gameStats.maxFruitReached);
    return fruitType ? `${fruitType.emoji} ${fruitType.name}` : 'Cherry 🍒';
  };

  const getNextFruitInfo = () => {
    if (!gameState.nextFruitType) return null;
    return {
      name: gameState.nextFruitType.name,
      emoji: gameState.nextFruitType.emoji,
      score: gameState.nextFruitType.score
    };
  };

  const getProgressToNextMilestone = (): { current: number; target: number; percentage: number } => {
    const milestones = [100, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000];
    const nextMilestone = milestones.find(m => m > gameState.score) || milestones[milestones.length - 1];
    const previousMilestone = milestones.filter(m => m < gameState.score).pop() || 0;
    
    const progress = gameState.score - previousMilestone;
    const range = nextMilestone - previousMilestone;
    const percentage = Math.min((progress / range) * 100, 100);
    
    return {
      current: gameState.score,
      target: nextMilestone,
      percentage
    };
  };

  const progress = getProgressToNextMilestone();
  const nextFruit = getNextFruitInfo();

  return (
    <div className="space-y-4">
      {/* Score and Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Score</span>
            <Badge variant={gameState.comboMultiplier > 1 ? "default" : "secondary"}>
              {gameState.comboMultiplier > 1 ? `${gameState.comboMultiplier}x Combo!` : 'No Combo'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-center mb-2">
            {formatScore(gameState.score)}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatScore(progress.current)}</span>
              <span>{formatScore(progress.target)}</span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Game Timer */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-center">
            {formatTime(gameState.elapsedTime)}
          </div>
        </CardContent>
      </Card>

      {/* Next Fruit */}
      {nextFruit && !gameState.isGameOver && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Next Fruit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl mb-2">{nextFruit.emoji}</div>
              <div className="font-semibold">{nextFruit.name}</div>
              <div className="text-sm text-muted-foreground">
                {formatScore(nextFruit.score)} points
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Game Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Fruits Dropped:</span>
              <div className="font-semibold">{gameStats.fruitsDropped}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Total Merges:</span>
              <div className="font-semibold">{gameStats.totalMerges}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Best Combo:</span>
              <div className="font-semibold">{gameStats.longestCombo}x</div>
            </div>
            <div>
              <span className="text-muted-foreground">Perfect Drops:</span>
              <div className="font-semibold">{gameStats.perfectDrops}</div>
            </div>
          </div>
          
          <div className="pt-2 border-t">
            <span className="text-muted-foreground text-sm">Biggest Fruit:</span>
            <div className="font-semibold">{getMaxFruitName()}</div>
          </div>
        </CardContent>
      </Card>

      {/* Game Controls */}
      <div className="space-y-2">
        {!gameState.isPlaying && !gameState.isGameOver && (
          <Button onClick={onStartGame} className="w-full" size="lg">
            Start Game
          </Button>
        )}
        
        {gameState.isPlaying && !gameState.isGameOver && (
          <Button 
            onClick={onPauseGame} 
            variant={gameState.isPaused ? "default" : "secondary"} 
            className="w-full" 
            size="lg"
          >
            {gameState.isPaused ? 'Resume' : 'Pause'}
          </Button>
        )}
        
        {(gameState.isPlaying || gameState.isGameOver) && (
          <Button onClick={onResetGame} variant="outline" className="w-full">
            New Game
          </Button>
        )}
      </div>

      {/* Game Status Messages */}
      {gameState.isPaused && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="text-center text-yellow-800">
              <div className="text-lg font-semibold">Game Paused</div>
              <div className="text-sm">Click Resume to continue</div>
            </div>
          </CardContent>
        </Card>
      )}

      {gameState.isGameOver && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center text-red-800">
              <div className="text-lg font-semibold">Game Over!</div>
              <div className="text-sm">Final Score: {formatScore(gameState.score)}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {!gameState.isPlaying && !gameState.isGameOver && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-center text-blue-800">
              <div className="text-sm font-semibold mb-2">How to Play</div>
              <div className="text-xs space-y-1">
                <div>🖱️ Move mouse to aim, click to drop fruit</div>
                <div>📱 On mobile: tap and drag to aim, release to drop</div>
                <div>🍎 Match 2 identical fruits to merge into a bigger one</div>
                <div>🎯 Create combos for bonus points</div>
                <div>⚠️ Don't let fruits pile up above the red line</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GameUI;