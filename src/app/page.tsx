'use client';

import React, { useState, useCallback, useRef } from 'react';
import { GameCanvas, GameCanvasRef } from '@/components/game/GameCanvas';
import { GameUI } from '@/components/game/GameUI';
import { GameOverModal } from '@/components/game/GameOverModal';
import { Leaderboard } from '@/components/leaderboard/Leaderboard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { GameState, GameStats } from '@/types/game';

const INITIAL_GAME_STATE: GameState = {
  isPlaying: false,
  isPaused: false,
  isGameOver: false,
  score: 0,
  startTime: 0,
  elapsedTime: 0,
  fruits: [],
  nextFruitType: { id: 1, name: 'Cherry', radius: 15, color: '#FF6B6B', score: 10, emoji: '🍒', nextFruitId: 2 },
  comboMultiplier: 1,
  lastMergeTime: 0,
};

const INITIAL_GAME_STATS: GameStats = {
  fruitsDropped: 0,
  fruitsCreated: 0,
  totalMerges: 0,
  longestCombo: 1,
  maxFruitReached: 1,
  perfectDrops: 0,
};

export default function SuikaGamePage() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [gameStats, setGameStats] = useState<GameStats>(INITIAL_GAME_STATS);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalStats, setFinalStats] = useState<GameStats>(INITIAL_GAME_STATS);
  const [key, setKey] = useState(0); // For forcing canvas remount
  const gameCanvasRef = useRef<GameCanvasRef>(null);

  // Game event handlers
  const handleScoreUpdate = useCallback((score: number) => {
    setGameState(prev => ({ ...prev, score }));
  }, []);

  const handleGameOver = useCallback((score: number, stats: GameStats) => {
    setFinalScore(score);
    setFinalStats(stats);
    setGameStats(stats);
    setShowGameOverModal(true);
  }, []);

  const handleGameStateChange = useCallback((newState: GameState) => {
    setGameState(newState);
  }, []);

  // UI event handlers
  const handleStartGame = useCallback(() => {
    gameCanvasRef.current?.startGame();
  }, []);

  const handlePauseGame = useCallback(() => {
    gameCanvasRef.current?.pauseGame();
  }, []);

  const handleResetGame = useCallback(() => {
    setGameState(INITIAL_GAME_STATE);
    setGameStats(INITIAL_GAME_STATS);
    setShowGameOverModal(false);
    setKey(prev => prev + 1); // Force canvas remount
  }, []);

  const handlePlayAgain = useCallback(() => {
    handleResetGame();
  }, [handleResetGame]);

  const handleViewLeaderboard = useCallback(() => {
    setShowGameOverModal(false);
    setShowLeaderboard(true);
  }, []);

  const handleCloseLeaderboard = useCallback(() => {
    setShowLeaderboard(false);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-green-500 mb-4">
          🍇 Suika Game
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Merge identical fruits to create bigger ones! Drop fruits strategically and create chain reactions for bonus points.
        </p>
        <div className="flex justify-center mt-4 space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowLeaderboard(true)}
          >
            🏆 Leaderboard
          </Button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
        {/* Game Canvas */}
        <div className="w-full lg:flex-1 flex justify-center">
          <Card className="p-4 bg-white shadow-lg mx-auto">
            <CardContent className="p-0">
              <GameCanvas
                ref={gameCanvasRef}
                key={key} // Force remount on reset
                onScoreUpdate={handleScoreUpdate}
                onGameOver={handleGameOver}
                onGameStateChange={handleGameStateChange}
              />
            </CardContent>
          </Card>
        </div>

        {/* Game UI Sidebar */}
        <div className="w-full lg:w-80">
          <GameUI
            gameState={gameState}
            gameStats={gameStats}
            onStartGame={handleStartGame}
            onPauseGame={handlePauseGame}
            onResetGame={handleResetGame}
          />
        </div>
      </div>

      {/* Game Rules */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-xl">🎮 How to Play</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">🎯 Basic Controls</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Move mouse/finger to aim</li>
                <li>• Click/tap to drop fruit</li>
                <li>• Fruits fall with realistic physics</li>
                <li>• Don't let fruits pile above the red line!</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🍎 Fruit Evolution</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 🍒 Cherry → 🍓 Strawberry → 🍇 Grape</li>
                <li>• 🍊 Orange → 🥭 Persimmon → 🍎 Apple</li>
                <li>• 🍐 Pear → 🍑 Peach → 🍍 Pineapple</li>
                <li>• 🍈 Melon → 🍉 Watermelon (Ultimate!)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">⚡ Scoring System</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Bigger fruits = more points</li>
                <li>• Chain reactions = combo multipliers</li>
                <li>• Perfect center drops = bonus points</li>
                <li>• Quick merges = time bonuses</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🏆 Strategy Tips</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Plan your drops carefully</li>
                <li>• Create space for bigger fruits</li>
                <li>• Use walls for positioning</li>
                <li>• Master the combo system</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <GameOverModal
        isOpen={showGameOverModal}
        finalScore={finalScore}
        stats={finalStats}
        onClose={() => setShowGameOverModal(false)}
        onPlayAgain={handlePlayAgain}
        onViewLeaderboard={handleViewLeaderboard}
      />

      <Leaderboard
        isOpen={showLeaderboard}
        onClose={handleCloseLeaderboard}
      />
    </div>
  );
}