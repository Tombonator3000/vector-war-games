/**
 * Council Schism Modal
 * Allows player to change their doctrine after initial selection
 * High cost, high risk - can only be done once per campaign
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Skull, Eye, Sparkles, TrendingDown } from 'lucide-react';
import type { Doctrine, GreatOldOnesState } from '@/types/greatOldOnes';
import { DOCTRINES } from '@/types/greatOldOnes';

interface CouncilSchismModalProps {
  open: boolean;
  onClose: () => void;
  currentDoctrine: Doctrine | null;
  councilUnity: number;
  eldritchPower: number;
  onConfirmSchism: (newDoctrine: Doctrine) => void;
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

const SCHISM_COST = {
  eldritchPower: 100,
  councilUnityLoss: 30,
  minCouncilUnity: 50,
};

export const CouncilSchismModal: React.FC<CouncilSchismModalProps> = ({
  open,
  onClose,
  currentDoctrine,
  councilUnity,
  eldritchPower,
  onConfirmSchism,
}) => {
  const [selectedDoctrine, setSelectedDoctrine] = useState<Doctrine | null>(null);
  const [confirmStep, setConfirmStep] = useState(false);

  const canAffordSchism = eldritchPower >= SCHISM_COST.eldritchPower &&
    councilUnity >= SCHISM_COST.minCouncilUnity;

  const availableDoctrines = Object.keys(DOCTRINES).filter(
    (d) => d !== currentDoctrine
  ) as Doctrine[];

  const handleConfirm = () => {
    if (selectedDoctrine && canAffordSchism) {
      onConfirmSchism(selectedDoctrine);
      onClose();
      setConfirmStep(false);
      setSelectedDoctrine(null);
    }
  };

  const handleCancel = () => {
    setConfirmStep(false);
    setSelectedDoctrine(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-3xl text-slate-100 flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
            Council Schism
          </DialogTitle>
          <DialogDescription className="text-lg text-slate-300">
            Force a dramatic shift in the Esoteric Order's doctrine. This action will fracture the
            council and cost significant power.
          </DialogDescription>
        </DialogHeader>

        {/* Cost and Requirements */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-xl text-slate-100">Cost & Consequences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
              <span className="text-slate-300">Eldritch Power Cost</span>
              <Badge variant={eldritchPower >= SCHISM_COST.eldritchPower ? 'default' : 'destructive'}>
                -{SCHISM_COST.eldritchPower} Power (Current: {eldritchPower})
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
              <span className="text-slate-300">Council Unity Loss</span>
              <Badge variant="destructive" className="flex items-center gap-1">
                <TrendingDown className="w-4 h-4" />
                -{SCHISM_COST.councilUnityLoss} Unity (Current: {councilUnity})
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
              <span className="text-slate-300">Minimum Unity Required</span>
              <Badge variant={councilUnity >= SCHISM_COST.minCouncilUnity ? 'default' : 'destructive'}>
                {SCHISM_COST.minCouncilUnity} Unity
              </Badge>
            </div>

            <div className="p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg">
              <p className="text-sm text-amber-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <strong>Warning:</strong> This action can only be performed once per campaign!
              </p>
              <ul className="mt-2 text-xs text-amber-300 list-disc list-inside space-y-1">
                <li>Some High Priests may leave the council</li>
                <li>Investigators will be alerted to your activities</li>
                <li>Active operations may fail due to confusion</li>
                <li>Veil integrity will drop</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {!confirmStep ? (
          <>
            {/* Doctrine Selection */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-100">Select New Doctrine</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableDoctrines.map((doctrineKey) => {
                  const doctrine = DOCTRINES[doctrineKey];
                  const isSelected = selectedDoctrine === doctrineKey;

                  return (
                    <Card
                      key={doctrineKey}
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-700 border-slate-500 ring-2 ring-slate-400'
                          : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                      }`}
                      onClick={() => setSelectedDoctrine(doctrineKey)}
                    >
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className={DOCTRINE_COLORS[doctrineKey]}>
                            {DOCTRINE_ICONS[doctrineKey]}
                          </div>
                          <div>
                            <CardTitle className="text-lg text-slate-100">
                              {doctrine.name}
                            </CardTitle>
                            <div className={`text-sm font-semibold ${DOCTRINE_COLORS[doctrineKey]}`}>
                              {doctrine.tagline}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-300">{doctrine.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => setConfirmStep(true)}
                disabled={!selectedDoctrine || !canAffordSchism}
              >
                {canAffordSchism ? 'Initiate Schism' : 'Insufficient Resources'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            {/* Confirmation Step */}
            <Card className="bg-red-900/20 border-red-500/30">
              <CardHeader>
                <CardTitle className="text-xl text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6" />
                  Final Confirmation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-200">
                  You are about to change your doctrine from{' '}
                  <strong className={DOCTRINE_COLORS[currentDoctrine!]}>
                    {currentDoctrine && DOCTRINES[currentDoctrine].name}
                  </strong>{' '}
                  to{' '}
                  <strong className={DOCTRINE_COLORS[selectedDoctrine!]}>
                    {selectedDoctrine && DOCTRINES[selectedDoctrine].name}
                  </strong>.
                </p>
                <p className="text-slate-300 text-sm">
                  This will immediately cost <strong>{SCHISM_COST.eldritchPower} Eldritch Power</strong> and
                  reduce <strong>Council Unity by {SCHISM_COST.councilUnityLoss}</strong>.
                </p>
                <p className="text-red-400 text-sm font-semibold">
                  This action is irreversible. You will not be able to perform another Council Schism
                  during this campaign.
                </p>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmStep(false)}>
                Go Back
              </Button>
              <Button variant="destructive" onClick={handleConfirm}>
                Confirm Council Schism
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
