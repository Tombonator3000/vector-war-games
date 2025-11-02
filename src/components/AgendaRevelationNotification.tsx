/**
 * Agenda Revelation Notification
 *
 * Modal notification that appears when a hidden agenda is revealed.
 * Shows the nation name, agenda name, and description with a smooth animation.
 *
 * Phase 4: Agenda System for Unique Leader Personalities
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Eye } from 'lucide-react';
import type { Agenda } from '@/types/negotiation';

interface AgendaRevelationNotificationProps {
  open: boolean;
  onClose: () => void;
  nationName: string;
  agenda: Agenda;
}

/**
 * AgendaRevelationNotification Component
 *
 * Displays a modal notification when a hidden agenda is revealed.
 */
export function AgendaRevelationNotification({
  open,
  onClose,
  nationName,
  agenda,
}: AgendaRevelationNotificationProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-lg pointer-events-none" />

        <DialogHeader className="relative">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative bg-blue-500/30 p-4 rounded-full">
                <Lightbulb className="h-8 w-8 text-blue-300" />
              </div>
            </div>
          </div>

          <DialogTitle className="text-2xl text-center">
            New Insight Discovered
          </DialogTitle>

          <DialogDescription className="text-center text-base">
            You've learned more about <span className="font-semibold text-foreground">{nationName}</span>'s motivations
          </DialogDescription>
        </DialogHeader>

        <div className="relative space-y-4 my-4">
          {/* Agenda Card */}
          <div className="p-4 rounded-lg border-2 border-blue-500/50 bg-blue-900/20">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-5 w-5 text-blue-400" />
              <h3 className="font-semibold text-lg">{agenda.name}</h3>
              <Badge variant="secondary" className="ml-auto">
                Hidden Trait
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {agenda.description}
            </p>
          </div>

          {/* Insight Message */}
          <div className="p-3 rounded-lg bg-accent/50 border border-accent">
            <p className="text-xs text-muted-foreground text-center">
              💡 This trait will now be visible in the Leader Contact screen
            </p>
          </div>
        </div>

        <DialogFooter className="relative">
          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all"
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
