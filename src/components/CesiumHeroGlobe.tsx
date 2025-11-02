import { useEffect, useRef } from 'react';
import {
  Viewer,
  Ion,
  IonImageryProvider,
  OpenStreetMapImageryProvider,
  createWorldTerrainAsync,
  ImageryProvider,
  TerrainProvider,
  Cartesian3,
  Color,
  Math as CesiumMath,
  SingleTileImageryProvider,
  Rectangle,
} from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

const ionAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN ?? '';
Ion.defaultAccessToken = ionAccessToken;
const hasIonAccess = ionAccessToken.length > 0;

const resolvePublicAssetPath = (assetPath: string) => {
  const base = import.meta.env.BASE_URL ?? '/';
  const trimmedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const trimmedAsset = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;

  if (!trimmedBase) {
    return `/${trimmedAsset}`;
  }

  return `${trimmedBase}/${trimmedAsset}`;
};

export const CesiumHeroGlobe = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const spinCallbackRef = useRef<((scene: any, time: any) => void) | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let destroyed = false;

    const initViewer = async () => {
      // Always use OpenStreetMap for reliable Earth imagery
      const imageryProvider = new OpenStreetMapImageryProvider({
        url: 'https://a.tile.openstreetmap.org/',
      });

      if (destroyed || !containerRef.current) {
        return;
      }

      const viewer = new Viewer(containerRef.current, {
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        animation: false,
        timeline: false,
        fullscreenButton: false,
        vrButton: false,
        infoBox: false,
        selectionIndicator: false,
      });

      viewerRef.current = viewer;

      // Set up Earth imagery
      viewer.imageryLayers.removeAll();
      viewer.imageryLayers.addImageryProvider(imageryProvider);

      viewer.scene.skyAtmosphere.show = true;
      viewer.scene.globe.showGroundAtmosphere = true;
      viewer.scene.backgroundColor = Color.fromCssColorString('#020512');
      viewer.scene.globe.enableLighting = true;
      viewer.scene.globe.baseColor = Color.fromCssColorString('#020512');

      viewer.scene.screenSpaceCameraController.enableZoom = false;
      viewer.scene.screenSpaceCameraController.enableLook = false;
      viewer.scene.screenSpaceCameraController.enableRotate = false;
      viewer.scene.screenSpaceCameraController.enableTranslate = false;
      viewer.scene.screenSpaceCameraController.enableTilt = false;

      const nightTextureUrl = resolvePublicAssetPath('textures/earth_specular.jpg');
      const nightLayer = viewer.imageryLayers.addImageryProvider(
        new SingleTileImageryProvider({
          url: nightTextureUrl,
          rectangle: Rectangle.fromDegrees(-180, -90, 180, 90),
        })
      );
      nightLayer.alpha = 0.35;
      nightLayer.brightness = 1.3;

      // Dramatic angled view from space - matching reference image
      viewer.camera.setView({
        destination: Cartesian3.fromDegrees(-20, 30, 12000000),
        orientation: {
          heading: CesiumMath.toRadians(20),
          pitch: CesiumMath.toRadians(-35),
          roll: CesiumMath.toRadians(-15),
        },
      });

      viewer.clock.shouldAnimate = true;
      viewer.clock.multiplier = 100;

      const spinCallback = () => {
        if (!viewer || viewer.isDestroyed()) return;
        viewer.scene.camera.rotate(viewer.scene.camera.up, CesiumMath.toRadians(-0.008));
      };

      spinCallbackRef.current = spinCallback;
      viewer.scene.preRender.addEventListener(spinCallback);
    };

    initViewer();

    return () => {
      destroyed = true;
      if (viewerRef.current) {
        if (spinCallbackRef.current) {
          viewerRef.current.scene.preRender.removeEventListener(spinCallbackRef.current);
        }
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} className="hero-cesium-globe" />;
};

export default CesiumHeroGlobe;
