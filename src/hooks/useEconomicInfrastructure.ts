import { useCallback, useMemo, useState } from "react";
import type {
  BuildingProject,
  EconomicInfrastructureSystem,
  EconomicZone,
  InfrastructureStatistics,
  UseEconomicInfrastructureParams,
} from "@/types/economicDepth";

export function useEconomicInfrastructure(
  params: UseEconomicInfrastructureParams,
): EconomicInfrastructureSystem {
  const { initialProjects = [], initialZones = [] } = params;

  const [projects, setProjects] = useState<BuildingProject[]>(initialProjects);
  const [zones, setZones] = useState<EconomicZone[]>(initialZones);

  const statistics = useMemo<InfrastructureStatistics>(() => {
    if (projects.length === 0) {
      return {
        averageLevel: 0,
        damagedStructures: 0,
        totalMaintenance: zones.reduce((total, zone) => total + zone.maintenanceCost, 0),
        activeZones: zones.length,
      };
    }

    const averageLevel =
      projects.reduce((total, project) => total + project.level, 0) / projects.length;

    const damagedStructures = projects.filter((project) => project.isDamaged).length;

    return {
      averageLevel,
      damagedStructures,
      totalMaintenance: zones.reduce((total, zone) => total + zone.maintenanceCost, 0),
      activeZones: zones.length,
    };
  }, [projects, zones]);

  const queueProject = useCallback((project: BuildingProject) => {
    setProjects((current) => {
      if (current.some((existing) => existing.id === project.id)) {
        return current.map((existing) =>
          existing.id === project.id ? { ...existing, ...project } : existing,
        );
      }
      return [...current, project];
    });
  }, []);

  const progressConstruction = useCallback(() => {
    setProjects((current) =>
      current.map((project) => {
        if (project.progress >= project.turnsRequired) {
          return project;
        }

        const newProgress = Math.min(project.turnsRequired, project.progress + 1);
        const isComplete = newProgress >= project.turnsRequired;

        return {
          ...project,
          progress: newProgress,
          level: isComplete ? Math.min(5, project.level + 1) : project.level,
        };
      }),
    );
  }, []);

  const repairProject = useCallback((projectId: string) => {
    setProjects((current) =>
      current.map((project) =>
        project.id === projectId
          ? {
              ...project,
              isDamaged: false,
              durability: Math.min(100, project.durability + 15),
            }
          : project,
      ),
    );
  }, []);

  const createZone = useCallback((zone: EconomicZone) => {
    setZones((current) => {
      if (current.some((existing) => existing.id === zone.id)) {
        return current.map((existing) => (existing.id === zone.id ? { ...existing, ...zone } : existing));
      }
      return [...current, zone];
    });
  }, []);

  const disbandZone = useCallback((zoneId: string) => {
    setZones((current) => current.filter((zone) => zone.id !== zoneId));
  }, []);

  return {
    projects,
    zones,
    statistics,
    queueProject,
    progressConstruction,
    repairProject,
    createZone,
    disbandZone,
  };
}
