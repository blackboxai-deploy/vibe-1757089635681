'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameEngine } from '@/lib/game/GameEngine';
import { FRUIT_TYPES, GAME_CONFIG } from '@/types/game';
import type { GameState, GameStats, Fruit, ParticleEffect, GameEvents } from '@/types/game';

interface GameCanvasProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (score: number, stats: GameStats) => void;
  onGameStateChange: (state: GameState) => void;
}

export interface GameCanvasRef {
  startGame: () => void;
  pauseGame: () => void;
}

export const GameCanvas = React.forwardRef<GameCanvasRef, GameCanvasProps>(({
  onScoreUpdate,
  onGameOver,
  onGameStateChange,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: GAME_CONFIG.canvasWidth / 2, y: 0 });

  // Game event handlers
  const gameEvents: GameEvents = {
    onScoreUpdate,
    onGameOver,
    onMerge: (fruit1, fruit2, newFruit) => {
      // Add visual feedback for merging
      console.log(`Merged ${FRUIT_TYPES[fruit1.typeId - 1]?.name} + ${FRUIT_TYPES[fruit2.typeId - 1]?.name} = ${FRUIT_TYPES[newFruit.typeId - 1]?.name}`);
    },
    onDrop: (fruit) => {
      console.log(`Dropped ${FRUIT_TYPES[fruit.typeId - 1]?.name}`);
    },
    onCombo: (multiplier) => {
      console.log(`Combo multiplier: ${multiplier}x`);
    },
  };

  // Initialize game engine
  useEffect(() => {
    if (canvasRef.current) {
      gameEngineRef.current = new GameEngine(gameEvents);
      startRenderLoop();
    }

    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.destroy();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Render loop
  const startRenderLoop = useCallback(() => {
    const render = () => {
      if (canvasRef.current && gameEngineRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          drawGame(ctx);
          onGameStateChange(gameEngineRef.current.getGameState());
        }
      }
      animationFrameRef.current = requestAnimationFrame(render);
    };
    render();
  }, [onGameStateChange]);

  // Draw game
  const drawGame = (ctx: CanvasRenderingContext2D) => {
    if (!gameEngineRef.current) return;

    const gameState = gameEngineRef.current.getGameState();
    const particles = gameEngineRef.current.getParticles();

    // Clear canvas
    ctx.clearRect(0, 0, GAME_CONFIG.canvasWidth, GAME_CONFIG.canvasHeight);

    // Draw background
    drawBackground(ctx);

    // Draw game over line
    drawGameOverLine(ctx);

    // Draw fruits
    gameState.fruits.forEach(fruit => drawFruit(ctx, fruit));

    // Draw next fruit preview
    if (!gameState.isGameOver) {
      drawNextFruit(ctx, gameState);
    }

    // Draw particles
    particles.forEach(particle => drawParticle(ctx, particle));

    // Draw walls (for debugging)
    drawWalls(ctx);
  };

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    // Game area background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, GAME_CONFIG.canvasWidth, GAME_CONFIG.canvasHeight);

    // Game area border
    ctx.strokeStyle = '#dee2e6';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, GAME_CONFIG.canvasWidth - 2, GAME_CONFIG.canvasHeight - 2);

    // Drop zone background
    ctx.fillStyle = 'rgba(255, 107, 107, 0.1)';
    ctx.fillRect(0, 0, GAME_CONFIG.canvasWidth, GAME_CONFIG.dropZoneHeight);
  };

  const drawGameOverLine = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(20, GAME_CONFIG.dropZoneHeight);
    ctx.lineTo(GAME_CONFIG.canvasWidth - 20, GAME_CONFIG.dropZoneHeight);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const drawFruit = (ctx: CanvasRenderingContext2D, fruit: Fruit) => {
    const fruitType = FRUIT_TYPES.find(ft => ft.id === fruit.typeId);
    if (!fruitType) return;

    ctx.save();
    
    // Draw shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.beginPath();
    ctx.ellipse(
      fruit.position.x + 2,
      fruit.position.y + 2,
      fruit.radius,
      fruit.radius * 0.6,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw fruit circle
    ctx.fillStyle = fruitType.color;
    ctx.beginPath();
    ctx.arc(fruit.position.x, fruit.position.y, fruit.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw fruit border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw emoji
    ctx.fillStyle = '#fff';
    ctx.font = `${fruit.radius * 1.2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fruitType.emoji, fruit.position.x, fruit.position.y);

    ctx.restore();
  };

  const drawNextFruit = (ctx: CanvasRenderingContext2D, gameState: GameState) => {
    if (!gameState.nextFruitType) return;

    const x = gameEngineRef.current?.getNextFruitX() || GAME_CONFIG.canvasWidth / 2;
    const y = 30;

    ctx.save();
    
    // Draw preview fruit with transparency
    ctx.globalAlpha = 0.7;
    
    // Draw fruit circle
    ctx.fillStyle = gameState.nextFruitType.color;
    ctx.beginPath();
    ctx.arc(x, y, gameState.nextFruitType.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw fruit border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw emoji
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    ctx.font = `${gameState.nextFruitType.radius * 1.2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(gameState.nextFruitType.emoji, x, y);

    ctx.restore();
  };

  const drawParticle = (ctx: CanvasRenderingContext2D, particle: ParticleEffect) => {
    const alpha = particle.life / particle.maxLife;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  };

  const drawWalls = (ctx: CanvasRenderingContext2D) => {
    if (!gameEngineRef.current) return;

    const walls = gameEngineRef.current.getWalls();
    ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
    
    walls.forEach(wall => {
      ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    });
  };

  // Mouse and touch event handlers
  const getCanvasPosition = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = GAME_CONFIG.canvasWidth / rect.width;
    const scaleY = GAME_CONFIG.canvasHeight / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const pos = getCanvasPosition(e.clientX, e.clientY);
    setMousePosition(pos);
    
    if (gameEngineRef.current) {
      gameEngineRef.current.setNextFruitX(pos.x);
    }
  }, [getCanvasPosition]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsMouseDown(true);
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (isMouseDown && gameEngineRef.current) {
      const pos = getCanvasPosition(e.clientX, e.clientY);
      gameEngineRef.current.dropFruit(pos.x);
    }
    setIsMouseDown(false);
  }, [isMouseDown, getCanvasPosition]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const pos = getCanvasPosition(touch.clientX, touch.clientY);
    setMousePosition(pos);
    
    if (gameEngineRef.current) {
      gameEngineRef.current.setNextFruitX(pos.x);
    }
  }, [getCanvasPosition]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsMouseDown(true);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (isMouseDown && gameEngineRef.current && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      const pos = getCanvasPosition(touch.clientX, touch.clientY);
      gameEngineRef.current.dropFruit(pos.x);
    }
    setIsMouseDown(false);
  }, [isMouseDown, getCanvasPosition]);

  // Expose game controls via ref
  React.useImperativeHandle(ref, () => ({
    startGame: () => {
      gameEngineRef.current?.startGame();
    },
    pauseGame: () => {
      gameEngineRef.current?.pauseGame();
    },
  }));

  return (
    <div className="relative flex justify-center">
      <canvas
        ref={canvasRef}
        width={GAME_CONFIG.canvasWidth}
        height={GAME_CONFIG.canvasHeight}
        className="border-2 border-gray-300 rounded-lg cursor-crosshair touch-none block mx-auto"
        style={{
          width: `${GAME_CONFIG.canvasWidth}px`,
          height: `${GAME_CONFIG.canvasHeight}px`,
          maxWidth: '100%',
        }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsMouseDown(false)}
        onTouchMove={handleTouchMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />
      
      {/* Click indicator */}
      {isMouseDown && (
        <div 
          className="absolute pointer-events-none"
          style={{
            left: `${(mousePosition.x / GAME_CONFIG.canvasWidth) * 100}%`,
            top: '10px',
            transform: 'translateX(-50%)'
          }}
        >
          <div className="w-1 h-8 bg-red-500 animate-pulse"></div>
        </div>
      )}
    </div>
  );
});

GameCanvas.displayName = 'GameCanvas';

export default GameCanvas;