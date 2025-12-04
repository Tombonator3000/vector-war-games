/**
 * Missile trajectory calculations and rendering for Three.js
 * Ported from Cesium implementation as part of Phase 2 deprecation plan
 */

import * as THREE from 'three';

export interface MissileTrajectory {
  id: string;
  from: { lon: number; lat: number };
  to: { lon: number; lat: number };
  duration: number; // in seconds
  color?: string;
  type?: 'ballistic' | 'cruise' | 'orbital';
}

export interface MissileTrajectoryInstance {
  id: string;
  line: THREE.Line;
  trail: THREE.Line | null;
  startTime: number;
  duration: number;
  progress: number;
  markerPosition: THREE.Vector3;
  allPoints: THREE.Vector3[];
  isComplete: boolean;
  // Original coordinates for dynamic recalculation when morphFactor changes
  from: { lon: number; lat: number };
  to: { lon: number; lat: number };
  type: 'ballistic' | 'cruise' | 'orbital';
  color: string;
}

/**
 * Convert lat/lon coordinates to 3D vector position
 */
type LatLonToVector3Fn = (lon: number, lat: number, radius: number) => THREE.Vector3;

/**
 * Calculate ballistic arc between two points
 * Uses sub-orbital trajectory physics for realistic missile paths
 */
export function calculateBallisticArc(
  fromVec: THREE.Vector3,
  toVec: THREE.Vector3,
  peakHeight: number = 0.5,
  segments: number = 50
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const distance = fromVec.distanceTo(toVec);

  // Calculate midpoint
  const midpoint = new THREE.Vector3().lerpVectors(fromVec, toVec, 0.5);

  // Control point for quadratic bezier curve (raised above surface for arc)
  const controlPoint = midpoint.clone().normalize().multiplyScalar(
    midpoint.length() + peakHeight * distance
  );

  // Generate smooth arc using quadratic Bezier curve
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const t2 = t * t;
    const mt = 1 - t;
    const mt2 = mt * mt;

    // Quadratic Bezier formula: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
    const point = new THREE.Vector3(
      mt2 * fromVec.x + 2 * mt * t * controlPoint.x + t2 * toVec.x,
      mt2 * fromVec.y + 2 * mt * t * controlPoint.y + t2 * toVec.y,
      mt2 * fromVec.z + 2 * mt * t * controlPoint.z + t2 * toVec.z
    );

    points.push(point);
  }

  return points;
}

/**
 * Calculate cruise missile path (follows terrain at low altitude)
 */
export function calculateCruisePath(
  fromVec: THREE.Vector3,
  toVec: THREE.Vector3,
  altitude: number = 0.05,
  segments: number = 30
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;

    // Interpolate along great circle route
    const point = new THREE.Vector3().lerpVectors(fromVec, toVec, t);

    // Maintain constant altitude above surface
    point.normalize().multiplyScalar(fromVec.length() + altitude);

    points.push(point);
  }

  return points;
}

/**
 * Calculate orbital trajectory (for space-based weapons)
 */
export function calculateOrbitalPath(
  fromVec: THREE.Vector3,
  toVec: THREE.Vector3,
  orbitHeight: number = 1.0,
  segments: number = 60
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const earthRadius = fromVec.length();

  // Create elliptical orbit that passes through both points
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * Math.PI; // Half orbit from point A to B

    const midpoint = new THREE.Vector3().lerpVectors(fromVec, toVec, t);
    const orbitRadius = earthRadius + orbitHeight * Math.sin(angle);

    const point = midpoint.clone().normalize().multiplyScalar(orbitRadius);
    points.push(point);
  }

  return points;
}

/**
 * Create animated missile trajectory line
 */
