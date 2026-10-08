import { forwardRef, useEffect, useMemo, useRef, useState, useImperativeHandle, useCallback } from 'react';
import type { MutableRefObject } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { FeatureCollection, Polygon, MultiPolygon } from 'geojson';

import { EARTH_RADIUS, MORPHING_FLAT_HEIGHT, MORPHING_FLAT_WIDTH } from '@/constants/globe.constants';
import { morphVertexShader, morphFragmentShader, darkFragmentShader, vectorOverlayVertexShader, vectorOverlayFragmentShader } from '@/constants/globeShaders';
import { createMorphedGeometry, updateMorphedGeometry, clampUnit, easeMorph } from '@/lib/globe/geometry';
import { collectBorderSegments, createVectorOverlayGeometry } from '@/lib/globe/borders';
import { resolvePublicAssetPath } from '@/lib/renderingUtils';

export { MORPHING_FLAT_HEIGHT, MORPHING_FLAT_WIDTH } from '@/constants/globe.constants';
export { getMorphedPosition } from '@/lib/globe/geometry';

export interface MorphingGlobeHandle {
  getMorphFactor: () => number;
  setMorphFactor: (value: number) => void;
  morphToGlobe: (duration?: number) => void;
  morphToFlat: (duration?: number) => void;
  toggle: (duration?: number) => void;
  isFlat: () => boolean;
  setVectorOverlay: (visible: boolean) => void;
  getVectorOverlay: () => boolean;
}

export interface MorphingGlobeProps {
  initialView?: 'globe' | 'flat';
  animationDuration?: number;
  textureVariant?: 'day' | 'night';
  dayNightBlend?: number;
  customTextureUrl?: string;
  onMorphStart?: (targetView: 'globe' | 'flat') => void;
  onMorphComplete?: (view: 'globe' | 'flat') => void;
  onMorphProgress?: (factor: number) => void;
  meshRef?: MutableRefObject<THREE.Mesh | null>;
  onSurfaceReady?: (mesh: THREE.Mesh) => void;
  worldCountries?: FeatureCollection<Polygon | MultiPolygon> | null;
  showVectorOverlay?: boolean;
  vectorColor?: string;
  vectorOpacity?: number;
  vectorOnlyMode?: boolean;
}

interface MorphAnimation {
  startTime: number;
  startValue: number;
  endValue: number;
  duration: number;
}

