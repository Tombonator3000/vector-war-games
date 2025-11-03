import { motion, AnimatePresence } from 'framer-motion';
import { DiceRollResult } from '@/hooks/useConventionalWarfare';

interface DiceRollerProps {
  result: DiceRollResult;
  attackerName: string;
  defenderName: string;
  visible?: boolean;
}

// Dice face with pips
function DiceFace({ value, color }: { value: number; color: string }) {
  const pips = Array.from({ length: value }, (_, i) => i);

  // Pip positions for each die face
  const pipPositions: Record<number, string[]> = {
    1: ['center'],
    2: ['top-left', 'bottom-right'],
    3: ['top-left', 'center', 'bottom-right'],
    4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
    6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right'],
  };

  const positions = pipPositions[value] || [];

  return (
    <motion.div
      initial={{ rotateX: 0, rotateY: 0, scale: 0.5 }}
      animate={{ rotateX: 360, rotateY: 360, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`relative w-12 h-12 rounded-lg ${color} shadow-lg`}
      style={{ perspective: '1000px' }}
    >
      {pips.map((_, index) => {
        const position = positions[index];
        let positionClass = '';

        switch (position) {
          case 'center':
            positionClass = 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
            break;
          case 'top-left':
            positionClass = 'top-2 left-2';
            break;
          case 'top-right':
            positionClass = 'top-2 right-2';
            break;
          case 'middle-left':
            positionClass = 'top-1/2 -translate-y-1/2 left-2';
            break;
          case 'middle-right':
            positionClass = 'top-1/2 -translate-y-1/2 right-2';
            break;
          case 'bottom-left':
            positionClass = 'bottom-2 left-2';
            break;
          case 'bottom-right':
            positionClass = 'bottom-2 right-2';
            break;
        }

        return (
          <div
            key={index}
            className={`absolute w-2 h-2 rounded-full bg-white ${positionClass}`}
          />
        );
      })}
    </motion.div>
  );
}

export function DiceRoller({ result, attackerName, defenderName, visible = true }: DiceRollerProps) {
  if (!visible) return null;

  const attackerWonRound = result.defenderLosses > result.attackerLosses;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="grid gap-4 p-4 rounded-lg bg-black/60 border border-cyan-500/30"
      >
        {/* Attacker Dice */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-red-400">{attackerName} (Attacker)</h4>
            <span className="text-xs font-mono text-red-300/80">
              {result.attackerLosses} {result.attackerLosses === 1 ? 'loss' : 'losses'}
            </span>
          </div>
          <div className="flex gap-2">
            {result.attackerDice.map((die, index) => (
              <DiceFace key={`atk-${index}`} value={die} color="bg-gradient-to-br from-red-500 to-red-700" />
            ))}
          </div>
        </div>

        {/* Battle Result Indicator */}
        <div className="flex items-center justify-center py-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6, type: 'spring' }}
            className={`text-xs font-bold uppercase tracking-widest px-4 py-1 rounded ${
              attackerWonRound
                ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/50'
            }`}
          >
            {attackerWonRound ? '⚔️ Attacker Wins Round' : '🛡️ Defender Wins Round'}
          </motion.div>
        </div>

        {/* Defender Dice */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-blue-400">{defenderName} (Defender)</h4>
            <span className="text-xs font-mono text-blue-300/80">
              {result.defenderLosses} {result.defenderLosses === 1 ? 'loss' : 'losses'}
            </span>
          </div>
          <div className="flex gap-2">
            {result.defenderDice.map((die, index) => (
              <DiceFace key={`def-${index}`} value={die} color="bg-gradient-to-br from-blue-500 to-blue-700" />
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Component to show all dice rolls from a battle
export function BattleResultDisplay({
  diceRolls,
  attackerName,
  defenderName
}: {
  diceRolls: DiceRollResult[];
  attackerName: string;
  defenderName: string;
}) {
  const totalAttackerLosses = diceRolls.reduce((sum, roll) => sum + roll.attackerLosses, 0);
  const totalDefenderLosses = diceRolls.reduce((sum, roll) => sum + roll.defenderLosses, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
        <div className="text-center flex-1">
          <p className="text-xs font-mono uppercase tracking-widest text-cyan-400">Total Rounds</p>
          <p className="text-2xl font-bold text-cyan-200">{diceRolls.length}</p>
        </div>
        <div className="text-center flex-1 border-l border-r border-cyan-500/30">
          <p className="text-xs font-mono uppercase tracking-widest text-red-400">Attacker Losses</p>
          <p className="text-2xl font-bold text-red-300">{totalAttackerLosses}</p>
        </div>
        <div className="text-center flex-1">
          <p className="text-xs font-mono uppercase tracking-widest text-blue-400">Defender Losses</p>
          <p className="text-2xl font-bold text-blue-300">{totalDefenderLosses}</p>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {diceRolls.map((roll, index) => (
          <div key={index} className="relative">
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center">
              <span className="text-xs font-bold text-cyan-300">{index + 1}</span>
            </div>
            <div className="pl-6">
              <DiceRoller
                result={roll}
                attackerName={attackerName}
                defenderName={defenderName}
                visible={true}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