export function createMissileTrajectory(
  trajectory: MissileTrajectory,
  latLonToVector3: LatLonToVector3Fn,
  radius: number
): MissileTrajectoryInstance {
  const fromVec = latLonToVector3(trajectory.from.lon, trajectory.from.lat, radius);
  const toVec = latLonToVector3(trajectory.to.lon, trajectory.to.lat, radius);

  // Calculate path based on trajectory type
  let allPoints: THREE.Vector3[];
  switch (trajectory.type) {
    case 'cruise':
      allPoints = calculateCruisePath(fromVec, toVec, 0.05);
      break;
    case 'orbital':
      allPoints = calculateOrbitalPath(fromVec, toVec, 1.0);
      break;
    case 'ballistic':
    default:
      allPoints = calculateBallisticArc(fromVec, toVec, 0.5);
      break;
  }

  // Create line geometry
  const geometry = new THREE.BufferGeometry().setFromPoints(allPoints);
  const material = new THREE.LineBasicMaterial({
    color: new THREE.Color(trajectory.color || '#ff0000'),
    linewidth: 3,
    transparent: true,
    opacity: 0.0 // Start invisible, will fade in during animation
  });

  const line = new THREE.Line(geometry, material);
  line.name = `missile-${trajectory.id}`;

  // Create trail (glowing effect behind missile)
  const trailMaterial = new THREE.LineBasicMaterial({
    color: new THREE.Color(trajectory.color || '#ff0000'),
    linewidth: 5,
    transparent: true,
    opacity: 0.0
  });
  const trail = new THREE.Line(geometry.clone(), trailMaterial);
  trail.name = `missile-trail-${trajectory.id}`;

  return {
    id: trajectory.id,
    line,
    trail,
    startTime: 0, // Will be set when animation starts
    duration: trajectory.duration,
    progress: 0,
    markerPosition: fromVec.clone(),
    allPoints,
    isComplete: false,
    // Store original coordinates for dynamic recalculation
    from: trajectory.from,
    to: trajectory.to,
    type: trajectory.type || 'ballistic',
    color: trajectory.color || '#ff0000',
  };
}

/**
 * Update missile trajectory animation
 * Call this in your render loop with current time
 */
export function updateMissileAnimation(
  instance: MissileTrajectoryInstance,
  currentTime: number
): void {
  if (instance.isComplete) return;

  const elapsed = currentTime - instance.startTime;
  const progress = Math.min(elapsed / instance.duration, 1.0);
  instance.progress = progress;

  if (progress >= 1.0) {
    const finalPoint = instance.allPoints[instance.allPoints.length - 1];

    // Ensure final geometry state reflects the impact point before fading
    instance.line.geometry.setFromPoints(instance.allPoints);

    if (instance.trail) {
      const trailSampleLength = Math.min(instance.allPoints.length, 11);
      const trailPoints = instance.allPoints.slice(instance.allPoints.length - trailSampleLength);
      instance.trail.geometry.setFromPoints(trailPoints);
    }

    instance.markerPosition.copy(finalPoint);
    instance.isComplete = true;

    // Fade out completed trajectory
    const fadeElapsed = Math.max(0, elapsed - instance.duration);
    if (instance.line.material instanceof THREE.LineBasicMaterial) {
      const targetOpacity = Math.max(0, Math.min(0.8, 1.0 - fadeElapsed));
      instance.line.material.opacity = targetOpacity;
      instance.line.material.needsUpdate = true;
    }
    if (instance.trail?.material instanceof THREE.LineBasicMaterial) {
      const targetTrailOpacity = Math.max(0, 0.6 - fadeElapsed);
      instance.trail.material.opacity = targetTrailOpacity;
      instance.trail.material.needsUpdate = true;
    }
    return;
  }

  // Update trajectory line visibility (draw from start to current position)
  const visiblePoints = Math.floor(instance.allPoints.length * progress);
  if (visiblePoints > 0) {
    const currentPoints = instance.allPoints.slice(0, visiblePoints + 1);
    instance.line.geometry.setFromPoints(currentPoints);

    // Update line opacity (fade in at start)
    if (instance.line.material instanceof THREE.LineBasicMaterial) {
      instance.line.material.opacity = Math.min(0.8, progress * 2);
      instance.line.material.needsUpdate = true;
    }
  }

  // Update trail (glowing effect)
  if (instance.trail && visiblePoints > 5) {
    const trailStart = Math.max(0, visiblePoints - 10);
    const trailPoints = instance.allPoints.slice(trailStart, visiblePoints + 1);
    instance.trail.geometry.setFromPoints(trailPoints);

    if (instance.trail.material instanceof THREE.LineBasicMaterial) {
      instance.trail.material.opacity = Math.min(0.6, progress);
      instance.trail.material.needsUpdate = true;
    }
  }

  // Update marker position (for optional missile icon)
  if (visiblePoints < instance.allPoints.length) {
    instance.markerPosition.copy(instance.allPoints[visiblePoints]);
  }
}

/**
 * Recalculate missile trajectory positions for current morphFactor
 * Call this when morphFactor changes to update missiles for 2D/3D view transitions
 */
