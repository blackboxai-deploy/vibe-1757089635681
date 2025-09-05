'use client';

import type { LeaderboardEntry } from '@/types/game';

const LEADERBOARD_KEY = 'suika_game_leaderboard';
const MAX_LEADERBOARD_ENTRIES = 10;

export class GameStorage {
  static saveScore(entry: Omit<LeaderboardEntry, 'id'>): LeaderboardEntry {
    const newEntry: LeaderboardEntry = {
      ...entry,
      id: `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    const leaderboard = this.getLeaderboard();
    leaderboard.push(newEntry);
    
    // Sort by score (descending)
    leaderboard.sort((a, b) => b.score - a.score);
    
    // Keep only top entries
    const trimmedLeaderboard = leaderboard.slice(0, MAX_LEADERBOARD_ENTRIES);
    
    this.saveLeaderboard(trimmedLeaderboard);
    return newEntry;
  }

  static getLeaderboard(): LeaderboardEntry[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(LEADERBOARD_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      return [];
    }
  }

  static saveLeaderboard(leaderboard: LeaderboardEntry[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
    } catch (error) {
      console.error('Failed to save leaderboard:', error);
    }
  }

  static clearLeaderboard(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(LEADERBOARD_KEY);
    } catch (error) {
      console.error('Failed to clear leaderboard:', error);
    }
  }

  static isHighScore(score: number): boolean {
    const leaderboard = this.getLeaderboard();
    
    if (leaderboard.length < MAX_LEADERBOARD_ENTRIES) {
      return true;
    }
    
    const lowestHighScore = leaderboard[leaderboard.length - 1].score;
    return score > lowestHighScore;
  }

  static getPlayerRank(score: number): number {
    const leaderboard = this.getLeaderboard();
    const rank = leaderboard.findIndex(entry => score > entry.score);
    
    return rank === -1 ? leaderboard.length + 1 : rank + 1;
  }

  static exportLeaderboard(): string {
    const leaderboard = this.getLeaderboard();
    return JSON.stringify(leaderboard, null, 2);
  }

  static importLeaderboard(data: string): boolean {
    try {
      const imported = JSON.parse(data) as LeaderboardEntry[];
      
      // Validate structure
      if (!Array.isArray(imported)) return false;
      
      const isValid = imported.every(entry => 
        entry.id && 
        entry.playerName && 
        typeof entry.score === 'number' &&
        entry.date
      );
      
      if (!isValid) return false;
      
      // Merge with existing leaderboard
      const existing = this.getLeaderboard();
      const combined = [...existing, ...imported];
      
      // Remove duplicates by id
      const unique = combined.filter((entry, index) => 
        combined.findIndex(e => e.id === entry.id) === index
      );
      
      // Sort and trim
      unique.sort((a, b) => b.score - a.score);
      const final = unique.slice(0, MAX_LEADERBOARD_ENTRIES);
      
      this.saveLeaderboard(final);
      return true;
    } catch (error) {
      console.error('Failed to import leaderboard:', error);
      return false;
    }
  }
}