/**
 * Ideology Panel Component
 *
 * Displays and manages the nation's ideology system, including:
 * - Current ideology and bonuses
 * - Ideological support levels
 * - Revolution risk
 * - Ideological pressure from other nations
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import type { Nation } from '@/types/game';
import type { IdeologyType } from '@/types/ideology';
import { IDEOLOGY_INFO } from '@/data/ideologies';

interface IdeologyPanelProps {
  nation: Nation;
  onChangeIdeology?: (newIdeology: IdeologyType) => void;
  onSpreadIdeology?: (targetNationId: string) => void;
}

export function IdeologyPanel({ nation, onChangeIdeology, onSpreadIdeology }: IdeologyPanelProps) {
  if (!nation.ideologyState) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ideology</CardTitle>
          <CardDescription>No ideology system initialized</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { currentIdeology, ideologyStability, ideologicalSupport, ideologicalPressures } =
    nation.ideologyState;
  const revolutionRisk = nation.revolutionState?.revolutionRisk || 0;
  const targetIdeology = nation.revolutionState?.targetIdeology;

  const currentIdeologyInfo = IDEOLOGY_INFO[currentIdeology];

  // Get stability color
  const getStabilityColor = (stability: number) => {
    if (stability >= 70) return 'text-green-500';
    if (stability >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Get revolution risk color
  const getRevolutionRiskColor = (risk: number) => {
    if (risk >= 80) return 'bg-red-500';
    if (risk >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-4">
      {/* Current Ideology */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{currentIdeologyInfo.icon}</span>
              <div>
                <CardTitle>{currentIdeologyInfo.name}</CardTitle>
                <CardDescription>{currentIdeologyInfo.description}</CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              style={{ borderColor: currentIdeologyInfo.color, color: currentIdeologyInfo.color }}
            >
              Current Ideology
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stability */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Stability</span>
              <span className={`text-sm font-bold ${getStabilityColor(ideologyStability)}`}>
                {ideologyStability.toFixed(0)}%
              </span>
            </div>
            <Progress value={ideologyStability} className="h-2" />
          </div>

          {/* Bonuses */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Active Bonuses</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {currentIdeologyInfo.strengths.map((strength, idx) => (
                <div key={idx} className="flex items-start gap-1">
                  <span className="text-green-500">✓</span>
                  <span>{strength}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weaknesses */}
          {currentIdeologyInfo.weaknesses.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Weaknesses</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {currentIdeologyInfo.weaknesses.map((weakness, idx) => (
                  <div key={idx} className="flex items-start gap-1">
                    <span className="text-red-500">✗</span>
                    <span>{weakness}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ideological Support */}
      <Card>
        <CardHeader>
          <CardTitle>Ideological Support</CardTitle>
          <CardDescription>Population support for each ideology</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(Object.entries(ideologicalSupport) as [IdeologyType, number][]).map(
            ([ideology, support]) => {
              const info = IDEOLOGY_INFO[ideology];
              const isCurrent = ideology === currentIdeology;

              return (
                <div key={ideology}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{info.icon}</span>
                      <span className="text-sm font-medium">{info.name}</span>
                      {isCurrent && (
                        <Badge variant="outline" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm font-bold">{support.toFixed(0)}%</span>
                  </div>
                  <Progress
                    value={support}
                    className="h-2"
                    style={{ '--progress-background': info.color } as any}
                  />
                </div>
              );
            }
          )}
        </CardContent>
      </Card>

      {/* Revolution Risk */}
      {revolutionRisk > 0 && (
        <Alert variant={revolutionRisk >= 50 ? 'destructive' : 'default'}>
          <AlertDescription>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Revolution Risk</span>
                <span className="font-bold">{revolutionRisk.toFixed(0)}%</span>
              </div>
              <Progress value={revolutionRisk} className={getRevolutionRiskColor(revolutionRisk)} />
              {targetIdeology && revolutionRisk >= 50 && (
                <p className="text-sm mt-2">
                  ⚠️ High risk of revolution towards {IDEOLOGY_INFO[targetIdeology].name}!
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Ideological Pressures */}
      {ideologicalPressures && ideologicalPressures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Foreign Ideological Pressure</CardTitle>
            <CardDescription>Other nations spreading their ideology</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {ideologicalPressures.map((pressure, idx) => {
              const info = IDEOLOGY_INFO[pressure.ideology];
              return (
                <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{info.icon}</span>
                    <span className="text-sm">{info.name}</span>
                  </div>
                  <Badge variant="outline">Strength: {pressure.strength}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Change Ideology Button (Player only) */}
      {nation.isPlayer && onChangeIdeology && (
        <Card>
          <CardHeader>
            <CardTitle>Change Ideology</CardTitle>
            <CardDescription>
              Changing ideology will reduce stability and may cause unrest
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(IDEOLOGY_INFO) as IdeologyType[])
                .filter((id) => id !== currentIdeology)
                .map((ideology) => {
                  const info = IDEOLOGY_INFO[ideology];
                  return (
                    <Button
                      key={ideology}
                      variant="outline"
                      size="sm"
                      onClick={() => onChangeIdeology(ideology)}
                      className="justify-start"
                    >
                      <span className="mr-2">{info.icon}</span>
                      {info.name}
                    </Button>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
