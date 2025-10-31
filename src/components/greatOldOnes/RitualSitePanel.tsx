/**
 * Ritual Site Management Panel
 * Display and manage ritual sites, upgrades, and power generation
 */

import React from 'react';
import type { RitualSite, GreatOldOnesState } from '../../types/greatOldOnes';
import {
  BIOME_BONUSES,
  SITE_UPGRADE_PATHS,
  getNextUpgradeTier,
  canUpgradeSite,
  calculateSiteDefenses,
} from '../../lib/ritualSiteMechanics';

interface RitualSitePanelProps {
  state: GreatOldOnesState;
  onUpgradeSite?: (siteId: string) => void;
  onAddGlamourVeil?: (siteId: string) => void;
  onAddDefensiveWards?: (siteId: string) => void;
}

export const RitualSitePanel: React.FC<RitualSitePanelProps> = ({
  state,
  onUpgradeSite,
  onAddGlamourVeil,
  onAddDefensiveWards,
}) => {
  // Collect all ritual sites from all regions
  const allSites: Array<{ site: RitualSite; regionName: string }> = [];
  state.regions.forEach(region => {
    region.ritualSites.forEach(site => {
      allSites.push({ site, regionName: region.regionName });
    });
  });

  if (allSites.length === 0) {
    return (
      <div className="ritual-site-panel empty">
        <h3>Ritual Sites</h3>
        <p className="empty-state">No ritual sites established yet.</p>
        <p className="help-text">Establish ritual sites to generate eldritch power and perform rituals.</p>
      </div>
    );
  }

  return (
    <div className="ritual-site-panel">
      <h3>Ritual Sites ({allSites.length})</h3>

      <div className="sites-grid">
        {allSites.map(({ site, regionName }) => (
          <RitualSiteCard
            key={site.id}
            site={site}
            regionName={regionName}
            state={state}
            onUpgrade={onUpgradeSite}
            onAddGlamourVeil={onAddGlamourVeil}
            onAddDefensiveWards={onAddDefensiveWards}
          />
        ))}
      </div>
    </div>
  );
};

interface RitualSiteCardProps {
  site: RitualSite;
  regionName: string;
  state: GreatOldOnesState;
  onUpgrade?: (siteId: string) => void;
  onAddGlamourVeil?: (siteId: string) => void;
  onAddDefensiveWards?: (siteId: string) => void;
}

const RitualSiteCard: React.FC<RitualSiteCardProps> = ({
  site,
  regionName,
  state,
  onUpgrade,
  onAddGlamourVeil,
  onAddDefensiveWards,
}) => {
  const config = SITE_UPGRADE_PATHS[site.type];
  const biomeBonus = BIOME_BONUSES[site.biome];
  const defenses = calculateSiteDefenses(site);
  const nextTier = getNextUpgradeTier(site.type);
  const upgradeCheck = nextTier ? canUpgradeSite(site, state) : null;

  const tierColors: Record<typeof site.type, string> = {
    shrine: 'tier-1',
    temple: 'tier-2',
    nexus: 'tier-3',
    gateway: 'tier-4',
  };

  return (
    <div className={`ritual-site-card ${tierColors[site.type]}`}>
      <div className="site-header">
        <div className="site-title">
          <h4>{site.name}</h4>
          <span className="site-type">{config.name}</span>
        </div>
        <div className="site-location">
          <span className="region">{regionName}</span>
          <span className="biome">{site.biome}</span>
        </div>
      </div>

      <div className="site-stats">
        <div className="stat">
          <span className="label">Stored Power</span>
          <span className="value">
            {site.storedPower} / {config.benefits.powerStorage}
          </span>
          <div className="progress-bar">
            <div
              className="progress-fill power"
              style={{ width: `${(site.storedPower / config.benefits.powerStorage) * 100}%` }}
            />
          </div>
        </div>

        <div className="stat">
          <span className="label">Generation Rate</span>
          <span className="value">
            +{config.benefits.powerGenerationRate} × {biomeBonus.ritualPowerBonus.toFixed(1)}
          </span>
        </div>

        <div className="stat">
          <span className="label">Exposure Risk</span>
          <span className={`value ${site.exposureRisk > 60 ? 'danger' : site.exposureRisk > 30 ? 'warning' : 'safe'}`}>
            {site.exposureRisk}%
          </span>
          <div className="progress-bar">
            <div
              className="progress-fill exposure"
              style={{ width: `${site.exposureRisk}%` }}
            />
          </div>
        </div>
      </div>

      {site.activeRitual && (
        <div className="active-ritual">
          <h5>Active Ritual</h5>
          <p>{site.activeRitual.ritualName}</p>
          <div className="ritual-progress">
            <span>{site.activeRitual.turnsRemaining} turns remaining</span>
            <div className="progress-bar">
              <div
                className="progress-fill ritual"
                style={{ width: `${site.upgradeProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="site-defenses">
        <h5>Defenses</h5>
        <div className="defense-items">
          <div className={`defense-item ${site.hasGlamourVeil ? 'active' : 'inactive'}`}>
            <span className="icon">👁️</span>
            <span className="name">Glamour Veil</span>
            {site.hasGlamourVeil && (
              <span className="bonus">-{Math.floor(defenses.detectionReduction * 100)}% detection</span>
            )}
          </div>
          <div className={`defense-item ${site.hasDefensiveWards ? 'active' : 'inactive'}`}>
            <span className="icon">🛡️</span>
            <span className="name">Defensive Wards</span>
            {site.hasDefensiveWards && (
              <span className="bonus">-{Math.floor(defenses.raidDefense * 100)}% raid damage</span>
            )}
          </div>
        </div>
      </div>

      <div className="site-actions">
        {nextTier && upgradeCheck && (
          <button
            className="upgrade-button"
            onClick={() => onUpgrade?.(site.id)}
            disabled={!upgradeCheck.canUpgrade}
            title={upgradeCheck.reason}
          >
            {upgradeCheck.canUpgrade ? `Upgrade to ${SITE_UPGRADE_PATHS[nextTier].name}` : 'Cannot Upgrade'}
          </button>
        )}

        {site.type !== 'shrine' && !site.hasGlamourVeil && (
          <button
            className="defense-button"
            onClick={() => onAddGlamourVeil?.(site.id)}
          >
            Add Glamour Veil (50 EP)
          </button>
        )}

        {(site.type === 'nexus' || site.type === 'gateway') && !site.hasDefensiveWards && (
          <button
            className="defense-button"
            onClick={() => onAddDefensiveWards?.(site.id)}
          >
            Add Defensive Wards (150 EP)
          </button>
        )}
      </div>

      <div className="biome-info">
        <h5>Biome Benefits: {site.biome}</h5>
        <p className="biome-description">{biomeBonus.description}</p>
        <div className="biome-stats">
          <span>Ritual Power: +{Math.floor((biomeBonus.ritualPowerBonus - 1) * 100)}%</span>
          <span>Sanity Harvest: {biomeBonus.sanityHarvestBonus > 1 ? '+' : ''}{Math.floor((biomeBonus.sanityHarvestBonus - 1) * 100)}%</span>
          <span>Concealment: +{Math.floor((biomeBonus.concealmentBonus - 1) * 100)}%</span>
        </div>
      </div>
    </div>
  );
};
