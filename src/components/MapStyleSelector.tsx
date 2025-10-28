import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { MapStyle } from './GlobeScene';

interface MapStyleSelectorProps {
  currentStyle: MapStyle;
  onStyleChange: (style: MapStyle) => void;
}

const MAP_STYLES: { value: MapStyle; label: string; description: string }[] = [
  { value: 'realistic', label: '🌍 Realistic', description: 'Satellite imagery with terrain' },
  { value: 'wireframe', label: '📡 Wireframe', description: 'Vector borders and outlines' },
  { value: 'night', label: '🌃 Night Lights', description: 'City lights on dark globe' },
  { value: 'political', label: '🗺️ Political', description: 'Colored territorial boundaries' },
];

export function MapStyleSelector({ currentStyle, onStyleChange }: MapStyleSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="map-style-button"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-64 bg-background/95 backdrop-blur-md border-primary/20"
      >
        <DropdownMenuLabel className="text-primary">Map Display Style</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-primary/10" />
        {MAP_STYLES.map((style) => (
          <DropdownMenuItem
            key={style.value}
            onClick={() => onStyleChange(style.value)}
            className={`cursor-pointer ${
              currentStyle === style.value 
                ? 'bg-primary/20 text-primary font-semibold' 
                : 'hover:bg-primary/10'
            }`}
          >
            <div className="flex flex-col gap-1">
              <span className="text-sm">{style.label}</span>
              <span className="text-xs opacity-70">{style.description}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
