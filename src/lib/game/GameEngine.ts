'use client';

import { FRUIT_TYPES, GAME_CONFIG } from '@/types/game';
import type { 
  GameState, 
  Fruit, 
  FruitType, 
  GameEvents, 
  GameStats, 
  ParticleEffect,
  Position 
} from '@/types/game';

// Simple physics body for fruits
interface PhysicsBody {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  isStatic: boolean;
}

export class GameEngine {
  private gameState: GameState;
  private gameStats: GameStats;
  private events: GameEvents;
  private particles: ParticleEffect[] = [];
  private gameOverLine: number;
  private nextFruitX: number = GAME_CONFIG.canvasWidth / 2;
  private physicsBodies: PhysicsBody[] = [];
  private walls: { x: number; y: number; width: number; height: number }[] = [];
  
  constructor(events: GameEvents) {
    this.events = events;
    this.gameOverLine = GAME_CONFIG.dropZoneHeight;
    
    // Setup walls
    this.setupWalls();
    
    // Initialize game state
    this.gameState = {
      isPlaying: false,
      isPaused: false,
      isGameOver: false,
      score: 0,
      startTime: 0,
      elapsedTime: 0,
      fruits: [],
      nextFruitType: this.getRandomStartingFruit(),
      comboMultiplier: 1,
      lastMergeTime: 0
    };
    
    this.gameStats = {
      fruitsDropped: 0,
      fruitsCreated: 0,
      totalMerges: 0,
      longestCombo: 1,
      maxFruitReached: 1,
      perfectDrops: 0
    };
  }

  private setupWalls(): void {
    this.walls = [
      // Bottom wall
      { x: 0, y: GAME_CONFIG.canvasHeight - 20, width: GAME_CONFIG.canvasWidth, height: 20 },
      // Left wall  
      { x: 0, y: 0, width: 20, height: GAME_CONFIG.canvasHeight },
      // Right wall
      { x: GAME_CONFIG.canvasWidth - 20, y: 0, width: 20, height: GAME_CONFIG.canvasHeight }
    ];
  }
  
  private getRandomStartingFruit(): FruitType {
    // Only allow first 5 fruit types for dropping
    const startingFruits = FRUIT_TYPES.slice(0, 5);
    return startingFruits[Math.floor(Math.random() * startingFruits.length)];
  }
  
