/**
 * Mission Board Panel
 * Display available missions, active missions, and completed missions
 */

import React, { useState } from 'react';
import type { Mission, MissionOutcome } from '../../lib/missionGenerator';
import type { GreatOldOnesState } from '../../types/greatOldOnes';

interface MissionBoardPanelProps {
  state: GreatOldOnesState;
  availableMissions: Mission[];
  activeMissions: Mission[];
  onAcceptMission?: (missionId: string) => void;
  onAbandonMission?: (missionId: string) => void;
  onViewMissionDetails?: (missionId: string) => void;
}

export const MissionBoardPanel: React.FC<MissionBoardPanelProps> = ({
  state,
  availableMissions,
  activeMissions,
  onAcceptMission,
  onAbandonMission,
  onViewMissionDetails,
}) => {
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'completed'>('available');

  return (
    <div className="mission-board-panel">
      <div className="panel-header">
        <h3>Mission Board</h3>
        <div className="mission-tabs">
          <button
            className={`tab ${activeTab === 'available' ? 'active' : ''}`}
            onClick={() => setActiveTab('available')}
          >
            Available ({availableMissions.length})
          </button>
          <button
            className={`tab ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active ({activeMissions.length})
          </button>
          <button
            className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed
          </button>
        </div>
      </div>

      <div className="mission-list">
        {activeTab === 'available' && (
          <div className="available-missions">
            {availableMissions.length === 0 ? (
              <p className="empty-state">No missions available. Check back next turn.</p>
            ) : (
              availableMissions.map(mission => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  state={state}
                  onAccept={onAcceptMission}
                  onViewDetails={onViewMissionDetails}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'active' && (
          <div className="active-missions">
            {activeMissions.length === 0 ? (
              <p className="empty-state">No active missions. Accept a mission to begin.</p>
            ) : (
              activeMissions.map(mission => (
                <ActiveMissionCard
                  key={mission.id}
                  mission={mission}
                  state={state}
                  onAbandon={onAbandonMission}
                  onViewDetails={onViewMissionDetails}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="completed-missions">
            <p className="empty-state">Completed missions will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface MissionCardProps {
  mission: Mission;
  state: GreatOldOnesState;
  onAccept?: (missionId: string) => void;
  onViewDetails?: (missionId: string) => void;
}

const MissionCard: React.FC<MissionCardProps> = ({
  mission,
  state,
  onAccept,
  onViewDetails,
}) => {
  const region = state.regions.find(r => r.regionId === mission.regionId);

  const difficultyColor = mission.difficulty <= 3 ? 'easy' : mission.difficulty <= 6 ? 'medium' : 'hard';
  const categoryIcons: Record<typeof mission.category, string> = {
    harvest_sanity: '🧠',
    perform_ritual: '🕯️',
    spread_corruption: '📰',
    silence_witnesses: '🔪',
    infiltrate_institution: '🎭',
    summon_entity: '👹',
    defend_site: '🛡️',
    counter_investigation: '🕵️',
  };

  return (
    <div className={`mission-card ${difficultyColor}`}>
      <div className="mission-header">
        <div className="mission-icon">{categoryIcons[mission.category]}</div>
        <div className="mission-title">
          <h4>{mission.title}</h4>
          <span className="mission-category">{mission.category.replace(/_/g, ' ')}</span>
        </div>
        <div className="mission-difficulty">
          <span className="difficulty-label">Difficulty</span>
          <span className={`difficulty-value ${difficultyColor}`}>{mission.difficulty}/10</span>
        </div>
      </div>

      <div className="mission-description">
        <p>{mission.description}</p>
      </div>

      <div className="mission-location">
        <span className="location-icon">📍</span>
        <span className="location-name">{region?.regionName || 'Unknown'}</span>
      </div>

      <div className="mission-objectives">
        <h5>Objectives ({mission.objectives.length})</h5>
        <ul>
          {mission.objectives.map(obj => (
            <li key={obj.id} className={obj.completed ? 'completed' : ''}>
              {obj.description}
            </li>
          ))}
        </ul>
      </div>

      <div className="mission-rewards">
        <h5>Rewards</h5>
        <div className="reward-list">
          {mission.rewards.sanityFragments && (
            <span className="reward">🧩 {mission.rewards.sanityFragments} Sanity Fragments</span>
          )}
          {mission.rewards.eldritchPower && (
            <span className="reward">⚡ {mission.rewards.eldritchPower} Eldritch Power</span>
          )}
          {mission.rewards.corruptionGain && (
            <span className="reward">☠️ +{mission.rewards.corruptionGain}% Corruption</span>
          )}
          {mission.rewards.cultistRecruits && (
            <span className="reward">👥 {mission.rewards.cultistRecruits} Cultist Cells</span>
          )}
          {mission.rewards.doctrinePoints && (
            <span className="reward">📜 {mission.rewards.doctrinePoints} Doctrine Points</span>
          )}
          {mission.rewards.specialReward && (
            <span className="reward special">⭐ {mission.rewards.specialReward}</span>
          )}
        </div>
      </div>

      <div className="mission-modifiers">
        <div className="modifier-list">
          {mission.modifiers.lunarPhaseBonus > 0 && (
            <span className="modifier positive">🌕 Lunar Bonus: +{Math.floor(mission.modifiers.lunarPhaseBonus * 100)}%</span>
          )}
          {mission.modifiers.doctrineBonus > 0 && (
            <span className="modifier positive">📖 Doctrine Match: +{Math.floor(mission.modifiers.doctrineBonus * 100)}%</span>
          )}
          {mission.modifiers.investigationPenalty > 0 && (
            <span className="modifier negative">🔍 Investigation Risk: -{Math.floor(mission.modifiers.investigationPenalty * 100)}%</span>
          )}
        </div>
      </div>

      <div className="mission-footer">
        <div className="time-limit">
          <span className="timer-icon">⏱️</span>
          <span>{mission.timeLimit} turns</span>
        </div>
        <div className="mission-actions">
          <button
            className="view-details-button"
            onClick={() => onViewDetails?.(mission.id)}
          >
            Details
          </button>
          <button
            className="accept-button"
            onClick={() => onAccept?.(mission.id)}
          >
            Accept Mission
          </button>
        </div>
      </div>
    </div>
  );
};

interface ActiveMissionCardProps {
  mission: Mission;
  state: GreatOldOnesState;
  onAbandon?: (missionId: string) => void;
  onViewDetails?: (missionId: string) => void;
}

const ActiveMissionCard: React.FC<ActiveMissionCardProps> = ({
  mission,
  state,
  onAbandon,
  onViewDetails,
}) => {
  const region = state.regions.find(r => r.regionId === mission.regionId);
  const turnsElapsed = state.alignment.turn - mission.createdTurn;
  const turnsRemaining = mission.timeLimit - turnsElapsed;
  const isOverdue = turnsRemaining < 0;

  const completedObjectives = mission.objectives.filter(o => o.completed).length;
  const progressPercent = (completedObjectives / mission.objectives.length) * 100;

  return (
    <div className={`active-mission-card ${isOverdue ? 'overdue' : ''}`}>
      <div className="mission-header">
        <h4>{mission.title}</h4>
        <span className="mission-status">
          {isOverdue ? '⚠️ OVERDUE' : `${turnsRemaining} turns left`}
        </span>
      </div>

      <div className="mission-progress">
        <div className="progress-header">
          <span>Objectives: {completedObjectives}/{mission.objectives.length}</span>
          <span>{Math.floor(progressPercent)}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="mission-objectives">
        <ul>
          {mission.objectives.map(obj => (
            <li key={obj.id} className={obj.completed ? 'completed' : 'pending'}>
              <span className="checkbox">{obj.completed ? '✓' : '○'}</span>
              <span className="objective-text">{obj.description}</span>
              {obj.target > 1 && (
                <span className="objective-progress">
                  {obj.progress}/{obj.target}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="mission-actions">
        <button
          className="view-details-button"
          onClick={() => onViewDetails?.(mission.id)}
        >
          Details
        </button>
        <button
          className="abandon-button"
          onClick={() => onAbandon?.(mission.id)}
        >
          Abandon
        </button>
      </div>
    </div>
  );
};

interface MissionOutcomeDisplayProps {
  outcome: MissionOutcome;
  mission: Mission;
}

export const MissionOutcomeDisplay: React.FC<MissionOutcomeDisplayProps> = ({
  outcome,
  mission,
}) => {
  const gradeColors: Record<MissionOutcome['grade'], string> = {
    S: 'grade-s',
    A: 'grade-a',
    B: 'grade-b',
    C: 'grade-c',
    D: 'grade-d',
    F: 'grade-f',
  };

  return (
    <div className={`mission-outcome ${outcome.success ? 'success' : 'failure'}`}>
      <div className="outcome-header">
        <h3>{outcome.success ? '✓ Mission Complete' : '✗ Mission Failed'}</h3>
        <div className={`grade ${gradeColors[outcome.grade]}`}>
          <span className="grade-label">Grade</span>
          <span className="grade-value">{outcome.grade}</span>
        </div>
      </div>

      <div className="outcome-score">
        <span className="score-label">Score</span>
        <span className="score-value">{Math.floor(outcome.score)}</span>
      </div>

      <div className="outcome-feedback">
        <p>{outcome.feedback}</p>
      </div>

      {outcome.success && (
        <div className="outcome-rewards">
          <h4>Rewards Earned</h4>
          <div className="reward-list">
            {outcome.actualRewards.sanityFragments && (
              <div className="reward">
                <span className="icon">🧩</span>
                <span className="amount">+{outcome.actualRewards.sanityFragments}</span>
                <span className="label">Sanity Fragments</span>
              </div>
            )}
            {outcome.actualRewards.eldritchPower && (
              <div className="reward">
                <span className="icon">⚡</span>
                <span className="amount">+{outcome.actualRewards.eldritchPower}</span>
                <span className="label">Eldritch Power</span>
              </div>
            )}
            {outcome.actualRewards.corruptionGain && (
              <div className="reward">
                <span className="icon">☠️</span>
                <span className="amount">+{outcome.actualRewards.corruptionGain}%</span>
                <span className="label">Corruption</span>
              </div>
            )}
            {outcome.actualRewards.doctrinePoints && (
              <div className="reward">
                <span className="icon">📜</span>
                <span className="amount">+{outcome.actualRewards.doctrinePoints}</span>
                <span className="label">Doctrine Points</span>
              </div>
            )}
          </div>
        </div>
      )}

      {(outcome.actualPenalties.veilDamage || outcome.actualPenalties.cultistLosses) && (
        <div className="outcome-penalties">
          <h4>Consequences</h4>
          <div className="penalty-list">
            {outcome.actualPenalties.veilDamage && outcome.actualPenalties.veilDamage > 0 && (
              <div className="penalty">
                <span className="icon">👁️</span>
                <span className="amount">-{outcome.actualPenalties.veilDamage}</span>
                <span className="label">Veil Integrity</span>
              </div>
            )}
            {outcome.actualPenalties.cultistLosses && (
              <div className="penalty">
                <span className="icon">💀</span>
                <span className="amount">-{outcome.actualPenalties.cultistLosses}</span>
                <span className="label">Cultists Lost</span>
              </div>
            )}
            {outcome.actualPenalties.investigationHeat && (
              <div className="penalty">
                <span className="icon">🔍</span>
                <span className="amount">+{outcome.actualPenalties.investigationHeat}</span>
                <span className="label">Investigation Heat</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="outcome-impact">
        <div className="impact-stat">
          <span className="label">Doctrine Impact</span>
          <span className={`value ${outcome.doctrineImpact > 0 ? 'positive' : 'negative'}`}>
            {outcome.doctrineImpact > 0 ? '+' : ''}{outcome.doctrineImpact}
          </span>
        </div>
        <div className="impact-stat">
          <span className="label">Elder One Favor</span>
          <span className={`value ${outcome.elderOneFavor > 0 ? 'positive' : 'negative'}`}>
            {outcome.elderOneFavor > 0 ? '+' : ''}{outcome.elderOneFavor}
          </span>
        </div>
      </div>
    </div>
  );
};
