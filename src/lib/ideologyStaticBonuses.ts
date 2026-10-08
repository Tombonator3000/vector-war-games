import type { Nation } from '@/types/game';
import type { IdeologyBonuses } from '@/types/ideology';

/** Replace persistent ideology modifiers while preserving unrelated bonuses. */
export function applyIdeologyStaticBonuses(nation: Nation, bonuses: IdeologyBonuses): void {
  const previous = nation.lastAppliedIdeologyBonuses;
  const immigrationBonus = (bonuses.immigrationModifier - 1) * 100;
  nation.unitAttackBonus = (nation.unitAttackBonus ?? 0)
    - (previous?.unitAttackBonus ?? 0) + bonuses.unitAttackBonus;
  nation.unitDefenseBonus = (nation.unitDefenseBonus ?? 0)
    - (previous?.unitDefenseBonus ?? 0) + bonuses.unitDefenseBonus;
  nation.immigrationBonus = (nation.immigrationBonus ?? 0)
    - (previous?.immigrationBonus ?? 0) + immigrationBonus;

  let cyberOffense = 0;
  let cyberDefense = 0;
  if (nation.cyber) {
    const baseOffense = nation.cyber.offense - (previous?.cyberOffense ?? 0);
    const baseDefense = nation.cyber.defense - (previous?.cyberDefense ?? 0);
    nation.cyber.offense = Math.max(0, baseOffense + bonuses.cyberWarfareBonus);
    nation.cyber.defense = Math.max(0, baseDefense + bonuses.cyberWarfareBonus);
    // Record the actual contribution after clamping, so switching away restores the base.
    cyberOffense = nation.cyber.offense - baseOffense;
    cyberDefense = nation.cyber.defense - baseDefense;
  }

  nation.lastAppliedIdeologyBonuses = {
    unitAttackBonus: bonuses.unitAttackBonus,
    unitDefenseBonus: bonuses.unitDefenseBonus,
    immigrationBonus,
    cyberOffense,
    cyberDefense,
  };
}
