import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { COMMAND_ACTIONS, PRIMARY_COMMANDS } from '@/data/commandActions';
import type { CommandAction, CommandActionDefinition, TurnControlProps } from '@/types/command';
import { TurnControl } from './TurnControl';

interface CommandDockProps {
  actions: CommandAction[];
  turn: TurnControlProps;
  minimal?: boolean;
}

function CommandButton({ action, definition }: { action: CommandAction; definition: CommandActionDefinition }) {
  const Icon = definition.icon;
  return (
    <Button type="button" variant="ghost" disabled={action.disabled} onClick={action.onSelect}
      className={`command-dock__action ${action.id === 'attack' ? 'command-dock__action--strike' : ''}`}
      data-role-locked={!!action.roleLocked} data-tutorial={definition.tutorial}
      title={`${definition.description}${definition.shortcut ? ` [${definition.shortcut}]` : ''}${action.roleLocked ? ' · Co-commander approval required' : ''}`}>
      <Icon aria-hidden="true" className="h-5 w-5" />
      <span>{definition.label}</span>
      {definition.shortcut && <kbd aria-hidden="true">{definition.shortcut}</kbd>}
    </Button>
  );
}

export function CommandDock({ actions, turn, minimal = false }: CommandDockProps) {
  const available = COMMAND_ACTIONS.flatMap(definition => {
    const action = actions.find(item => item.id === definition.id);
    return action ? [{ action, definition }] : [];
  });
  const primary = available.filter(({ action }) => PRIMARY_COMMANDS.includes(action.id) && (!minimal || action.id === 'build' || action.id === 'research'));
  const secondary = available.filter(item => item.action.id !== 'attack' && !primary.includes(item));
  const strike = available.find(({ action }) => action.id === 'attack');

  return (
    <nav className="command-dock" aria-label="Command actions">
      <div className="command-dock__orders">
        {primary.map(item => <CommandButton key={item.action.id} {...item} />)}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="command-dock__action" title="Additional operations">
              <MoreHorizontal aria-hidden="true" className="h-5 w-5" /><span>More</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" sideOffset={12} className="command-dock__menu">
            <DropdownMenuLabel>Operations</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {secondary.map(({ action, definition }) => {
              const Icon = definition.icon;
              return (
                <DropdownMenuItem key={action.id} disabled={action.disabled} onSelect={action.onSelect} data-role-locked={!!action.roleLocked}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{definition.label}{action.roleLocked ? ' · approval' : ''}</span>
                  {definition.shortcut && <kbd>{definition.shortcut}</kbd>}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
        {strike && <CommandButton {...strike} />}
      </div>
      <TurnControl {...turn} />
    </nav>
  );
}
