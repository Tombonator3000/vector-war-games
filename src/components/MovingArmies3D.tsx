import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface MovingArmiesProps {
  movements: Array<{
    id: string;
    fromLon: number;
    fromLat: number;
    toLon: number;
    toLat: number;
    count: number;
    startTime: number;
  }>;
  earthRadius?: number;
  onMovementComplete: (id: string) => void;
}

const MOVEMENT_HEIGHT = 0.3; // Arc height above surface
const MOVEMENT_DURATION = 2000; // milliseconds

function latLonToVector3(lon: number, lat: number, radius: number) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

interface SingleMovementProps {
  movement: MovingArmiesProps['movements'][0];
  earthRadius: number;
  onComplete: () => void;
}

function SingleMovement({ movement, earthRadius, onComplete }: SingleMovementProps) {
  const groupRef = useRef<THREE.Group>(null);
  const particles = useRef<THREE.Mesh[]>([]);
  const startPos = useMemo(
    () => latLonToVector3(movement.fromLon, movement.fromLat, earthRadius + 0.1),
    [movement.fromLon, movement.fromLat, earthRadius]
  );
  const endPos = useMemo(
    () => latLonToVector3(movement.toLon, movement.toLat, earthRadius + 0.1),
    [movement.toLon, movement.toLat, earthRadius]
  );

  // Create arc control point (midpoint + height)
  const arcControlPoint = useMemo(() => {
    const midPoint = new THREE.Vector3()
      .addVectors(startPos, endPos)
      .multiplyScalar(0.5);
    
    // Push the midpoint outward (away from earth center) for arc effect
    const direction = midPoint.clone().normalize();
    return midPoint.add(direction.multiplyScalar(MOVEMENT_HEIGHT));
  }, [startPos, endPos]);

  // Create quadratic bezier curve for smooth arc
  const curve = useMemo(() => {
    return new THREE.QuadraticBezierCurve3(startPos, arcControlPoint, endPos);
  }, [startPos, arcControlPoint, endPos]);

  // Create multiple army "unit" particles
  const unitCount = Math.min(movement.count, 8); // Max 8 visible units
  const particleSpacing = 1 / (unitCount + 1);

  useFrame(() => {
    if (!groupRef.current) return;

    const elapsed = Date.now() - movement.startTime;
    const progress = Math.min(elapsed / MOVEMENT_DURATION, 1);

    if (progress >= 1) {
      onComplete();
      return;
    }

    // Update each particle position along the curve
    particles.current.forEach((particle, index) => {
      // Stagger particles along the curve
      const offset = particleSpacing * (index + 1);
      const particleProgress = Math.max(0, Math.min(1, progress + offset - 0.5));
      
      const position = curve.getPoint(particleProgress);
      particle.position.copy(position);

      // Rotate to face direction of travel
      if (particleProgress < 1) {
        const nextPos = curve.getPoint(Math.min(1, particleProgress + 0.01));
        particle.lookAt(nextPos);
      }

      // Fade in/out at start/end
      const fadeIn = Math.min(1, particleProgress * 4);
      const fadeOut = Math.min(1, (1 - particleProgress) * 4);
      const opacity = Math.min(fadeIn, fadeOut);
      
      if (particle.material instanceof THREE.MeshStandardMaterial) {
        particle.material.opacity = opacity;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {/* Trail line showing path */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={curve.getPoints(50).length}
            array={new Float32Array(
              curve.getPoints(50).flatMap(p => [p.x, p.y, p.z])
            )}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#22d3ee" transparent opacity={0.3} />
      </line>

      {/* Army unit particles */}
      {Array.from({ length: unitCount }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) particles.current[i] = el;
          }}
        >
          <boxGeometry args={[0.04, 0.04, 0.08]} />
          <meshStandardMaterial
            color="#22d3ee"
            emissive="#06b6d4"
            emissiveIntensity={0.8}
            transparent
            opacity={1}
          />
        </mesh>
      ))}

      {/* Count badge that follows the lead particle */}
      {movement.count > 1 && (
        <group>
          {/* This will be updated by useFrame to follow the lead particle */}
        </group>
      )}
    </group>
  );
}

export function MovingArmies3D({
  movements,
  earthRadius = 1.8,
  onMovementComplete,
}: MovingArmiesProps) {
  return (
    <group>
      {movements.map((movement) => (
        <SingleMovement
          key={movement.id}
          movement={movement}
          earthRadius={earthRadius}
          onComplete={() => onMovementComplete(movement.id)}
        />
      ))}
    </group>
  );
}