export const MorphingGlobe = forwardRef<MorphingGlobeHandle, MorphingGlobeProps>(function MorphingGlobe({
  initialView = 'globe', animationDuration = 1.2, textureVariant = 'day', dayNightBlend,
  customTextureUrl, onMorphStart, onMorphComplete, onMorphProgress, meshRef: externalMeshRef,
  worldCountries, showVectorOverlay = false, vectorColor = '#2ef1ff', vectorOpacity = 0.7,
  vectorOnlyMode = false, onSurfaceReady,
}, ref) {
  const internalMeshRef = useRef<THREE.Mesh>(null);
  const meshRef = externalMeshRef ?? internalMeshRef;
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const vectorMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const { camera, gl } = useThree();
  const [vectorOverlayVisible, setVectorOverlayVisible] = useState(showVectorOverlay);
  const morphFactorRef = useRef(initialView === 'flat' ? 1 : 0);
  const geometryFactorRef = useRef(morphFactorRef.current);
  const animationRef = useRef<MorphAnimation | null>(null);
  const cameraDirection = useMemo(() => new THREE.Vector3(), []);
  const lightOffset = useMemo(() => new THREE.Vector3(0.3, 0.5, 0), []);

  const dayUrl = customTextureUrl && textureVariant === 'day'
    ? customTextureUrl : resolvePublicAssetPath('textures/earth_day_flat.jpg');
  const nightUrl = customTextureUrl && textureVariant === 'night'
    ? customTextureUrl : resolvePublicAssetPath('textures/earth_night_flat.jpg');
  const [dayTexture, nightTexture] = useLoader(THREE.TextureLoader, [dayUrl, nightUrl]);
  const effectiveBlend = clampUnit(dayNightBlend ?? (textureVariant === 'night' ? 1 : 0));
  const geometry = useMemo(() => createMorphedGeometry(morphFactorRef.current), []);
  const vectorGeometry = useMemo(() => {
    const segments = collectBorderSegments(worldCountries);
    return segments ? createVectorOverlayGeometry(segments) : null;
  }, [worldCountries]);

  // Uniform objects live for the lifetime of the component. Switching day/night or
  // vector mode must not restore the initial globe shape.
  const [uniforms] = useState(() => ({
    uMorphFactor: { value: morphFactorRef.current },
    uRadius: { value: EARTH_RADIUS },
    uFlatWidth: { value: MORPHING_FLAT_WIDTH },
    uFlatHeight: { value: MORPHING_FLAT_HEIGHT },
    uDayTexture: { value: dayTexture },
    uNightTexture: { value: nightTexture },
    uDayNightBlend: { value: effectiveBlend },
    uLightDirection: { value: new THREE.Vector3(1, 0.5, 1).normalize() },
    uAmbientIntensity: { value: 0.48 },
    uDarkColor: { value: new THREE.Color('#020a02') },
  }));
  const [vectorUniforms] = useState(() => ({
    uMorphFactor: { value: morphFactorRef.current },
    uRadius: { value: EARTH_RADIUS },
    uFlatWidth: { value: MORPHING_FLAT_WIDTH },
    uFlatHeight: { value: MORPHING_FLAT_HEIGHT },
    uColor: { value: new THREE.Color(vectorColor) },
    uOpacity: { value: vectorOpacity },
  }));

  useEffect(() => {
    for (const texture of [dayTexture, nightTexture]) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(16, gl.capabilities.getMaxAnisotropy());
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.needsUpdate = true;
    }
    uniforms.uDayTexture.value = dayTexture;
    uniforms.uNightTexture.value = nightTexture;
  }, [dayTexture, nightTexture, gl, uniforms]);

  useEffect(() => { uniforms.uDayNightBlend.value = effectiveBlend; }, [effectiveBlend, uniforms]);
  useEffect(() => { setVectorOverlayVisible(showVectorOverlay); }, [showVectorOverlay]);
  useEffect(() => {
    vectorUniforms.uColor.value.set(vectorColor);
    vectorUniforms.uOpacity.value = clampUnit(vectorOpacity);
  }, [vectorColor, vectorOpacity, vectorUniforms]);
  useEffect(() => () => { geometry.dispose(); }, [geometry]);
  useEffect(() => () => { vectorGeometry?.dispose(); }, [vectorGeometry]);

  const applyMorph = useCallback((value: number) => {
    const factor = clampUnit(value, morphFactorRef.current);
    morphFactorRef.current = factor;
    uniforms.uMorphFactor.value = factor;
    vectorUniforms.uMorphFactor.value = factor;
    if (geometryFactorRef.current !== factor) {
      updateMorphedGeometry(geometry, factor);
      geometryFactorRef.current = factor;
    }
    onMorphProgress?.(factor);
  }, [geometry, uniforms, vectorUniforms, onMorphProgress]);

  const startMorph = useCallback((endValue: number, duration = animationDuration) => {
    const view = endValue === 1 ? 'flat' : 'globe';
    onMorphStart?.(view);
    if (!Number.isFinite(duration) || duration <= 0) {
      animationRef.current = null;
      applyMorph(endValue);
      onMorphComplete?.(view);
      return;
    }
    animationRef.current = {
      startTime: performance.now() / 1000, startValue: morphFactorRef.current, endValue, duration,
    };
  }, [animationDuration, onMorphStart, onMorphComplete, applyMorph]);

  useFrame(() => {
    const animation = animationRef.current;
    if (animation) {
      const progress = clampUnit((performance.now() / 1000 - animation.startTime) / animation.duration);
      applyMorph(THREE.MathUtils.lerp(animation.startValue, animation.endValue, easeMorph(progress)));
      if (progress === 1) {
        animationRef.current = null;
        onMorphComplete?.(animation.endValue === 1 ? 'flat' : 'globe');
      }
    }
    camera.getWorldDirection(cameraDirection);
    uniforms.uLightDirection.value.copy(cameraDirection).negate().add(lightOffset).normalize();
  });

  useImperativeHandle(ref, () => ({
    getMorphFactor: () => morphFactorRef.current,
    setMorphFactor: (value: number) => {
      animationRef.current = null;
      applyMorph(value);
    },
    morphToGlobe: (duration?: number) => startMorph(0, duration),
    morphToFlat: (duration?: number) => startMorph(1, duration),
    toggle: (duration?: number) => startMorph(morphFactorRef.current < 0.5 ? 1 : 0, duration),
    isFlat: () => morphFactorRef.current > 0.5,
    setVectorOverlay: setVectorOverlayVisible,
    getVectorOverlay: () => vectorOverlayVisible,
  }), [applyMorph, startMorph, vectorOverlayVisible]);

  useEffect(() => {
    if (meshRef.current) onSurfaceReady?.(meshRef.current);
  }, [meshRef, onSurfaceReady]);

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry} renderOrder={0} frustumCulled={false}>
        <shaderMaterial
          ref={materialRef}
          vertexShader={morphVertexShader}
          fragmentShader={vectorOnlyMode ? darkFragmentShader : morphFragmentShader}
          uniforms={uniforms}
          side={THREE.FrontSide}
          depthWrite={true}
          depthTest={true}
          toneMapped={false}
        />
      </mesh>
      {(vectorOnlyMode || vectorOverlayVisible) && vectorGeometry && (
        <lineSegments geometry={vectorGeometry} frustumCulled={false} renderOrder={1}>
          <shaderMaterial
            ref={vectorMaterialRef}
            vertexShader={vectorOverlayVertexShader}
            fragmentShader={vectorOverlayFragmentShader}
            uniforms={vectorUniforms}
            transparent
            depthWrite={false}
            depthTest={true}
            toneMapped={false}
          />
        </lineSegments>
      )}
    </group>
  );
});

export function useMorphingGlobe() {
  const ref = useRef<MorphingGlobeHandle>(null);
  return {
    ref,
    morphToGlobe: (duration?: number) => ref.current?.morphToGlobe(duration),
    morphToFlat: (duration?: number) => ref.current?.morphToFlat(duration),
    toggle: (duration?: number) => ref.current?.toggle(duration),
    getMorphFactor: () => ref.current?.getMorphFactor() ?? 0,
    isFlat: () => ref.current?.isFlat() ?? false,
    setVectorOverlay: (visible: boolean) => ref.current?.setVectorOverlay(visible),
    getVectorOverlay: () => ref.current?.getVectorOverlay() ?? false,
  };
}

export default MorphingGlobe;
