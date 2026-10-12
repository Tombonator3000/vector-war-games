export interface ProductionHandlers {
  buildMissile: () => void;
  buildBomber: () => void;
  buildDefense: () => void;
  buildCity: () => void;
  buildWarhead: (yieldMT: number) => void;
}
export interface ProductionOption {
  key: string;
  label: string;
  description: string;
  cost: Record<string, number>;
  onClick: () => void;
  statusLine: string;
  requirement?: string | null;
}
