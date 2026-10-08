import { useEffect, type RefObject } from 'react';

/** Panels follow the actual header height, including zoom and wrapped mobile rows. */
export function useCommandHudLayout(ref: RefObject<HTMLDivElement>, active: boolean): void {
  useEffect(() => {
    const root = ref.current;
    const stack = root?.querySelector<HTMLElement>('.game-top-stack');
    if (!active || !root || !stack) return;
    const dock = root.querySelector<HTMLElement>('.command-dock');
    const update = () => {
      root.style.setProperty('--game-top-stack-offset', `${stack.getBoundingClientRect().height + 8}px`);
      if (dock) root.style.setProperty('--command-dock-height', `${dock.getBoundingClientRect().height}px`);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(stack);
    if (dock) observer.observe(dock);
    return () => observer.disconnect();
  }, [ref, active]);
}