export function updateMissileTrajectoryPositions(
  instance: MissileTrajectoryInstance,
  latLonToVector3: LatLonToVector3Fn,
  radius: number
): void {
  const fromVec = latLonToVector3(instance.from.lon, instance.from.lat, radius);
  const toVec = latLonToVector3(instance.to.lon, instance.to.lat, radius);

  // Recalculate path based on trajectory type
  let newPoints: THREE.Vector3[];
  switch (instance.type) {
    case 'cruise':
      newPoints = calculateCruisePath(fromVec, toVec, 0.05);
      break;
    case 'orbital':
      newPoints = calculateOrbitalPath(fromVec, toVec, 1.0);
      break;
    case 'ballistic':
    default:
      newPoints = calculateBallisticArc(fromVec, toVec, 0.5);
      break;
  }

  // Update the stored points
  instance.allPoints = newPoints;

  // Update line geometry with current progress
  const visiblePoints = Math.floor(newPoints.length * instance.progress);
  if (visiblePoints > 0) {
    const currentPoints = instance.isComplete
      ? newPoints
      : newPoints.slice(0, visiblePoints + 1);
    instance.line.geometry.setFromPoints(currentPoints);
  }

  // Update trail geometry
  if (instance.trail && visiblePoints > 5) {
    const trailStart = instance.isComplete
      ? Math.max(0, newPoints.length - 11)
      : Math.max(0, visiblePoints - 10);
    const trailEnd = instance.isComplete
      ? newPoints.length
      : visiblePoints + 1;
    const trailPoints = newPoints.slice(trailStart, trailEnd);
    instance.trail.geometry.setFromPoints(trailPoints);
  }

  // Update marker position
  const markerIndex = instance.isComplete
    ? newPoints.length - 1
    : Math.min(visiblePoints, newPoints.length - 1);
  if (markerIndex >= 0) {
    instance.markerPosition.copy(newPoints[markerIndex]);
  }
}

/**
 * Create missile marker mesh (glowing sphere at trajectory tip)
 */
export function createMissileMarker(color: string = '#ff0000'): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(0.02, 8, 8);
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0.9
  });

  const mesh = new THREE.Mesh(geometry, material);

  // Add glow effect
  const glowGeometry = new THREE.SphereGeometry(0.04, 8, 8);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0.3
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  mesh.add(glow);

  return mesh;
}

/**
 * Calculate estimated flight time based on distance and missile type
 */
export function estimateFlightTime(
  from: { lon: number; lat: number },
  to: { lon: number; lat: number },
  type: 'ballistic' | 'cruise' | 'orbital' = 'ballistic'
): number {
  // Calculate great circle distance
  const lat1 = from.lat * Math.PI / 180;
  const lat2 = to.lat * Math.PI / 180;
  const dLat = (to.lat - from.lat) * Math.PI / 180;
  const dLon = (to.lon - from.lon) * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = 6371 * c; // Distance in km

  // Estimate flight time based on type and distance
  switch (type) {
    case 'ballistic':
      // ICBMs: ~30 minutes for intercontinental
      return Math.min(30, 5 + distance / 500); // seconds in game time
    case 'cruise':
      // Cruise missiles: slower, terrain-following
      return Math.min(60, 10 + distance / 300);
    case 'orbital':
      // Orbital weapons: fractional orbital bombardment
      return Math.min(90, 20 + distance / 400);
    default:
      return 10;
  }
}

/**
 * Create explosion effect at impact point
 */
export function createExplosion(
  position: THREE.Vector3,
  radiusKm: number = 50,
  color: string = '#ff6600'
): THREE.Group {
  const group = new THREE.Group();

  // Main explosion flash
  const flashGeometry = new THREE.SphereGeometry(radiusKm / 6371, 16, 16);
  const flashMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0.9
  });
  const flash = new THREE.Mesh(flashGeometry, flashMaterial);
  flash.position.copy(position);
  group.add(flash);

  // Shockwave ring
  const ringGeometry = new THREE.RingGeometry(
    radiusKm / 6371 * 0.8,
    radiusKm / 6371 * 1.2,
    32
  );
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#ffaa00'),
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.position.copy(position);
  ring.lookAt(0, 0, 0);
  group.add(ring);

  group.name = 'explosion';
  return group;
}

/**
 * Animate explosion effect
 */
export function animateExplosion(
  explosion: THREE.Group,
  elapsed: number,
  duration: number = 2.0
): boolean {
  const progress = elapsed / duration;

  if (progress >= 1.0) {
    return true; // Animation complete, remove explosion
  }

  // Expand and fade out
  const scale = 1 + progress * 2;
  explosion.scale.set(scale, scale, scale);

  explosion.children.forEach(child => {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
      child.material.opacity = Math.max(0, 1 - progress);
      child.material.needsUpdate = true;
    }
  });

  return false; // Animation ongoing
}
