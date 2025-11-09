/**
 * Military Templates Hook
 *
 * Manages military unit templates (division designer) and deployed units.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  MilitaryTemplate,
  DeployedUnit,
  TemplateDesignerState,
  UnitComponent,
  TemplateValidation,
  CombatModifiers,
  TemplateSize,
} from '../types/militaryTemplates';
import { getUnitComponentData, calculateTemplateStats, DEFAULT_TEMPLATES } from '../data/militaryTemplates';

interface UseMilitaryTemplatesOptions {
  currentTurn: number;
  nations: Array<{ id: string; name: string }>;
}

export function useMilitaryTemplates({ currentTurn, nations }: UseMilitaryTemplatesOptions) {
  const [templateStates, setTemplateStates] = useState<Map<string, TemplateDesignerState>>(new Map());
  const [deployedUnits, setDeployedUnits] = useState<Map<string, DeployedUnit[]>>(new Map());
  const initializedRef = useRef(false);

  /**
   * Initialize templates for all nations
   */
  const initializeTemplates = useCallback(() => {
    const newStates = new Map<string, TemplateDesignerState>();
    const newDeployedUnits = new Map<string, DeployedUnit[]>();

    nations.forEach((nation) => {
      // Initialize with default templates
      const defaultTemplates = DEFAULT_TEMPLATES.map((template, index) => ({
        ...template,
        id: `${nation.id}-template-${index}`,
        nationId: nation.id,
        createdTurn: currentTurn,
        unitsDeployed: 0,
      }));

      newStates.set(nation.id, {
        nationId: nation.id,
        templates: defaultTemplates,
        deployedUnits: [],
        isDesignerOpen: false,
        editingTemplateId: null,
      });

      newDeployedUnits.set(nation.id, []);
    });

    setTemplateStates(newStates);
    setDeployedUnits(newDeployedUnits);
  }, [nations, currentTurn]);

  /**
   * Get templates for a nation
   */
  const getTemplates = useCallback(
    (nationId: string): MilitaryTemplate[] => {
      const state = templateStates.get(nationId);
      return state?.templates || [];
    },
    [templateStates]
  );

  /**
   * Get a specific template
   */
  const getTemplate = useCallback(
    (nationId: string, templateId: string): MilitaryTemplate | undefined => {
      const state = templateStates.get(nationId);
      return state?.templates.find((t) => t.id === templateId);
    },
    [templateStates]
  );

  /**
   * Create a new template
   */
  const createTemplate = useCallback(
    (
      nationId: string,
      name: string,
      description: string,
      size: TemplateSize,
      mainComponents: UnitComponent[],
      supportComponents: UnitComponent[]
    ): { success: boolean; message: string; templateId?: string } => {
      // Validate template
      const validation = validateTemplate(mainComponents, supportComponents);
      if (!validation.isValid) {
        return {
          success: false,
          message: `Invalid template: ${validation.errors.join(', ')}`,
        };
      }

      // Calculate stats
      const stats = calculateTemplateStats(mainComponents, supportComponents);

      const newTemplate: MilitaryTemplate = {
        id: `${nationId}-template-${Date.now()}`,
        nationId,
        name,
        description,
        icon: '🪖',
        size,
        mainComponents,
        supportComponents,
        stats,
        createdTurn: currentTurn,
        isActive: true,
        isDefault: false,
        unitsDeployed: 0,
      };

      setTemplateStates((prev) => {
        const newStates = new Map(prev);
        const state = newStates.get(nationId);

        if (!state) return prev;

        state.templates.push(newTemplate);
        newStates.set(nationId, { ...state });

        return newStates;
      });

      return {
        success: true,
        message: `Template "${name}" created successfully`,
        templateId: newTemplate.id,
      };
    },
    [currentTurn]
  );

  /**
   * Update an existing template
   */
  const updateTemplate = useCallback(
    (
      nationId: string,
      templateId: string,
      updates: {
        name?: string;
        description?: string;
        mainComponents?: UnitComponent[];
        supportComponents?: UnitComponent[];
      }
    ): { success: boolean; message: string } => {
      setTemplateStates((prev) => {
        const newStates = new Map(prev);
        const state = newStates.get(nationId);

        if (!state) return prev;

        const templateIndex = state.templates.findIndex((t) => t.id === templateId);
        if (templateIndex === -1) {
          return prev;
        }

        const template = state.templates[templateIndex];

        // Check if template is in use
        if (template.unitsDeployed > 0) {
          console.warn('Cannot modify template that has deployed units');
          return prev;
        }

        // Apply updates
        const updatedTemplate = { ...template };
        if (updates.name) updatedTemplate.name = updates.name;
        if (updates.description) updatedTemplate.description = updates.description;
        if (updates.mainComponents) updatedTemplate.mainComponents = updates.mainComponents;
        if (updates.supportComponents) updatedTemplate.supportComponents = updates.supportComponents;

        // Recalculate stats if components changed
        if (updates.mainComponents || updates.supportComponents) {
          updatedTemplate.stats = calculateTemplateStats(
            updatedTemplate.mainComponents,
            updatedTemplate.supportComponents
          );
        }

        state.templates[templateIndex] = updatedTemplate;
        newStates.set(nationId, { ...state });

        return newStates;
      });

      return { success: true, message: 'Template updated successfully' };
    },
    []
  );

  /**
   * Delete a template
   */
  const deleteTemplate = useCallback(
    (nationId: string, templateId: string): { success: boolean; message: string } => {
      const state = templateStates.get(nationId);
      if (!state) {
        return { success: false, message: 'Nation not found' };
      }

      const template = state.templates.find((t) => t.id === templateId);
      if (!template) {
        return { success: false, message: 'Template not found' };
      }

      if (template.unitsDeployed > 0) {
        return {
          success: false,
          message: `Cannot delete template with ${template.unitsDeployed} deployed units`,
        };
      }

      setTemplateStates((prev) => {
        const newStates = new Map(prev);
        const state = newStates.get(nationId)!;

        state.templates = state.templates.filter((t) => t.id !== templateId);
        newStates.set(nationId, { ...state });

        return newStates;
      });

      return { success: true, message: 'Template deleted successfully' };
    },
    [templateStates]
  );

  /**
   * Deploy a unit from a template
   */
  const deployUnit = useCallback(
    (
      nationId: string,
      templateId: string,
      unitName: string,
      territoryId: string | null
    ): { success: boolean; message: string; unitId?: string } => {
      const template = getTemplate(nationId, templateId);
      if (!template) {
        return { success: false, message: 'Template not found' };
      }

      const newUnit: DeployedUnit = {
        id: `${nationId}-unit-${Date.now()}`,
        nationId,
        templateId,
        name: unitName || `${template.name} #${template.unitsDeployed + 1}`,
        territoryId,
        health: 100,
        organization: 100,
        experience: 0,
        supplyLevel: 100,
        isSupplied: true,
        isInCombat: false,
        deployedTurn: currentTurn,
        veterancy: 'green',
      };

      setDeployedUnits((prev) => {
        const newUnits = new Map(prev);
        const units = newUnits.get(nationId) || [];
        units.push(newUnit);
        newUnits.set(nationId, units);
        return newUnits;
      });

      // Increment deployed count on template
      setTemplateStates((prev) => {
        const newStates = new Map(prev);
        const state = newStates.get(nationId)!;
        const templateIndex = state.templates.findIndex((t) => t.id === templateId);
        state.templates[templateIndex].unitsDeployed++;
        newStates.set(nationId, { ...state });
        return newStates;
      });

      return {
        success: true,
        message: `Unit "${newUnit.name}" deployed successfully`,
        unitId: newUnit.id,
      };
    },
    [getTemplate, currentTurn]
  );

  /**
   * Get deployed units for a nation
   */
  const getDeployedUnits = useCallback(
    (nationId: string): DeployedUnit[] => {
      return deployedUnits.get(nationId) || [];
    },
    [deployedUnits]
  );

  /**
   * Update unit status (health, organization, supply, etc.)
   */
  const updateUnitStatus = useCallback(
    (
      nationId: string,
      unitId: string,
      updates: Partial<
        Pick<DeployedUnit, 'health' | 'organization' | 'experience' | 'supplyLevel' | 'isSupplied' | 'territoryId'>
      >
    ) => {
      setDeployedUnits((prev) => {
        const newUnits = new Map(prev);
        const units = newUnits.get(nationId) || [];
        const unitIndex = units.findIndex((u) => u.id === unitId);

        if (unitIndex === -1) return prev;

        const unit = { ...units[unitIndex], ...updates };

        // Update veterancy based on experience
        if (updates.experience !== undefined) {
          if (unit.experience >= 75) unit.veterancy = 'elite';
          else if (unit.experience >= 50) unit.veterancy = 'veteran';
          else if (unit.experience >= 25) unit.veterancy = 'regular';
          else unit.veterancy = 'green';
        }

        units[unitIndex] = unit;
        newUnits.set(nationId, units);
        return newUnits;
      });
    },
    []
  );

  /**
   * Calculate combat effectiveness for a unit
   */
  const calculateCombatEffectiveness = useCallback(
    (unitId: string): CombatModifiers | null => {
      for (const [nationId, units] of deployedUnits.entries()) {
        const unit = units.find((u) => u.id === unitId);
        if (unit) {
          const supplyModifier = Math.max(0.5, unit.supplyLevel / 100);
          const organizationModifier = Math.max(0.5, unit.organization / 100);
          const experienceModifier = 1.0 + (unit.experience / 100) * 0.5; // Up to 1.5x
          const veterancyBonus =
            unit.veterancy === 'elite' ? 0.3 : unit.veterancy === 'veteran' ? 0.2 : unit.veterancy === 'regular' ? 0.1 : 0;

          const totalEffectiveness = supplyModifier * organizationModifier * experienceModifier * (1 + veterancyBonus);

          return {
            supplyModifier,
            organizationModifier,
            experienceModifier,
            veterancyBonus,
            totalEffectiveness,
          };
        }
      }
      return null;
    },
    [deployedUnits]
  );

  /**
   * Process unit maintenance each turn (attrition, recovery)
   */
  const processTurnMaintenance = useCallback(() => {
    setDeployedUnits((prev) => {
      const newUnits = new Map(prev);

      for (const [nationId, units] of newUnits.entries()) {
        const updatedUnits = units.map((unit) => {
          const updatedUnit = { ...unit };

          // Recover organization if not in combat
          if (!updatedUnit.isInCombat) {
            const template = getTemplate(nationId, unit.templateId);
            const recoveryRate = template?.stats.recovery || 10;
            updatedUnit.organization = Math.min(100, updatedUnit.organization + recoveryRate);
          }

          // Gain experience slowly over time
          if (updatedUnit.isInCombat) {
            updatedUnit.experience = Math.min(100, updatedUnit.experience + 2);
          }

          // Health recovery if supplied and not in combat
          if (!updatedUnit.isInCombat && updatedUnit.isSupplied && updatedUnit.health < 100) {
            updatedUnit.health = Math.min(100, updatedUnit.health + 5);
          }

          return updatedUnit;
        });

        newUnits.set(nationId, updatedUnits);
      }

      return newUnits;
    });
  }, [getTemplate]);

  /**
   * Validate template composition
   */
  const validateTemplate = (
    mainComponents: UnitComponent[],
    supportComponents: UnitComponent[]
  ): TemplateValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check limits
    if (mainComponents.length === 0) {
      errors.push('Template must have at least one main component');
    }
    if (mainComponents.length > 10) {
      errors.push('Template cannot have more than 10 main components');
    }
    if (supportComponents.length > 5) {
      errors.push('Template cannot have more than 5 support components');
    }

    // Check combat width
    let totalWidth = 0;
    mainComponents.forEach((comp) => {
      const data = getUnitComponentData(comp);
      if (data) totalWidth += data.combatWidth;
    });
    supportComponents.forEach((comp) => {
      const data = getUnitComponentData(comp);
      if (data) totalWidth += data.combatWidth;
    });

    let combatWidthStatus: 'under' | 'optimal' | 'over' = 'optimal';
    if (totalWidth < 20) {
      warnings.push('Combat width is low, consider adding more components');
      combatWidthStatus = 'under';
    } else if (totalWidth > 25) {
      warnings.push('Combat width exceeds 25, unit will suffer penalties');
      combatWidthStatus = 'over';
    }

    // Determine balance
    const stats = calculateTemplateStats(mainComponents, supportComponents);
    let balanceRating: 'offensive' | 'defensive' | 'balanced' | 'support' = 'balanced';
    if (stats.breakthrough > stats.defense * 1.5) balanceRating = 'offensive';
    else if (stats.defense > stats.breakthrough * 1.5) balanceRating = 'defensive';
    else if (stats.reconnaissance > 20 && stats.suppression > 10) balanceRating = 'support';

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      combatWidthStatus,
      balanceRating,
    };
  };

  // Initialize on mount
  useEffect(() => {
    if (!initializedRef.current && templateStates.size === 0) {
      initializedRef.current = true;
      initializeTemplates();
    }
  }, [templateStates.size]);

  return {
    // State
    templateStates,
    deployedUnits,

    // Queries
    getTemplates,
    getTemplate,
    getDeployedUnits,
    calculateCombatEffectiveness,

    // Mutations
    createTemplate,
    updateTemplate,
    deleteTemplate,
    deployUnit,
    updateUnitStatus,

    // Turn processing
    processTurnMaintenance,

    // Utilities
    validateTemplate,

    // Initialization
    initializeTemplates,
  };
}
