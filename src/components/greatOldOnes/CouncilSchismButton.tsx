/**
 * Council Schism Button
 * Compact button for the bottom action bar
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CouncilSchismButtonProps {
  onClick: () => void;
  disabled?: boolean;
  councilUnity: number;
  eldritchPower: number;
}

export const CouncilSchismButton: React.FC<CouncilSchismButtonProps> = ({
  onClick,
  disabled = false,
  councilUnity,
  eldritchPower,
}) => {
  const hasResources = eldritchPower >= 100 && councilUnity >= 50;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="destructive"
            size="icon"
            onClick={onClick}
            disabled={disabled || !hasResources}
            className="fixed bottom-20 right-20 z-50 h-12 w-12 rounded-full shadow-lg"
            title="Council Schism"
          >
            <AlertTriangle className="h-6 w-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-slate-900 border-slate-700">
          <div className="space-y-1">
            <p className="font-semibold text-amber-300">Council Schism</p>
            <p className="text-xs text-slate-300">
              Force a change in doctrine through council upheaval
            </p>
            {!hasResources && (
              <p className="text-xs text-red-400">
                Requires: 100 Eldritch Power, 50 Council Unity
              </p>
            )}
            <p className="text-xs text-slate-400 italic">
              Can only be used once per campaign
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
