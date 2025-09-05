'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FRUIT_TYPES } from '@/types/game';
import { GameStorage } from '@/lib/storage/localStorage';
import type { GameStats, LeaderboardEntry } from '@/types/game';

interface GameOverModalProps {
  isOpen: boolean;
  finalScore: number;
  stats: GameStats;
  onClose: () => void;
  onPlayAgain: () => void;
  onViewLeaderboard: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  finalScore,
  stats,
  onClose,
  onPlayAgain,
  onViewLeaderboard,
}) => {
  const [playerName, setPlayerName] = useState('Anonymous');
  const [savedScore, setSavedScore] = useState<LeaderboardEntry | null>(null);
  const [showingStats, setShowingStats] = useState(false);

  const isHighScore = GameStorage.isHighScore(finalScore);
  const playerRank = GameStorage.getPlayerRank(finalScore);
  const maxFruitReached = FRUIT_TYPES.find(ft => ft.id === stats.maxFruitReached);

  const formatScore = (score: number): string => {
    return score.toLocaleString();
  };

  const handleSaveScore = () => {
    const entry = GameStorage.saveScore({
      playerName: playerName.trim() || 'Anonymous',
      score: finalScore,
      timeElapsed: 0, // Will be set by current timestamp
      date: new Date().toISOString(),
      fruitsCreated: stats.fruitsCreated,
      maxFruitReached: stats.maxFruitReached,
    });
    
    setSavedScore(entry);
  };

  const getScoreRating = (score: number): { text: string; color: string } => {
    if (score >= 50000) return { text: 'LEGENDARY!', color: 'bg-purple-500' };
    if (score >= 25000) return { text: 'AMAZING!', color: 'bg-yellow-500' };
    if (score >= 10000) return { text: 'EXCELLENT!', color: 'bg-green-500' };
    if (score >= 5000) return { text: 'GREAT!', color: 'bg-blue-500' };
    if (score >= 1000) return { text: 'GOOD!', color: 'bg-orange-500' };
    return { text: 'NICE TRY!', color: 'bg-gray-500' };
  };

  const rating = getScoreRating(finalScore);

  const achievements = [
    { 
      condition: stats.longestCombo >= 5, 
      text: 'Combo Master', 
      description: `${stats.longestCombo}x combo!`,
      emoji: '🔥'
    },
    { 
      condition: stats.perfectDrops >= 10, 
      text: 'Precision Player', 
      description: `${stats.perfectDrops} perfect drops`,
      emoji: '🎯'
    },
    { 
      condition: stats.maxFruitReached >= 10, 
      text: 'Fruit Collector', 
      description: `Reached ${maxFruitReached?.name || 'Unknown'}`,
      emoji: '🍈'
    },
    { 
      condition: stats.maxFruitReached === 11, 
      text: 'Watermelon Champion', 
      description: 'Created the ultimate fruit!',
      emoji: '🍉'
    },
    { 
      condition: stats.totalMerges >= 50, 
      text: 'Merge Master', 
      description: `${stats.totalMerges} successful merges`,
      emoji: '⚡'
    },
  ].filter(achievement => achievement.condition);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            Game Over!
          </DialogTitle>
          <DialogDescription className="text-center">
            <Badge className={`${rating.color} text-white text-lg px-3 py-1 mt-2`}>
              {rating.text}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Final Score */}
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold mb-2">
                {formatScore(finalScore)}
              </div>
              <div className="text-muted-foreground">
                Final Score
              </div>
              {isHighScore && (
                <Badge variant="default" className="mt-2">
                  New High Score! #{playerRank}
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Achievements */}
          {achievements.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-semibold mb-3 text-center">
                  🏆 Achievements Unlocked
                </div>
                <div className="space-y-2">
                  {achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <span className="text-lg">{achievement.emoji}</span>
                      <div>
                        <div className="font-semibold">{achievement.text}</div>
                        <div className="text-muted-foreground text-xs">
                          {achievement.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          {!showingStats ? (
            <div className="text-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowingStats(true)}
              >
                📊 View Detailed Stats
              </Button>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.fruitsDropped}</div>
                    <div className="text-muted-foreground">Fruits Dropped</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.totalMerges}</div>
                    <div className="text-muted-foreground">Total Merges</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.longestCombo}x</div>
                    <div className="text-muted-foreground">Best Combo</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {maxFruitReached?.emoji || '🍒'}
                    </div>
                    <div className="text-muted-foreground">Biggest Fruit</div>
                  </div>
                </div>
                <div className="text-center mt-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowingStats(false)}
                  >
                    Hide Stats
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Save Score */}
          {isHighScore && !savedScore && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="text-center text-sm font-semibold text-yellow-800">
                    🎉 You made it to the leaderboard!
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="playerName">Enter your name:</Label>
                    <Input
                      id="playerName"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Your name"
                      maxLength={20}
                    />
                  </div>
                  <Button onClick={handleSaveScore} className="w-full">
                    Save Score
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Score Saved Confirmation */}
          {savedScore && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6 text-center">
                <div className="text-green-800">
                  <div className="text-sm font-semibold">
                    ✅ Score Saved!
                  </div>
                  <div className="text-xs mt-1">
                    Ranked #{GameStorage.getPlayerRank(savedScore.score)} on the leaderboard
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex-col space-y-2 sm:flex-col sm:space-x-0">
          <div className="flex space-x-2 w-full">
            <Button onClick={onPlayAgain} className="flex-1">
              Play Again
            </Button>
            <Button onClick={onViewLeaderboard} variant="outline" className="flex-1">
              Leaderboard
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GameOverModal;