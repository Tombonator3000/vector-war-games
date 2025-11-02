/**
 * Hybrid Doctrine Selection Modal
 * Allows players to combine two doctrines with 60/40 split
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skull, Eye, Sparkles, X } from 'lucide-react';
import type { Doctrine, HybridDoctrine } from '@/types/greatOldOnes';
import { DOCTRINES, getHybridDoctrineName } from '@/types/greatOldOnes';
import { createHybridDoctrine, getEffectiveDoctrineConfig } from '@/lib/hybridDoctrineHelpers';

interface HybridDoctrineSelectionModalProps {
  onSelectHybrid: (hybrid: HybridDoctrine) => void;
  onCancel: () => void;
}

const DOCTRINE_ICONS: Record<Doctrine, React.ReactNode> = {
  domination: <Skull className="w-6 h-6" />,
  corruption: <Eye className="w-6 h-6" />,
  convergence: <Sparkles className="w-6 h-6" />,
};

const DOCTRINE_COLORS: Record<Doctrine, string> = {
  domination: 'text-red-500',
  corruption: 'text-purple-500',
  convergence: 'text-blue-500',
};

export const HybridDoctrineSelectionModal: React.FC<HybridDoctrineSelectionModalProps> = ({
  onSelectHybrid,
  onCancel,
}) => {
  const [selectedPrimary, setSelectedPrimary] = useState<Doctrine | null>(null);
  const [selectedSecondary, setSelectedSecondary] = useState<Doctrine | null>(null);

  const handleConfirmHybrid = () => {
    if (selectedPrimary && selectedSecondary && selectedPrimary !== selectedSecondary) {
      const hybrid = createHybridDoctrine(selectedPrimary, selectedSecondary);
      onSelectHybrid(hybrid);
    }
  };

  const canConfirm =
    selectedPrimary && selectedSecondary && selectedPrimary !== selectedSecondary;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl text-slate-100">
                  Create Hybrid Doctrine
                </CardTitle>
                <CardDescription className="text-lg text-slate-300 mt-2">
                  Combine two doctrines with 60% Primary / 40% Secondary split
                </CardDescription>
              </div>
              <Button variant="ghost" onClick={onCancel} className="text-slate-400">
                <X className="w-6 h-6" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Primary Doctrine Selection */}
            <div>
              <h3 className="text-xl font-bold text-slate-200 mb-3">
                Primary Doctrine (60% Bonuses)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(DOCTRINES).map(([key, doctrine]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedPrimary(key as Doctrine)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedPrimary === key
                        ? 'border-cyan-500 bg-slate-800'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={DOCTRINE_COLORS[key as Doctrine]}>
                        {DOCTRINE_ICONS[key as Doctrine]}
                      </div>
                      <span className="font-bold text-slate-100">{doctrine.name}</span>
                    </div>
                    <p className="text-sm text-slate-400">{doctrine.tagline}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Secondary Doctrine Selection */}
            <div>
              <h3 className="text-xl font-bold text-slate-200 mb-3">
                Secondary Doctrine (40% Bonuses)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(DOCTRINES).map(([key, doctrine]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedSecondary(key as Doctrine)}
                    disabled={selectedPrimary === key}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedSecondary === key
                        ? 'border-cyan-500 bg-slate-800'
                        : selectedPrimary === key
                          ? 'border-slate-800 bg-slate-900/50 opacity-50 cursor-not-allowed'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={DOCTRINE_COLORS[key as Doctrine]}>
                        {DOCTRINE_ICONS[key as Doctrine]}
                      </div>
                      <span className="font-bold text-slate-100">{doctrine.name}</span>
                    </div>
                    <p className="text-sm text-slate-400">{doctrine.tagline}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            {canConfirm && (
              <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                <h3 className="text-lg font-bold text-cyan-400 mb-2">Hybrid Preview</h3>
                <p className="text-slate-200 font-semibold mb-3">
                  {getHybridDoctrineName(selectedPrimary!, selectedSecondary!)}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Primary (60%):</span>
                    <span className={`ml-2 font-bold ${DOCTRINE_COLORS[selectedPrimary!]}`}>
                      {DOCTRINES[selectedPrimary!].name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Secondary (40%):</span>
                    <span className={`ml-2 font-bold ${DOCTRINE_COLORS[selectedSecondary!]}`}>
                      {DOCTRINES[selectedSecondary!].name}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  You will gain access to mechanics from both doctrines, with bonuses weighted
                  accordingly.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={onCancel} className="border-slate-600">
                Cancel
              </Button>
              <Button
                onClick={handleConfirmHybrid}
                disabled={!canConfirm}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                Confirm Hybrid Doctrine
              </Button>
            </div>

            <div className="p-4 bg-amber-900/20 rounded-lg border border-amber-700">
              <p className="text-sm text-amber-300">
                <strong>Note:</strong> Hybrid doctrines provide strategic flexibility but come
                with higher complexity. You gain access to all mechanics from both doctrines, but
                bonuses are reduced compared to single doctrine focus.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