  private generateFruitId(): string {
    return `fruit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  public startGame(): void {
    // Reset game state
    this.gameState = {
      isPlaying: true,
      isPaused: false,
      isGameOver: false,
      score: 0,
      startTime: Date.now(),
      elapsedTime: 0,
      fruits: [],
      nextFruitType: this.getRandomStartingFruit(),
      comboMultiplier: 1,
      lastMergeTime: 0
    };
    
    this.gameStats = {
      fruitsDropped: 0,
      fruitsCreated: 0,
      totalMerges: 0,
      longestCombo: 1,
      maxFruitReached: 1,
      perfectDrops: 0
    };

    // Clear physics bodies
    this.physicsBodies = [];
    
    // Start game loop
    this.gameLoop();
  }
  
  public pauseGame(): void {
    this.gameState.isPaused = !this.gameState.isPaused;
  }
  
  public dropFruit(x: number): void {
    if (!this.gameState.isPlaying || this.gameState.isPaused || this.gameState.isGameOver) return;
    
    console.log('Dropping fruit at x:', x);
    
    const clampedX = Math.max(
      this.gameState.nextFruitType.radius + 20, 
      Math.min(x, GAME_CONFIG.canvasWidth - this.gameState.nextFruitType.radius - 20)
    );
    
    const fruit = this.createFruit(
      { x: clampedX, y: 50 },
      this.gameState.nextFruitType
    );
    
    this.gameState.fruits.push(fruit);
    this.gameStats.fruitsDropped++;
    
    // Generate next fruit
    this.gameState.nextFruitType = this.getRandomStartingFruit();
    
    this.events.onDrop(fruit);
    
    // Check for perfect drop (centered)
    const center = GAME_CONFIG.canvasWidth / 2;
    const tolerance = 20;
    if (Math.abs(x - center) < tolerance) {
      this.gameStats.perfectDrops++;
    }
  }
  
  private createFruit(position: Position, fruitType: FruitType): Fruit {
    const physicsBody: PhysicsBody = {
      id: this.generateFruitId(),
      x: position.x,
      y: position.y,
      vx: 0,
      vy: 0,
      radius: fruitType.radius,
      mass: fruitType.radius * 0.01,
      isStatic: false
    };
    
    this.physicsBodies.push(physicsBody);
    
    const fruit: Fruit = {
      id: physicsBody.id,
      typeId: fruitType.id,
      position: { x: position.x, y: position.y },
      velocity: { x: 0, y: 0 },
      radius: fruitType.radius,
      color: fruitType.color,
      isFalling: true,
      isStatic: false,
      matterBody: physicsBody as any, // Keep compatibility
      createdAt: Date.now()
    };
    
    this.gameStats.fruitsCreated++;
    console.log('Created fruit:', fruit.id, 'at', position);
    
    return fruit;
  }
  
  private mergeFruits(fruit1: Fruit, fruit2: Fruit): void {
    // Find the fruit type for merging
    const fruitType = FRUIT_TYPES.find(ft => ft.id === fruit1.typeId);
    if (!fruitType || !fruitType.nextFruitId) {
      console.log('Cannot merge - no next fruit type for:', fruitType?.name);
      return;
    }
    
    const nextFruitType = FRUIT_TYPES.find(ft => ft.id === fruitType.nextFruitId);
    if (!nextFruitType) {
      console.log('Cannot find next fruit type with id:', fruitType.nextFruitId);
      return;
    }
    
    console.log('🍎 MERGING:', fruitType.name, '+', fruitType.name, '→', nextFruitType.name);
    console.log('Before merge - Total fruits:', this.gameState.fruits.length);
    
    // Calculate merge position (midpoint)
    const mergePosition = {
      x: (fruit1.position.x + fruit2.position.x) / 2,
      y: (fruit1.position.y + fruit2.position.y) / 2
    };
    
    // Remove old physics bodies and fruits
    this.physicsBodies = this.physicsBodies.filter(b => b.id !== fruit1.id && b.id !== fruit2.id);
    this.gameState.fruits = this.gameState.fruits.filter(f => f.id !== fruit1.id && f.id !== fruit2.id);
    
    console.log('After removal - Total fruits:', this.gameState.fruits.length);
    
    // Create new merged fruit
    const newFruit = this.createFruit(mergePosition, nextFruitType);
    this.gameState.fruits.push(newFruit);
    
    console.log('After adding new fruit - Total fruits:', this.gameState.fruits.length);
    console.log('New fruit details:', newFruit.id, nextFruitType.name, 'at', mergePosition);
    
    // Update score and stats
    const baseScore = nextFruitType.score;
    const scoreGain = Math.floor(baseScore * this.gameState.comboMultiplier);
    this.gameState.score += scoreGain;
    this.gameStats.totalMerges++;
    
    // Update max fruit reached
    if (nextFruitType.id > this.gameStats.maxFruitReached) {
      this.gameStats.maxFruitReached = nextFruitType.id;
    }
    
    // Handle combo system
    const timeSinceLastMerge = Date.now() - this.gameState.lastMergeTime;
    if (timeSinceLastMerge < 1000) { // 1 second window for combos
      this.gameState.comboMultiplier = Math.min(this.gameState.comboMultiplier + 0.5, 5);
      this.gameStats.longestCombo = Math.max(this.gameStats.longestCombo, this.gameState.comboMultiplier);
      this.events.onCombo(this.gameState.comboMultiplier);
    } else {
      this.gameState.comboMultiplier = 1;
    }
    
    this.gameState.lastMergeTime = Date.now();
    
    // Create merge particles
    this.createMergeParticles(mergePosition, nextFruitType.color);
    
    // Trigger events
    this.events.onMerge(fruit1, fruit2, newFruit);
    this.events.onScoreUpdate(this.gameState.score);
  }
  
  private createMergeParticles(position: Position, color: string): void {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      const speed = 2 + Math.random() * 3;
      
      this.particles.push({
        id: `particle_${Date.now()}_${i}`,
        position: { ...position },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        },
        life: 1,
        maxLife: 1,
        color,
        size: 3 + Math.random() * 2,
        type: 'merge'
      });
    }
  }
  
  private gameLoop(): void {
    if (!this.gameState.isPlaying) return;
    
    if (!this.gameState.isPaused) {
      // Update physics
      this.updatePhysics();
      
      // Update fruit positions
      this.updateFruits();
      
      // Check collisions
      this.checkCollisions();
      
      // Update particles
      this.updateParticles();
      
      // Update elapsed time
      this.gameState.elapsedTime = Date.now() - this.gameState.startTime;
      
      // Check game over condition
      this.checkGameOver();
    }
    
    // Continue loop
    if (this.gameState.isPlaying) {
      requestAnimationFrame(() => this.gameLoop());
    }
  }
  
  private updatePhysics(): void {
    const dt = 1 / 60; // 60 FPS
    const gravity = 400; // pixels per second squared
    
    this.physicsBodies.forEach(body => {
      if (body.isStatic) return;
      
      // Apply gravity
      body.vy += gravity * dt;
      
      // Update position
      body.x += body.vx * dt;
      body.y += body.vy * dt;
      
      // Wall collisions
      // Bottom wall
      if (body.y + body.radius > GAME_CONFIG.canvasHeight - 20) {
        body.y = GAME_CONFIG.canvasHeight - 20 - body.radius;
        body.vy *= -0.5; // Bounce with damping
      }
      
      // Left wall
      if (body.x - body.radius < 20) {
        body.x = 20 + body.radius;
        body.vx *= -0.5;
      }
      
      // Right wall
      if (body.x + body.radius > GAME_CONFIG.canvasWidth - 20) {
        body.x = GAME_CONFIG.canvasWidth - 20 - body.radius;
        body.vx *= -0.5;
      }
      
      // Air resistance
      body.vx *= 0.99;
      body.vy *= 0.999;
    });
  }

  private updateFruits(): void {
    this.gameState.fruits.forEach(fruit => {
      const body = this.physicsBodies.find(b => b.id === fruit.id);
      if (body) {
        fruit.position.x = body.x;
        fruit.position.y = body.y;
        fruit.velocity.x = body.vx;
        fruit.velocity.y = body.vy;
        
        // Update falling state
        fruit.isFalling = Math.abs(body.vy) > 10;
      }
    });
  }

  private checkCollisions(): void {
    const fruits = this.gameState.fruits;
    
    for (let i = 0; i < fruits.length; i++) {
      for (let j = i + 1; j < fruits.length; j++) {
        const fruit1 = fruits[i];
        const fruit2 = fruits[j];
        
        if (!fruit1 || !fruit2) continue; // Safety check
        
        const dx = fruit1.position.x - fruit2.position.x;
        const dy = fruit1.position.y - fruit2.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = fruit1.radius + fruit2.radius;
        
        if (distance < minDistance) {
          const body1 = this.physicsBodies.find(b => b.id === fruit1.id);
          const body2 = this.physicsBodies.find(b => b.id === fruit2.id);
          
          if (!body1 || !body2) continue;
          
          // Check if fruits should merge (same type and not moving too fast)
          const totalSpeed = Math.abs(body1.vx) + Math.abs(body1.vy) + Math.abs(body2.vx) + Math.abs(body2.vy);
          
          if (fruit1.typeId === fruit2.typeId && totalSpeed < 50) {
            // Merge fruits
            console.log('Merging fruits - Type:', fruit1.typeId, 'Speed:', totalSpeed);
            this.mergeFruits(fruit1, fruit2);
            return; // Exit early to avoid index issues
          }
          
          // Handle collision physics - separate overlapping bodies
          const overlap = minDistance - distance;
          const separationX = (dx / distance) * (overlap * 0.5);
          const separationY = (dy / distance) * (overlap * 0.5);
          
          body1.x += separationX;
          body1.y += separationY;
          body2.x -= separationX;
          body2.y -= separationY;
          
          // Basic collision response
          const relativeVX = body1.vx - body2.vx;
          const relativeVY = body1.vy - body2.vy;
          const relativeSpeed = relativeVX * dx + relativeVY * dy;
          
          if (relativeSpeed > 0) continue; // Objects are separating
          
          const impulse = 2 * relativeSpeed / (body1.mass + body2.mass);
          body1.vx -= impulse * body2.mass * dx * 0.8;
          body1.vy -= impulse * body2.mass * dy * 0.8;
          body2.vx += impulse * body1.mass * dx * 0.8;
          body2.vy += impulse * body1.mass * dy * 0.8;
        }
      }
    }
  }
  
  private updateParticles(): void {
    this.particles.forEach(particle => {
      particle.position.x += particle.velocity.x;
      particle.position.y += particle.velocity.y;
      particle.life -= 0.02;
      particle.velocity.y += 0.1; // Gravity effect
    });
    
    // Remove dead particles
    this.particles = this.particles.filter(p => p.life > 0);
  }
  
  private checkGameOver(): void {
    const fruitsInDropZone = this.gameState.fruits.filter(
      fruit => fruit.position.y < this.gameOverLine && !fruit.isFalling
    );
    
    if (fruitsInDropZone.length > 0) {
      // Give a 2-second grace period
      const oldestStillFruit = Math.min(...fruitsInDropZone.map(f => f.createdAt));
      if (Date.now() - oldestStillFruit > 2000) {
        this.endGame();
      }
    }
  }
  
  private endGame(): void {
    this.gameState.isPlaying = false;
    this.gameState.isGameOver = true;
    this.events.onGameOver(this.gameState.score, this.gameStats);
  }
  
  public getGameState(): GameState {
    return { ...this.gameState };
  }
  
  public getGameStats(): GameStats {
    return { ...this.gameStats };
  }
  
  public getParticles(): ParticleEffect[] {
    return [...this.particles];
  }
  
  public setNextFruitX(x: number): void {
    this.nextFruitX = Math.max(
      this.gameState.nextFruitType.radius,
      Math.min(x, GAME_CONFIG.canvasWidth - this.gameState.nextFruitType.radius)
    );
  }
  
  public getNextFruitX(): number {
    return this.nextFruitX;
  }
  
  public getWalls(): { x: number; y: number; width: number; height: number }[] {
    return this.walls;
  }

  public destroy(): void {
    this.gameState.isPlaying = false;
    this.physicsBodies = [];
    this.gameState.fruits = [];
  }
}