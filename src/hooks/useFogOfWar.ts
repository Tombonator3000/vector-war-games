import { useMemo } from 'react';

export interface IntelligenceReport {
  targetId: string;
  data: Record<string, any>;
  confidence: number; // 0-1
  reliability: 'verified' | 'likely' | 'uncertain' | 'unconfirmed';
  timestamp: number;
}

interface FogOfWarConfig {
  baseAccuracy: number; // 0-1, base intel accuracy
  satelliteCoverage: boolean;
  deepReconActive: boolean;
  counterintelActive: boolean; // Enemy counterintel reduces accuracy
}

/**
 * Fog of War system that makes intelligence unreliable
 * - Adds noise to enemy stats
 * - Creates false positives/negatives
 * - Simulates intelligence failures
 */
export function useFogOfWar() {
  
  const applyIntelNoise = useMemo(() => {
    return (actualValue: number, config: FogOfWarConfig): { reported: number; confidence: number } => {
      let accuracy = config.baseAccuracy;
      
      // Satellites improve accuracy
      if (config.satelliteCoverage) accuracy += 0.2;
      // Deep recon improves further
      if (config.deepReconActive) accuracy += 0.15;
      // Enemy counterintel reduces accuracy
      if (config.counterintelActive) accuracy -= 0.25;
      
      accuracy = Math.max(0.2, Math.min(0.95, accuracy)); // Clamp between 20-95%
      
      // Add Gaussian noise
      const noise = (Math.random() + Math.random() + Math.random() - 1.5) * (1 - accuracy);
      const reported = Math.max(0, Math.round(actualValue * (1 + noise)));
      
      return { reported, confidence: accuracy };
    };
  }, []);

  const generateFalseIntel = useMemo(() => {
    return (config: FogOfWarConfig): { type: string; description: string } | null => {
      const falsePositiveChance = 0.15 * (1 - config.baseAccuracy);
      
      if (Math.random() < falsePositiveChance) {
        const types = [
          { type: 'phantom_buildup', description: 'SIGINT indicates major military buildup, but satellite confirms nothing.' },
          { type: 'fake_launch_prep', description: 'Launch preparations detected, but later revealed as maintenance drill.' },
          { type: 'double_agent', description: 'Agent reports imminent attack. Turns out they were compromised.' },
          { type: 'ghost_missiles', description: 'Radar shows 50+ missiles. Actually weather balloons.' },
          { type: 'planted_intel', description: 'Captured documents suggest new superweapon. Deliberate misinformation.' }
        ];
        
        return types[Math.floor(Math.random() * types.length)];
      }
      
      return null;
    };
  }, []);

  const getIntelReliability = useMemo(() => {
    return (confidence: number): IntelligenceReport['reliability'] => {
      if (confidence >= 0.8) return 'verified';
      if (confidence >= 0.6) return 'likely';
      if (confidence >= 0.4) return 'uncertain';
      return 'unconfirmed';
    };
  }, []);

  const distortNationIntel = useMemo(() => {
    return (nation: any, config: FogOfWarConfig): any => {
      const { reported: missiles, confidence: missileConf } = applyIntelNoise(nation.missiles || 0, config);
      const { reported: defense, confidence: defenseConf } = applyIntelNoise(nation.defense || 0, config);
      const { reported: production, confidence: prodConf } = applyIntelNoise(nation.production || 0, config);
      const { reported: uranium, confidence: uranConf } = applyIntelNoise(nation.uranium || 0, config);
      
      // Deep recon reveals accurate warhead counts
      const warheadsAccurate = config.deepReconActive;
      const warheads = warheadsAccurate ? nation.warheads : Object.fromEntries(
        Object.entries(nation.warheads || {}).map(([yield_, count]: [string, any]) => {
          const { reported } = applyIntelNoise(count, { ...config, deepReconActive: false });
          return [yield_, reported];
        })
      );
      
      const avgConfidence = (missileConf + defenseConf + prodConf + uranConf) / 4;
      
      return {
        ...nation,
        missiles: missiles,
        defense: defense,
        production: production,
        uranium: uranium,
        warheads: warheads,
        _intelConfidence: avgConfidence,
        _intelReliability: getIntelReliability(avgConfidence),
        _isDistorted: true
      };
    };
  }, [applyIntelNoise, getIntelReliability]);

  return {
    applyIntelNoise,
    generateFalseIntel,
    getIntelReliability,
    distortNationIntel
  };
}
