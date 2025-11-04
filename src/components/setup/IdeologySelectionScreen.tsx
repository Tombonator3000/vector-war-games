/**
 * IdeologySelectionScreen Component
 *
 * Screen for selecting starting ideology for the player's nation.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { RefObject } from 'react';
import type { IdeologyType } from '@/types/ideology';
import { IDEOLOGY_INFO } from '@/data/ideologies';

export interface IdeologySelectionScreenProps {
  /** Ref to interface element */
  interfaceRef: RefObject<HTMLDivElement>;
  /** Handler for ideology selection */
  onSelectIdeology: (ideology: IdeologyType) => void;
  /** Handler for going back */
  onBack: () => void;
  /** Default ideology (optional) */
  defaultIdeology?: IdeologyType;
}

export function IdeologySelectionScreen({
  interfaceRef,
  onSelectIdeology,
  onBack,
  defaultIdeology = 'democracy',
}: IdeologySelectionScreenProps) {
  const [selectedIdeology, setSelectedIdeology] = useState<IdeologyType>(defaultIdeology);

  const currentInfo = IDEOLOGY_INFO[selectedIdeology];

  const ideologyTypes = Object.keys(IDEOLOGY_INFO) as IdeologyType[];

  return (
    <div ref={interfaceRef} className="command-interface">
      <div className="command-interface__glow" aria-hidden="true" />
      <div className="command-interface__scanlines" aria-hidden="true" />

      <div className="fixed inset-0 bg-gradient-to-br from-background via-deep-space to-background flex flex-col p-4 md:p-8">
        <h2 className="text-3xl font-mono text-cyan text-center mb-4 md:mb-6 tracking-widest uppercase glow-text">
          Select Ideology
        </h2>

        <div className="flex-1 flex gap-4 md:gap-6 overflow-hidden">
          {/* Sidebar with ideology icons */}
          <div className="w-32 md:w-40 flex-shrink-0 bg-card/50 border border-cyan/30 rounded-lg p-3">
            <ScrollArea className="h-full">
              <div className="flex flex-col gap-3">
                {ideologyTypes.map((ideology) => {
                  const info = IDEOLOGY_INFO[ideology];
                  const isSelected = ideology === selectedIdeology;

                  return (
                    <button
                      key={ideology}
                      onClick={() => setSelectedIdeology(ideology)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        isSelected
                          ? 'border-cyan shadow-lg shadow-cyan/50 scale-105 bg-cyan/10'
                          : 'border-cyan/30 hover:border-cyan/60 hover:scale-105 bg-card/30'
                      }`}
                      style={
                        isSelected
                          ? { borderColor: info.color, backgroundColor: `${info.color}20` }
                          : {}
                      }
                    >
                      <div className="text-4xl mb-1">{info.icon}</div>
                      <div className="text-xs font-mono">{info.name}</div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Main detail panel */}
          <div className="flex-1 bg-card/50 border border-cyan/30 rounded-lg overflow-hidden flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-6 md:p-8">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-start gap-6">
                    <div className="text-6xl">{currentInfo.icon}</div>
                    <div className="flex-1">
                      <h3
                        className="text-3xl md:text-4xl font-mono mb-2"
                        style={{ color: currentInfo.color }}
                      >
                        {currentInfo.name}
                      </h3>
                      <p className="text-lg text-muted-foreground">{currentInfo.description}</p>
                    </div>
                  </div>

                  {/* Strengths */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-green-500">Strengths</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {currentInfo.strengths.map((strength, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span className="text-muted-foreground">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Weaknesses */}
                  {currentInfo.weaknesses.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-red-500">Weaknesses</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {currentInfo.weaknesses.map((weakness, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-red-500 mt-1">✗</span>
                              <span className="text-muted-foreground">{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Detailed Bonuses */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Detailed Statistics</CardTitle>
                      <CardDescription>Numerical bonuses and modifiers</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {currentInfo.bonuses.productionMultiplier !== 1.0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Production:</span>
                            <span
                              className={
                                currentInfo.bonuses.productionMultiplier > 1 ? 'text-green-500' : 'text-red-500'
                              }
                            >
                              {((currentInfo.bonuses.productionMultiplier - 1) * 100).toFixed(0)}%
                            </span>
                          </div>
                        )}
                        {currentInfo.bonuses.diplomacyPerTurn !== 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Diplomacy/turn:</span>
                            <span
                              className={
                                currentInfo.bonuses.diplomacyPerTurn > 0 ? 'text-green-500' : 'text-red-500'
                              }
                            >
                              {currentInfo.bonuses.diplomacyPerTurn > 0 ? '+' : ''}
                              {currentInfo.bonuses.diplomacyPerTurn}
                            </span>
                          </div>
                        )}
                        {currentInfo.bonuses.researchMultiplier !== 1.0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Research Speed:</span>
                            <span
                              className={
                                currentInfo.bonuses.researchMultiplier > 1 ? 'text-green-500' : 'text-red-500'
                              }
                            >
                              {((currentInfo.bonuses.researchMultiplier - 1) * 100).toFixed(0)}%
                            </span>
                          </div>
                        )}
                        {currentInfo.bonuses.culturalPowerBonus !== 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Cultural Power:</span>
                            <span
                              className={
                                currentInfo.bonuses.culturalPowerBonus > 0 ? 'text-green-500' : 'text-red-500'
                              }
                            >
                              {currentInfo.bonuses.culturalPowerBonus > 0 ? '+' : ''}
                              {currentInfo.bonuses.culturalPowerBonus}
                            </span>
                          </div>
                        )}
                        {currentInfo.bonuses.propagandaEffectiveness !== 1.0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Propaganda:</span>
                            <span
                              className={
                                currentInfo.bonuses.propagandaEffectiveness > 1
                                  ? 'text-green-500'
                                  : 'text-red-500'
                              }
                            >
                              {((currentInfo.bonuses.propagandaEffectiveness - 1) * 100).toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </ScrollArea>

            {/* Action buttons */}
            <div className="border-t border-cyan/30 p-4 bg-card/80 flex justify-between gap-3">
              <Button
                onClick={onBack}
                className="px-6 bg-transparent border border-muted-foreground text-muted-foreground hover:border-cyan hover:text-cyan font-mono uppercase tracking-wide"
              >
                Back
              </Button>
              <Button
                onClick={() => onSelectIdeology(selectedIdeology)}
                className="px-8 bg-cyan border border-cyan text-background hover:bg-cyan/80 font-mono uppercase tracking-wide"
              >
                Select {currentInfo.name}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
