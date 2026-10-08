import { useEffect, type RefObject } from 'react';

/** Panels follow the actual header height, including zoom and wrapped mobile rows. */
export function useCommandHudLayout(ref: RefObject<HTMLDivElement>, active: boolean): void {
  useEffect(() => {
    const root = ref.current;
    const stack = root?.querySelector<HTMLElement>('.game-top-stack');
    if (!active || !root || !stack) return;
    const previousDockHeight = document.body.style.getPropertyValue('--command-dock-height');
    const dock = root.querySelector<HTMLElement>('.command-dock');
    const update = () => {
      root.style.setProperty('--game-top-stack-offset', `${stack.getBoundingClientRect().height + 8}px`);
      if (dock) {
        const height = `${dock.getBoundingClientRect().height}px`;
        root.style.setProperty('--command-dock-height', height);
        document.body.style.setProperty('--command-dock-height', height);
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(stack);
    if (dock) observer.observe(dock);
    return () => {
      observer.disconnect();
      if (previousDockHeight) document.body.style.setProperty('--command-dock-height', previousDockHeight);
      else document.body.style.removeProperty('--command-dock-height');
    };
  }, [ref, active]);
}
