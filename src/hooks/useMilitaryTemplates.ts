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
  ArmyGroup,
  Frontline,
  ArmyGroupSummary,
  ArmyGroupPriority,
  ArmyGroupPosture,
  FrontlineStatus,
  FrontlineSupplyState,
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
        armyGroups: [],
        frontlines: [],
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

  const getTemplateStats = useCallback(
    (
      nationId: string,
      templateId: string,
    ): MilitaryTemplate['stats'] | undefined => {
      const template = getTemplate(nationId, templateId);
      return template?.stats;
    },
    [getTemplate]
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
        armyGroupId: null,
        frontlineId: null,
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

  const getArmyGroups = useCallback(
    (nationId: string): ArmyGroup[] => {
      const state = templateStates.get(nationId);
      return state?.armyGroups ?? [];
    },
    [templateStates]
  );

  const getFrontlines = useCallback(
    (nationId: string): Frontline[] => {
      const state = templateStates.get(nationId);
      return state?.frontlines ?? [];
    },
    [templateStates]
  );

  const createArmyGroup = useCallback(
    (
      nationId: string,
      payload: {
        name: string;
        theater: string;
        posture?: ArmyGroupPosture;
        priority?: ArmyGroupPriority;
        readiness?: number;
        supplyLevel?: number;
        commander?: string;
        headquarters?: string;
        notes?: string;
      }
    ): { success: boolean; message: string; groupId?: string } => {
      if (!payload.name || !payload.theater) {
        return { success: false, message: 'Army group requires name and theater' };
      }

      const groupId = `${nationId}-army-group-${Date.now()}`;
      const newGroup: ArmyGroup = {
        id: groupId,
        nationId,
        name: payload.name,
        theater: payload.theater,
        posture: payload.posture ?? 'defensive',
        priority: payload.priority ?? 'standard',
        readiness: payload.readiness ?? 65,
        supplyLevel: payload.supplyLevel ?? 70,
        frontlineIds: [],
        commander: payload.commander,
        headquarters: payload.headquarters,
        notes: payload.notes,
      };

      let updated = false;
      setTemplateStates((prev) => {
        const newStates = new Map(prev);
        const state = newStates.get(nationId);
        if (!state) {
          return prev;
        }

        updated = true;
        newStates.set(nationId, {
          ...state,
          armyGroups: [...state.armyGroups, newGroup],
        });

        return newStates;
      });

      if (!updated) {
        return { success: false, message: 'Nation not found' };
      }

      return {
        success: true,
        message: `Army group "${payload.name}" created`,
        groupId,
      };
    },
    []
  );

  const updateArmyGroup = useCallback(
    (
      nationId: string,
      groupId: string,
      updates: Partial<
        Pick<
          ArmyGroup,
          'name' | 'theater' | 'posture' | 'priority' | 'readiness' | 'supplyLevel' | 'commander' | 'headquarters' | 'notes'
        >
      >
    ): { success: boolean; message: string } => {
      let updated = false;
      setTemplateStates((prev) => {
        const newStates = new Map(prev);
        const state = newStates.get(nationId);
        if (!state) {
          return prev;
        }

        const groupIndex = state.armyGroups.findIndex((group) => group.id === groupId);
        if (groupIndex === -1) {
          return prev;
        }

        const nextGroup: ArmyGroup = {
          ...state.armyGroups[groupIndex]!,
          ...updates,
        };

        const armyGroups = [...state.armyGroups];
        armyGroups[groupIndex] = nextGroup;
        updated = true;

        newStates.set(nationId, {
          ...state,
          armyGroups,
        });

        return newStates;
      });

      if (!updated) {
        return { success: false, message: 'Army group not found' };
      }

      return { success: true, message: 'Army group updated' };
    },
    []
  );

  const deleteArmyGroup = useCallback(
    (nationId: string, groupId: string): { success: boolean; message: string } => {
      let updated = false;
      let removedFrontlineIds: string[] = [];

      setTemplateStates((prev) => {
        const newStates = new Map(prev);
        const state = newStates.get(nationId);
        if (!state) {
          return prev;
        }

        const group = state.armyGroups.find((entry) => entry.id === groupId);
        if (!group) {
          return prev;
        }

        removedFrontlineIds = [...group.frontlineIds];
        const armyGroups = state.armyGroups.filter((entry) => entry.id !== groupId);
        const frontlines = state.frontlines.map((frontline) =>
          frontline.armyGroupId === groupId ? { ...frontline, armyGroupId: null } : frontline
        );

        updated = true;
        newStates.set(nationId, {
          ...state,
          armyGroups,
          frontlines,
        });

        return newStates;
      });

      if (!updated) {
        return { success: false, message: 'Army group not found' };
      }

      setDeployedUnits((prev) => {
        const newUnits = new Map(prev);
        const units = newUnits.get(nationId);
        if (!units) {
          return prev;
        }

        const updatedUnits = units.map((unit) => {
          if (unit.armyGroupId === groupId || (unit.frontlineId && removedFrontlineIds.includes(unit.frontlineId))) {
            return { ...unit, armyGroupId: null, frontlineId: null };
          }
          return unit;
        });

        newUnits.set(nationId, updatedUnits);
        return newUnits;
      });

      return { success: true, message: 'Army group removed' };
    },
    []
  );

  const createFrontline = useCallback(
    (
      nationId: string,
      payload: {
        name: string;
        theater: string;
        axis: string;
        objective?: string;
        armyGroupId?: string | null;
        status?: FrontlineStatus;
        supplyState?: FrontlineSupplyState;
        readiness?: number;
        contested?: boolean;
      }
    ): { success: boolean; message: string; frontlineId?: string } => {
      if (!payload.name || !payload.theater || !payload.axis) {
        return { success: false, message: 'Frontline requires name, theater, and axis' };
      }

      const frontlineId = `${nationId}-frontline-${Date.now()}`;
      const assignedGroupId = payload.armyGroupId ?? null;

      const newFrontline: Frontline = {
        id: frontlineId,
        nationId,
        armyGroupId: assignedGroupId,
        name: payload.name,
        theater: payload.theater,
        axis: payload.axis,
        objective: payload.objective,
        status: payload.status ?? 'stable',
        supplyState: payload.supplyState ?? 'secure',
        readiness: payload.readiness ?? 60,
        contested: payload.contested ?? false,
      };

      let updated = false;
      setTemplateStates((prev) => {
        const newStates = new Map(prev);
        const state = newStates.get(nationId);
        if (!state) {
          return prev;
        }

        const frontlines = [...state.frontlines, newFrontline];
        const armyGroups = assignedGroupId
          ? state.armyGroups.map((group) =>
              group.id === assignedGroupId && !group.frontlineIds.includes(frontlineId)
                ? { ...group, frontlineIds: [...group.frontlineIds, frontlineId] }
                : group
            )
          : state.armyGroups;

        updated = true;
        newStates.set(nationId, {
          ...state,
          frontlines,
          armyGroups,
        });

        return newStates;
      });

      if (!updated) {
        return { success: false, message: 'Nation not found' };
      }

      return {
        success: true,
        message: `Frontline "${payload.name}" created`,
        frontlineId,
      };
    },
    []
  );

  const updateFrontline = useCallback(
    (
      nationId: string,
      frontlineId: string,
      updates: Partial<
        Pick<
          Frontline,
          'name' | 'theater' | 'axis' | 'objective' | 'status' | 'supplyState' | 'readiness' | 'contested' | 'armyGroupId'
        >
      >
    ): { success: boolean; message: string } => {
      let updated = false;
      setTemplateStates((prev) => {
        const newStates = new Map(prev);
        const state = newStates.get(nationId);
        if (!state) {
          return prev;
        }

        const frontlineIndex = state.frontlines.findIndex((frontline) => frontline.id === frontlineId);
        if (frontlineIndex === -1) {
          return prev;
        }

        const currentFrontline = state.frontlines[frontlineIndex]!;
        const nextGroupId = updates.armyGroupId ?? currentFrontline.armyGroupId;
        const nextFrontline: Frontline = {
          ...currentFrontline,
          ...updates,
          armyGroupId: nextGroupId ?? null,
        };

        const frontlines = [...state.frontlines];
        frontlines[frontlineIndex] = nextFrontline;

        let armyGroups = state.armyGroups;
        if (updates.armyGroupId !== undefined && updates.armyGroupId !== currentFrontline.armyGroupId) {
          armyGroups = state.armyGroups.map((group) => {
            if (group.id === updates.armyGroupId) {
              const ids = group.frontlineIds.includes(frontlineId)
                ? group.frontlineIds
                : [...group.frontlineIds, frontlineId];
              return { ...group, frontlineIds: ids };
            }
            if (group.id === currentFrontline.armyGroupId) {
              return { ...group, frontlineIds: group.frontlineIds.filter((id) => id !== frontlineId) };
            }
            return group;
          });
        }

        updated = true;
        newStates.set(nationId, {
          ...state,
          frontlines,
          armyGroups,
        });

        return newStates;
      });

      if (!updated) {
        return { success: false, message: 'Frontline not found' };
      }

      return { success: true, message: 'Frontline updated' };
    },
    []
  );

  const deleteFrontline = useCallback(
    (nationId: string, frontlineId: string): { success: boolean; message: string } => {
      let updated = false;

      setTemplateStates((prev) => {
        const newStates = new Map(prev);
        const state = newStates.get(nationId);
        if (!state) {
          return prev;
        }

        const frontline = state.frontlines.find((entry) => entry.id === frontlineId);
        if (!frontline) {
          return prev;
        }

        const frontlines = state.frontlines.filter((entry) => entry.id !== frontlineId);
        const armyGroups = frontline.armyGroupId
          ? state.armyGroups.map((group) =>
              group.id === frontline.armyGroupId
                ? { ...group, frontlineIds: group.frontlineIds.filter((id) => id !== frontlineId) }
                : group
            )
          : state.armyGroups;

        updated = true;
        newStates.set(nationId, {
          ...state,
          frontlines,
          armyGroups,
        });

        return newStates;
      });

      if (!updated) {
        return { success: false, message: 'Frontline not found' };
      }

      setDeployedUnits((prev) => {
        const newUnits = new Map(prev);
        const units = newUnits.get(nationId);
        if (!units) {
          return prev;
        }

        const updatedUnits = units.map((unit) =>
          unit.frontlineId === frontlineId ? { ...unit, frontlineId: null } : unit
        );

        newUnits.set(nationId, updatedUnits);
        return newUnits;
      });

      return { success: true, message: 'Frontline removed' };
    },
    []
  );

  const assignFrontlineToGroup = useCallback(
    (
      nationId: string,
      frontlineId: string,
      groupId: string | null
    ): { success: boolean; message: string } => {
      return updateFrontline(nationId, frontlineId, { armyGroupId: groupId });
    },
    [updateFrontline]
  );

  const setUnitGrouping = useCallback(
    (
      nationId: string,
      unitId: string,
      grouping: { armyGroupId?: string | null; frontlineId?: string | null }
    ): { success: boolean; message: string } => {
      let resolvedArmyGroupId = grouping.armyGroupId;

      if (grouping.frontlineId !== undefined && grouping.frontlineId !== null) {
        const state = templateStates.get(nationId);
        const frontline = state?.frontlines.find((entry) => entry.id === grouping.frontlineId);
        if (frontline?.armyGroupId && resolvedArmyGroupId === undefined) {
          resolvedArmyGroupId = frontline.armyGroupId;
        }
      }

      let updated = false;
      setDeployedUnits((prev) => {
        const newUnits = new Map(prev);
        const units = newUnits.get(nationId);
        if (!units) {
          return prev;
        }

        const unitIndex = units.findIndex((unit) => unit.id === unitId);
        if (unitIndex === -1) {
          return prev;
        }

        const unit = { ...units[unitIndex]! };
        if (resolvedArmyGroupId !== undefined) {
          unit.armyGroupId = resolvedArmyGroupId;
        }
        if (grouping.frontlineId !== undefined) {
          unit.frontlineId = grouping.frontlineId;
        }

        const updatedUnits = [...units];
        updatedUnits[unitIndex] = unit;
        newUnits.set(nationId, updatedUnits);
        updated = true;
        return newUnits;
      });

      if (!updated) {
        return { success: false, message: 'Unit not found' };
      }

      return { success: true, message: 'Unit grouping updated' };
    },
    [templateStates]
  );

  const getArmyGroupSummaries = useCallback(
    (nationId: string): ArmyGroupSummary[] => {
      const state = templateStates.get(nationId);
      if (!state) {
        return [];
      }

      const units = deployedUnits.get(nationId) ?? [];

      return state.armyGroups.map((group) => {
        const frontlines = state.frontlines.filter((frontline) => frontline.armyGroupId === group.id);
        const assignedUnits = units.filter((unit) => unit.armyGroupId === group.id);

        const readiness = assignedUnits.length
          ? Math.round(
              assignedUnits.reduce((total, unit) => total + unit.organization, 0) / assignedUnits.length
            )
          : Math.round(group.readiness);

        const supplyLevel = assignedUnits.length
          ? Math.round(assignedUnits.reduce((total, unit) => total + unit.supplyLevel, 0) / assignedUnits.length)
          : Math.round(group.supplyLevel);

        return {
          group,
          frontlines,
          units: assignedUnits,
          readiness: Math.max(0, Math.min(100, readiness)),
          supplyLevel: Math.max(0, Math.min(100, supplyLevel)),
        };
      });
    },
    [deployedUnits, templateStates]
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
    (
      unitId: string,
      doctrineModifiers?: { professionalism?: number; tradition?: number }
    ): CombatModifiers | null => {
      for (const [nationId, units] of deployedUnits.entries()) {
        const unit = units.find((u) => u.id === unitId);
        if (unit) {
          const supplyModifier = Math.max(0.5, unit.supplyLevel / 100);
          const organizationModifier = Math.max(0.5, unit.organization / 100);
          const experienceModifier = 1.0 + (unit.experience / 100) * 0.5; // Up to 1.5x
          const veterancyBonus =
            unit.veterancy === 'elite' ? 0.3 : unit.veterancy === 'veteran' ? 0.2 : unit.veterancy === 'regular' ? 0.1 : 0;

          const professionalismValue = Math.min(
            100,
            Math.max(0, doctrineModifiers?.professionalism ?? 50),
          );
          const traditionValue = Math.min(100, Math.max(0, doctrineModifiers?.tradition ?? 50));
          const professionalismModifierRaw = 1 + ((professionalismValue - 50) / 100) * 0.4;
          const traditionModifierRaw = 1 - ((traditionValue - 50) / 100) * 0.3;
          const doctrineSkew = Math.abs(professionalismValue - traditionValue) / 100;
          const balanceModifierRaw = 1 - doctrineSkew * 0.2;

          const professionalismModifier = Number(Math.max(0.6, professionalismModifierRaw).toFixed(3));
          const traditionModifier = Number(Math.max(0.5, traditionModifierRaw).toFixed(3));
          const doctrineBalanceModifier = Number(Math.max(0.75, balanceModifierRaw).toFixed(3));

          const baseEffectiveness = supplyModifier * organizationModifier * experienceModifier * (1 + veterancyBonus);
          const totalEffectiveness = Number(
            (
              baseEffectiveness *
              professionalismModifier *
              traditionModifier *
              doctrineBalanceModifier
            ).toFixed(3),
          );

          return {
            supplyModifier,
            organizationModifier,
            experienceModifier,
            veterancyBonus,
            professionalismModifier,
            traditionModifier,
            doctrineBalanceModifier,
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
    getTemplateStats,
    getDeployedUnits,
    getArmyGroups,
    getFrontlines,
    getArmyGroupSummaries,
    calculateCombatEffectiveness,

    // Mutations
    createTemplate,
    updateTemplate,
    deleteTemplate,
    deployUnit,
    updateUnitStatus,
    createArmyGroup,
    updateArmyGroup,
    deleteArmyGroup,
    createFrontline,
    updateFrontline,
    deleteFrontline,
    assignFrontlineToGroup,
    setUnitGrouping,

    // Turn processing
    processTurnMaintenance,

    // Utilities
    validateTemplate,

    // Initialization
    initializeTemplates,
  };
}

export type UseMilitaryTemplatesApi = ReturnType<typeof useMilitaryTemplates>;
