'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GameStorage } from '@/lib/storage/localStorage';
import { FRUIT_TYPES } from '@/types/game';
import type { LeaderboardEntry } from '@/types/game';

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  isOpen,
  onClose,
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLeaderboard(GameStorage.getLeaderboard());
    }
  }, [isOpen]);

  const formatScore = (score: number): string => {
    return score.toLocaleString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes} min ago`;
      }
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getMaxFruitEmoji = (maxFruitId: number): string => {
    const fruit = FRUIT_TYPES.find(ft => ft.id === maxFruitId);
    return fruit ? fruit.emoji : '🍒';
  };

  const getRankEmoji = (rank: number): string => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const handleClearLeaderboard = () => {
    GameStorage.clearLeaderboard();
    setLeaderboard([]);
    setShowConfirmClear(false);
  };

  const exportLeaderboard = () => {
    const data = GameStorage.exportLeaderboard();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'suika-game-leaderboard.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        const success = GameStorage.importLeaderboard(data);
        if (success) {
          setLeaderboard(GameStorage.getLeaderboard());
          alert('Leaderboard imported successfully!');
        } else {
          alert('Failed to import leaderboard. Please check the file format.');
        }
      } catch (error) {
        alert('Error reading file. Please try again.');
      }
    };
    reader.readAsText(file);
  };

  const getLeaderboardStats = () => {
    if (leaderboard.length === 0) return null;

    const totalScores = leaderboard.reduce((sum, entry) => sum + entry.score, 0);
    const averageScore = Math.floor(totalScores / leaderboard.length);
    const topScore = leaderboard[0]?.score || 0;
    const totalGames = leaderboard.length;

    return {
      totalGames,
      averageScore,
      topScore,
    };
  };

  const stats = getLeaderboardStats();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            🏆 Leaderboard
          </DialogTitle>
          <DialogDescription className="text-center">
            Top players and game statistics
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="rankings" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rankings">Rankings</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="rankings" className="space-y-4">
            {leaderboard.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl mb-4">🎮</div>
                  <div className="text-muted-foreground">
                    No games played yet!
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Play a game to see your score here.
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <Card key={entry.id} className={index < 3 ? 'border-yellow-200' : ''}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl font-bold min-w-[3rem]">
                            {getRankEmoji(index + 1)}
                          </div>
                          <div>
                            <div className="font-semibold text-lg">
                              {entry.playerName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(entry.date)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {formatScore(entry.score)}
                          </div>
                          <div className="flex items-center justify-end space-x-2 mt-1">
                            <span className="text-lg">
                              {getMaxFruitEmoji(entry.maxFruitReached)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {entry.fruitsCreated} fruits
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {index < 3 && (
                        <div className="mt-2 pt-2 border-t">
                          <Badge variant="secondary" className="text-xs">
                            {index === 0 && '👑 Champion'}
                            {index === 1 && '🥈 Runner-up'}
                            {index === 2 && '🥉 Third Place'}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            {stats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Games Played</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalGames}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Highest Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatScore(stats.topScore)}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Average Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatScore(stats.averageScore)}</div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-muted-foreground">
                    No statistics available yet.
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Management Buttons */}
        <div className="flex flex-col space-y-2">
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportLeaderboard}
              disabled={leaderboard.length === 0}
              className="flex-1"
            >
              📤 Export
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => document.getElementById('import-file')?.click()}
              className="flex-1"
            >
              📥 Import
            </Button>
          </div>
          
          {!showConfirmClear ? (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => setShowConfirmClear(true)}
              disabled={leaderboard.length === 0}
            >
              🗑️ Clear Leaderboard
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleClearLeaderboard}
                className="flex-1"
              >
                ✅ Confirm Clear
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowConfirmClear(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Hidden file input for import */}
        <input
          id="import-file"
          type="file"
          accept=".json"
          onChange={handleFileImport}
          style={{ display: 'none' }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default Leaderboard;