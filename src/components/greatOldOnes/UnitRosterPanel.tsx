/**
 * Unit Roster Panel
 * Display and manage cultists, infiltrators, and summoned entities
 */

import React, { useState } from 'react';
import type {
  CultistCell,
  SummonedEntity,
  GreatOldOnesState,
} from '../../types/greatOldOnes';
import type { Infiltrator } from '../../lib/unitRoster';
import { CULTIST_CONFIGS, INFILTRATOR_CONFIGS, ENTITY_CONFIGS } from '../../lib/unitRoster';

interface UnitRosterPanelProps {
  state: GreatOldOnesState;
  infiltrators: Infiltrator[];
  onTrainCultist?: (cellId: string) => void;
  onRecruitInfiltrator?: (type: string, regionId: string) => void;
  onSummonEntity?: (entityType: string, siteId: string) => void;
  onAssignCultist?: (cellId: string, assignment: CultistCell['assignment']) => void;
}

export const UnitRosterPanel: React.FC<UnitRosterPanelProps> = ({
  state,
  infiltrators,
  onTrainCultist,
  onRecruitInfiltrator,
  onSummonEntity,
  onAssignCultist,
}) => {
  const [activeTab, setActiveTab] = useState<'cultists' | 'infiltrators' | 'entities'>('cultists');

  return (
    <div className="unit-roster-panel">
      <div className="panel-header">
        <h3>Unit Roster</h3>
        <div className="roster-tabs">
          <button
            className={`tab ${activeTab === 'cultists' ? 'active' : ''}`}
            onClick={() => setActiveTab('cultists')}
          >
            Cultists ({state.cultistCells.length})
          </button>
          <button
            className={`tab ${activeTab === 'infiltrators' ? 'active' : ''}`}
            onClick={() => setActiveTab('infiltrators')}
          >
            Infiltrators ({infiltrators.length})
          </button>
          <button
            className={`tab ${activeTab === 'entities' ? 'active' : ''}`}
            onClick={() => setActiveTab('entities')}
          >
            Entities ({state.summonedEntities.length})
          </button>
        </div>
      </div>

      <div className="roster-content">
        {activeTab === 'cultists' && (
          <CultistRoster
            cells={state.cultistCells}
            state={state}
            onTrain={onTrainCultist}
            onAssign={onAssignCultist}
          />
        )}

        {activeTab === 'infiltrators' && (
          <InfiltratorRoster
            infiltrators={infiltrators}
            state={state}
            onRecruit={onRecruitInfiltrator}
          />
        )}

        {activeTab === 'entities' && (
          <EntityRoster
            entities={state.summonedEntities}
            state={state}
            onSummon={onSummonEntity}
          />
        )}
      </div>
    </div>
  );
};

interface CultistRosterProps {
  cells: CultistCell[];
  state: GreatOldOnesState;
  onTrain?: (cellId: string) => void;
  onAssign?: (cellId: string, assignment: CultistCell['assignment']) => void;
}

