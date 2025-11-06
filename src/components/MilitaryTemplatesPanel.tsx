/**
 * Military Templates Panel (Division Designer)
 *
 * UI for designing and managing custom military unit templates.
 */

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { MilitaryTemplate, UnitComponent, DeployedUnit } from '@/types/militaryTemplates';
import { UNIT_COMPONENTS } from '@/data/militaryTemplates';
import { Shield, Zap, Users, Plus, X, CheckCircle, AlertCircle } from 'lucide-react';

interface MilitaryTemplatesPanelProps {
  templates: MilitaryTemplate[];
  deployedUnits: DeployedUnit[];
  onCreateTemplate: (
    name: string,
    description: string,
    mainComponents: UnitComponent[],
    supportComponents: UnitComponent[]
  ) => void;
  onDeleteTemplate: (templateId: string) => void;
  onDeployUnit: (templateId: string, unitName: string) => void;
}

export function MilitaryTemplatesPanel({
  templates,
  deployedUnits,
  onCreateTemplate,
  onDeleteTemplate,
  onDeployUnit,
}: MilitaryTemplatesPanelProps) {
  const [isDesigning, setIsDesigning] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MilitaryTemplate | null>(null);
  const [designerMainComponents, setDesignerMainComponents] = useState<UnitComponent[]>([]);
  const [designerSupportComponents, setDesignerSupportComponents] = useState<UnitComponent[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  const totalUnits = deployedUnits.length;
  const averageHealth = useMemo(
    () =>
      deployedUnits.length > 0
        ? Math.round(deployedUnits.reduce((sum, u) => sum + u.health, 0) / deployedUnits.length)
        : 100,
    [deployedUnits]
  );

  const combatWidth = useMemo(() => {
    let total = 0;
    designerMainComponents.forEach((comp) => {
      const data = UNIT_COMPONENTS[comp];
      if (data) total += data.combatWidth;
    });
    designerSupportComponents.forEach((comp) => {
      const data = UNIT_COMPONENTS[comp];
      if (data) total += data.combatWidth;
    });
    return total;
  }, [designerMainComponents, designerSupportComponents]);

  const handleAddMainComponent = (component: UnitComponent) => {
    if (designerMainComponents.length < 10) {
      setDesignerMainComponents([...designerMainComponents, component]);
    }
  };

  const handleAddSupportComponent = (component: UnitComponent) => {
    if (designerSupportComponents.length < 5) {
      setDesignerSupportComponents([...designerSupportComponents, component]);
    }
  };

  const handleRemoveMainComponent = (index: number) => {
    setDesignerMainComponents(designerMainComponents.filter((_, i) => i !== index));
  };

  const handleRemoveSupportComponent = (index: number) => {
    setDesignerSupportComponents(designerSupportComponents.filter((_, i) => i !== index));
  };

  const handleSaveTemplate = () => {
    if (!templateName || designerMainComponents.length === 0) {
      alert('Template must have a name and at least one main component');
      return;
    }
    onCreateTemplate(templateName, templateDescription, designerMainComponents, designerSupportComponents);
    setIsDesigning(false);
    setDesignerMainComponents([]);
    setDesignerSupportComponents([]);
    setTemplateName('');
    setTemplateDescription('');
  };

  const mainComponentTypes: UnitComponent[] = [
    'infantry_battalion',
    'mechanized_battalion',
    'armor_battalion',
    'artillery_battalion',
    'anti_air_battalion',
    'anti_tank_battalion',
  ];

  const supportComponentTypes: UnitComponent[] = [
    'reconnaissance_company',
    'engineer_company',
    'signal_company',
    'logistics_company',
    'military_police_company',
  ];

  return (
    <div className="grid gap-6">
      {/* Overview */}
      <section className="rounded border border-cyan-500/40 bg-black/50 p-4 shadow-lg shadow-cyan-500/10">
        <div className="mb-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs font-mono uppercase tracking-[0.35em] text-cyan-400">Templates</p>
            <h3 className="text-2xl font-semibold text-cyan-200">{templates.length}</h3>
          </div>
          <div className="text-center">
            <p className="text-xs font-mono uppercase tracking-[0.35em] text-cyan-400">Deployed Units</p>
            <h3 className="text-2xl font-semibold text-cyan-200">{totalUnits}</h3>
          </div>
          <div className="text-center">
            <p className="text-xs font-mono uppercase tracking-[0.35em] text-cyan-400">Avg Health</p>
            <h3 className="text-2xl font-semibold text-cyan-200">{averageHealth}%</h3>
          </div>
        </div>

        <Button
          onClick={() => setIsDesigning(!isDesigning)}
          className="w-full bg-cyan-600 hover:bg-cyan-500"
        >
          {isDesigning ? 'Close Designer' : 'Open Division Designer'}
        </Button>
      </section>

      {/* Division Designer */}
      {isDesigning && (
        <section className="rounded border border-green-500/40 bg-black/50 p-4 shadow-lg shadow-green-500/10">
          <h3 className="mb-4 text-lg font-semibold tracking-wide text-green-300">Division Designer</h3>

          {/* Template Name & Description */}
          <div className="mb-4 grid gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-cyan-400">Template Name</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="mt-1 w-full rounded border border-cyan-500/40 bg-black/80 px-3 py-2 text-sm text-cyan-200"
                placeholder="e.g., Elite Strike Division"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-cyan-400">Description</label>
              <input
                type="text"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                className="mt-1 w-full rounded border border-cyan-500/40 bg-black/80 px-3 py-2 text-sm text-cyan-200"
                placeholder="e.g., Fast-moving armored force"
              />
            </div>
          </div>

          {/* Combat Width Status */}
          <div className="mb-4 rounded border border-cyan-500/20 bg-black/40 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">Combat Width</span>
              <span className={`text-lg font-bold ${combatWidth > 25 ? 'text-red-400' : combatWidth < 20 ? 'text-yellow-400' : 'text-green-400'}`}>
                {combatWidth} / 25
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-700">
              <div
                className={`h-full transition-all ${combatWidth > 25 ? 'bg-red-500' : combatWidth < 20 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(100, (combatWidth / 25) * 100)}%` }}
              />
            </div>
          </div>

          {/* Main Components */}
          <div className="mb-4">
            <h4 className="mb-2 text-sm font-semibold text-cyan-300">
              Main Components ({designerMainComponents.length}/10)
            </h4>
            <div className="mb-2 grid grid-cols-3 gap-2">
              {mainComponentTypes.map((type) => {
                const data = UNIT_COMPONENTS[type];
                return (
                  <Button
                    key={type}
                    onClick={() => handleAddMainComponent(type)}
                    disabled={designerMainComponents.length >= 10}
                    className="text-xs bg-cyan-700/50 hover:bg-cyan-600/50"
                    size="sm"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    {data.icon} {data.name.split(' ')[0]}
                  </Button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {designerMainComponents.map((comp, idx) => {
                const data = UNIT_COMPONENTS[comp];
                return (
                  <div key={idx} className="flex items-center justify-between rounded border border-cyan-500/30 bg-black/60 p-2">
                    <span className="text-xs text-cyan-200">
                      {data.icon} {data.name}
                    </span>
                    <Button
                      onClick={() => handleRemoveMainComponent(idx)}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Support Components */}
          <div className="mb-4">
            <h4 className="mb-2 text-sm font-semibold text-cyan-300">
              Support Components ({designerSupportComponents.length}/5)
            </h4>
            <div className="mb-2 grid grid-cols-3 gap-2">
              {supportComponentTypes.map((type) => {
                const data = UNIT_COMPONENTS[type];
                return (
                  <Button
                    key={type}
                    onClick={() => handleAddSupportComponent(type)}
                    disabled={designerSupportComponents.length >= 5}
                    className="text-xs bg-purple-700/50 hover:bg-purple-600/50"
                    size="sm"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    {data.icon} {data.name.split(' ')[0]}
                  </Button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {designerSupportComponents.map((comp, idx) => {
                const data = UNIT_COMPONENTS[comp];
                return (
                  <div key={idx} className="flex items-center justify-between rounded border border-purple-500/30 bg-black/60 p-2">
                    <span className="text-xs text-purple-200">
                      {data.icon} {data.name}
                    </span>
                    <Button
                      onClick={() => handleRemoveSupportComponent(idx)}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          <Button onClick={handleSaveTemplate} className="w-full bg-green-600 hover:bg-green-500">
            <CheckCircle className="mr-2 h-4 w-4" />
            Save Template
          </Button>
        </section>
      )}

      {/* Templates List */}
      <section className="rounded border border-cyan-500/40 bg-black/50 p-4 shadow-lg shadow-cyan-500/10">
        <h3 className="mb-4 text-lg font-semibold tracking-wide text-cyan-300">Your Templates</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {templates.map((template) => (
            <div
              key={template.id}
              className="rounded border border-cyan-500/30 bg-black/60 p-3 hover:border-cyan-300/60 transition cursor-pointer"
              onClick={() => setSelectedTemplate(template)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-cyan-200">{template.icon} {template.name}</h4>
                  <p className="text-xs text-cyan-400/80">{template.description}</p>
                </div>
                {template.isDefault && (
                  <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-300">Default</span>
                )}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-cyan-400">Attack:</span>
                  <span className="ml-1 text-cyan-200">{template.stats.softAttack}</span>
                </div>
                <div>
                  <span className="text-cyan-400">Defense:</span>
                  <span className="ml-1 text-cyan-200">{template.stats.defense}</span>
                </div>
                <div>
                  <span className="text-cyan-400">Units:</span>
                  <span className="ml-1 text-cyan-200">{template.unitsDeployed}</span>
                </div>
              </div>
              {!template.isDefault && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTemplate(template.id);
                  }}
                  size="sm"
                  variant="ghost"
                  className="mt-2 w-full text-red-400 hover:text-red-300"
                >
                  Delete Template
                </Button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Selected Template Details */}
      {selectedTemplate && (
        <section className="rounded border border-purple-500/40 bg-black/50 p-4 shadow-lg shadow-purple-500/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold tracking-wide text-purple-300">
              {selectedTemplate.icon} {selectedTemplate.name}
            </h3>
            <Button onClick={() => setSelectedTemplate(null)} size="sm" variant="ghost">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <p className="mb-4 text-sm text-cyan-200">{selectedTemplate.description}</p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="rounded border border-cyan-500/20 bg-black/40 p-3">
              <p className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">Combat Stats</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-cyan-400">Soft Attack:</span>
                  <span className="text-cyan-200">{selectedTemplate.stats.softAttack}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-400">Hard Attack:</span>
                  <span className="text-cyan-200">{selectedTemplate.stats.hardAttack}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-400">Defense:</span>
                  <span className="text-cyan-200">{selectedTemplate.stats.defense}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-400">Breakthrough:</span>
                  <span className="text-cyan-200">{selectedTemplate.stats.breakthrough}</span>
                </div>
              </div>
            </div>
            <div className="rounded border border-cyan-500/20 bg-black/40 p-3">
              <p className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">Support Stats</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-cyan-400">Organization:</span>
                  <span className="text-cyan-200">{selectedTemplate.stats.organization}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-400">Recovery:</span>
                  <span className="text-cyan-200">{selectedTemplate.stats.recovery}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-400">Speed:</span>
                  <span className="text-cyan-200">{selectedTemplate.stats.speed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-400">Supply Use:</span>
                  <span className="text-cyan-200">{selectedTemplate.stats.supplyUse}</span>
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={() => onDeployUnit(selectedTemplate.id, `${selectedTemplate.name} #${selectedTemplate.unitsDeployed + 1}`)}
            className="w-full bg-green-600 hover:bg-green-500"
          >
            Deploy New Unit
          </Button>
        </section>
      )}
    </div>
  );
}