const CultistRoster: React.FC<CultistRosterProps> = ({
  cells,
  state,
  onTrain,
  onAssign,
}) => {
  if (cells.length === 0) {
    return (
      <div className="empty-roster">
        <p>No cultist cells established yet.</p>
        <p className="help-text">Recruit initiates through mission completion or regional operations.</p>
      </div>
    );
  }

  // Group cells by tier
  const cellsByTier = {
    initiate: cells.filter(c => c.tier === 'initiate'),
    acolyte: cells.filter(c => c.tier === 'acolyte'),
    high_priest: cells.filter(c => c.tier === 'high_priest'),
  };

  return (
    <div className="cultist-roster">
      {Object.entries(cellsByTier).map(([tier, tierCells]) => {
        if (tierCells.length === 0) return null;

        const config = CULTIST_CONFIGS[tier as keyof typeof CULTIST_CONFIGS];

        return (
          <div key={tier} className="tier-section">
            <h4>{config.name}s ({tierCells.length})</h4>
            <div className="cells-grid">
              {tierCells.map(cell => {
                const region = state.regions.find(r => r.regionId === cell.regionId);
                return (
                  <div key={cell.id} className={`cultist-cell tier-${tier} ${cell.compromised ? 'compromised' : ''}`}>
                    <div className="cell-header">
                      <span className="cell-count">{cell.count} cultists</span>
                      <span className="cell-region">{region?.regionName || 'Unknown'}</span>
                    </div>

                    <div className="cell-stats">
                      <div className="stat">
                        <span className="label">Attunement</span>
                        <span className="value">{cell.attunement}/100</span>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${cell.attunement}%` }} />
                        </div>
                      </div>

                      <div className="stat">
                        <span className="label">Assignment</span>
                        <span className="value assignment">{cell.assignment}</span>
                      </div>

                      <div className="stat-row">
                        <div className="stat-item">
                          <span className="icon">⚔️</span>
                          <span className="value">{config.stats.combatPower}</span>
                        </div>
                        <div className="stat-item">
                          <span className="icon">🕯️</span>
                          <span className="value">{config.stats.ritualSkill}</span>
                        </div>
                        <div className="stat-item">
                          <span className="icon">🎭</span>
                          <span className="value">{config.stats.infiltrationSkill}</span>
                        </div>
                        <div className="stat-item">
                          <span className="icon">🧠</span>
                          <span className="value">{config.stats.sanityYield}/turn</span>
                        </div>
                      </div>
                    </div>

                    <div className="cell-actions">
                      {cell.tier !== 'high_priest' && (
                        <button
                          className="train-button"
                          onClick={() => onTrain?.(cell.id)}
                        >
                          Train to {cell.tier === 'initiate' ? 'Acolyte' : 'High Priest'}
                        </button>
                      )}

                      <select
                        className="assignment-select"
                        value={cell.assignment}
                        onChange={(e) => onAssign?.(cell.id, e.target.value as CultistCell['assignment'])}
                      >
                        {config.availableAssignments.map(assignment => (
                          <option key={assignment} value={assignment}>
                            {assignment.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </div>

                    {cell.compromised && (
                      <div className="warning">
                        <span className="warning-icon">⚠️</span>
                        <span>COMPROMISED - High exposure risk</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface InfiltratorRosterProps {
  infiltrators: Infiltrator[];
  state: GreatOldOnesState;
  onRecruit?: (type: string, regionId: string) => void;
}

const InfiltratorRoster: React.FC<InfiltratorRosterProps> = ({
  infiltrators,
  state,
  onRecruit,
}) => {
  const [selectedType, setSelectedType] = useState<string>('corporate_saboteur');
  const [selectedRegion, setSelectedRegion] = useState<string>(state.regions[0]?.regionId || '');

  return (
    <div className="infiltrator-roster">
      <div className="recruitment-section">
        <h4>Recruit Infiltrator</h4>
        <div className="recruitment-form">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            {Object.keys(INFILTRATOR_CONFIGS).map(type => {
              const config = INFILTRATOR_CONFIGS[type as keyof typeof INFILTRATOR_CONFIGS];
              return (
                <option key={type} value={type}>
                  {config.name} ({config.recruitmentCost.sanityFragments} SF, {config.recruitmentCost.eldritchPower} EP)
                </option>
              );
            })}
          </select>

          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
          >
            {state.regions.map(region => (
              <option key={region.regionId} value={region.regionId}>
                {region.regionName}
              </option>
            ))}
          </select>

          <button
            className="recruit-button"
            onClick={() => onRecruit?.(selectedType, selectedRegion)}
          >
            Recruit
          </button>
        </div>
      </div>

      {infiltrators.length === 0 ? (
        <div className="empty-roster">
          <p>No infiltrators recruited yet.</p>
        </div>
      ) : (
        <div className="infiltrators-grid">
          {infiltrators.map(infiltrator => {
            const config = INFILTRATOR_CONFIGS[infiltrator.type];
            const region = state.regions.find(r => r.regionId === infiltrator.regionId);

            return (
              <div
                key={infiltrator.id}
                className={`infiltrator-card ${infiltrator.exposed ? 'exposed' : ''}`}
              >
                <div className="infiltrator-header">
                  <h5>{infiltrator.name}</h5>
                  <span className="infiltrator-type">{config.name}</span>
                </div>

                <div className="infiltrator-location">
                  <span className="region">{region?.regionName || 'Unknown'}</span>
                  <span className="institution">{infiltrator.targetInstitution}</span>
                </div>

                <div className="infiltrator-stats">
                  <div className="stat">
                    <span className="label">Infiltration Depth</span>
                    <span className="value">{infiltrator.depth}%</span>
                    <div className="progress-bar">
                      <div className="progress-fill depth" style={{ width: `${infiltrator.depth}%` }} />
                    </div>
                  </div>

                  <div className="stat">
                    <span className="label">Influence</span>
                    <span className="value">{infiltrator.influence}%</span>
                    <div className="progress-bar">
                      <div className="progress-fill influence" style={{ width: `${infiltrator.influence}%` }} />
                    </div>
                  </div>
                </div>

                <div className="available-operations">
                  <h6>Available Operations</h6>
                  <ul>
                    {config.operations.map(op => (
                      <li
                        key={op.id}
                        className={infiltrator.depth >= op.requiredDepth ? 'available' : 'locked'}
                      >
                        <span className="op-name">{op.name}</span>
                        <span className="op-requirement">
                          {infiltrator.depth >= op.requiredDepth ? '✓' : `${op.requiredDepth}% depth required`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {infiltrator.currentTask && (
                  <div className="current-task">
                    <h6>Current Task</h6>
                    <p>{infiltrator.currentTask.description}</p>
                    <span className="task-timer">{infiltrator.currentTask.turnsRemaining} turns remaining</span>
                  </div>
                )}

                {infiltrator.exposed && (
                  <div className="warning">
                    <span className="warning-icon">⚠️</span>
                    <span>EXPOSED - Infiltrator burned</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface EntityRosterProps {
  entities: SummonedEntity[];
  state: GreatOldOnesState;
  onSummon?: (entityType: string, siteId: string) => void;
}

const EntityRoster: React.FC<EntityRosterProps> = ({
  entities,
  state,
  onSummon,
}) => {
  const [selectedEntity, setSelectedEntity] = useState<string>('servitor');
  const [selectedSite, setSelectedSite] = useState<string>('');

  // Get all sites across regions
  const allSites = state.regions.flatMap(region =>
    region.ritualSites.map(site => ({ site, regionName: region.regionName }))
  );

  return (
    <div className="entity-roster">
      <div className="summoning-section">
        <h4>Summon Entity</h4>
        <div className="summoning-form">
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
          >
            {Object.keys(ENTITY_CONFIGS).map(entityType => {
              const config = ENTITY_CONFIGS[entityType];
              return (
                <option key={entityType} value={entityType}>
                  {config.name} (Tier {config.tier})
                </option>
              );
            })}
          </select>

          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
          >
            <option value="">Select Site...</option>
            {allSites.map(({ site, regionName }) => (
              <option key={site.id} value={site.id}>
                {site.name} ({regionName})
              </option>
            ))}
          </select>

          <button
            className="summon-button"
            onClick={() => selectedSite && onSummon?.(selectedEntity, selectedSite)}
            disabled={!selectedSite}
          >
            Summon
          </button>
        </div>

        {selectedEntity && ENTITY_CONFIGS[selectedEntity] && (
          <div className="entity-info">
            <p className="description">{ENTITY_CONFIGS[selectedEntity].description}</p>
            <div className="requirements">
              <span>Cost: {ENTITY_CONFIGS[selectedEntity].summoning.sanityFragmentCost} SF, {ENTITY_CONFIGS[selectedEntity].summoning.eldritchPowerCost} EP</span>
              <span>Duration: {ENTITY_CONFIGS[selectedEntity].summoning.summoningTurns} turns</span>
              <span>Required Site: {ENTITY_CONFIGS[selectedEntity].summoning.requiredSiteTier}</span>
            </div>
          </div>
        )}
      </div>

      {entities.length === 0 ? (
        <div className="empty-roster">
          <p>No entities summoned yet.</p>
        </div>
      ) : (
        <div className="entities-grid">
          {entities.map(entity => {
            const region = state.regions.find(r => r.regionId === entity.regionId);
            const entityType = Object.keys(ENTITY_CONFIGS).find(
              key => ENTITY_CONFIGS[key].name === entity.name
            );
            const config = entityType ? ENTITY_CONFIGS[entityType] : null;

            return (
              <div
                key={entity.id}
                className={`entity-card tier-${entity.tier} ${!entity.bound ? 'rampaging' : ''}`}
              >
                <div className="entity-header">
                  <h5>{entity.name}</h5>
                  <span className="entity-tier">{entity.tier}</span>
                </div>

                <div className="entity-location">
                  <span className="region">{region?.regionName || 'Unknown'}</span>
                </div>

                <div className="entity-stats">
                  <div className="stat-row">
                    <div className="stat-item">
                      <span className="label">Power</span>
                      <span className="value">{entity.power}</span>
                    </div>
                    <div className="stat-item">
                      <span className="label">Terror Radius</span>
                      <span className="value">{entity.terrorRadius}</span>
                    </div>
                  </div>

                  <div className="stat">
                    <span className="label">Binding Strength</span>
                    <span className={`value ${entity.bindingStrength < 30 ? 'danger' : entity.bindingStrength < 60 ? 'warning' : 'safe'}`}>
                      {entity.bindingStrength}/100
                    </span>
                    <div className="progress-bar">
                      <div
                        className="progress-fill binding"
                        style={{ width: `${entity.bindingStrength}%` }}
                      />
                    </div>
                  </div>

                  <div className="stat">
                    <span className="label">Task</span>
                    <span className="value task">{entity.task}</span>
                  </div>
                </div>

                {config && (
                  <div className="entity-abilities">
                    <h6>Abilities</h6>
                    <div className="abilities-list">
                      {config.abilities.map(ability => (
                        <span key={ability} className="ability">
                          {ability.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {!entity.bound && (
                  <div className="warning danger">
                    <span className="warning-icon">💀</span>
                    <span>RAMPAGING - Entity out of control!</span>
                  </div>
                )}

                {entity.bindingStrength < 30 && entity.bound && (
                  <div className="warning">
                    <span className="warning-icon">⚠️</span>
                    <span>Binding weakening - rampage imminent</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
