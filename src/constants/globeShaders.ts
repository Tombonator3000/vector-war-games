// Vertex shader that interpolates between sphere and flat plane
export const morphVertexShader = /* glsl */ `
  uniform float uMorphFactor;
  uniform float uRadius;
  uniform float uFlatWidth;
  uniform float uFlatHeight;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vUv = uv;

    // Sphere position (from UV to spherical coordinates)
    // With flipY=true (default): uv.y=0 is BOTTOM of image (south pole), uv.y=1 is TOP (north pole)
    // Invert uv.y so phi=0 at north pole (top of image) and phi=PI at south pole (bottom of image)
    float phi = (1.0 - uv.y) * 3.14159265359; // latitude: 0 at north pole, PI at south pole
    float theta = uv.x * 2.0 * 3.14159265359 - 3.14159265359; // longitude: -PI to PI

    vec3 spherePos = vec3(
      -uRadius * sin(phi) * cos(theta),  // Negate X to fix texture mirroring
      uRadius * cos(phi),
      uRadius * sin(phi) * sin(theta)
    );

    // Flat position (centered plane)
    // With flipY=true: uv.y=0 is south pole (bottom), uv.y=1 is north pole (top)
    // Map to screen: south (uv.y=0) -> bottom (-Y), north (uv.y=1) -> top (+Y)
    vec3 flatPos = vec3(
      (uv.x - 0.5) * uFlatWidth,
      (uv.y - 0.5) * uFlatHeight,
      0.0
    );

    // Interpolate between sphere and flat based on morph factor
    vec3 morphedPosition = mix(spherePos, flatPos, uMorphFactor);

    // Normal interpolation
    // The surface normal points outward, independent of texture orientation.
    vec3 sphereNormal = normalize(spherePos);
    vec3 flatNormal = vec3(0.0, 0.0, 1.0);
    vNormal = normalize(mix(sphereNormal, flatNormal, uMorphFactor));

    vPosition = morphedPosition;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(morphedPosition, 1.0);
  }
`;

// City lights are emissive: night pixels must remain bright even on the shaded hemisphere.
export const morphFragmentShader = /* glsl */ `
  uniform sampler2D uDayTexture;
  uniform sampler2D uNightTexture;
  uniform float uDayNightBlend;
  uniform float uMorphFactor;
  uniform vec3 uLightDirection;
  uniform float uAmbientIntensity;
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vec4 dayColor = texture2D(uDayTexture, vUv);
    vec4 nightColor = texture2D(uNightTexture, vUv);
    float diffuse = max(dot(normalize(vNormal), normalize(uLightDirection)), 0.0);
    float globeLighting = mix(uAmbientIntensity, 1.0, diffuse);
    float lighting = mix(globeLighting, 1.0, uMorphFactor);
    vec3 finalColor = mix(dayColor.rgb * lighting, nightColor.rgb, uDayNightBlend);
    gl_FragColor = vec4(finalColor, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// Simple dark fragment shader for vectorOnlyMode (no texture, just dark color)
export const darkFragmentShader = /* glsl */ `
  uniform vec3 uDarkColor;

  void main() {
    gl_FragColor = vec4(uDarkColor, 1.0);
    #include <colorspace_fragment>
  }
`;

// Vertex shader for vector overlay lines that morph with the globe
export const vectorOverlayVertexShader = /* glsl */ `
  uniform float uMorphFactor;
  uniform float uRadius;
  uniform float uFlatWidth;
  uniform float uFlatHeight;

  attribute vec2 uv2; // UV coordinates for the line endpoints

  varying float vAlpha;

  void main() {
    // Calculate sphere position from UV
    // Invert uv2.y to match flipY=true texture orientation (uv.y=0 at bottom, uv.y=1 at top)
    float phi = (1.0 - uv2.y) * 3.14159265359;
    float theta = uv2.x * 2.0 * 3.14159265359 - 3.14159265359;

    vec3 spherePos = vec3(
      -(uRadius + 0.005) * sin(phi) * cos(theta),  // Negate X to fix texture mirroring
      (uRadius + 0.005) * cos(phi),
      (uRadius + 0.005) * sin(phi) * sin(theta)
    );

    // Calculate flat position
    // Map UV to screen coordinates: south (uv2.y=0) -> bottom, north (uv2.y=1) -> top
    vec3 flatPos = vec3(
      (uv2.x - 0.5) * uFlatWidth,
      (uv2.y - 0.5) * uFlatHeight,
      0.01
    );

    // Interpolate
    vec3 morphedPosition = mix(spherePos, flatPos, uMorphFactor);

    // Fade alpha for backfacing lines on globe
    // The surface normal points outward, independent of texture orientation.
    vec3 sphereNormal = normalize(spherePos);
    vec3 viewDir = normalize(cameraPosition - morphedPosition);
    float facing = dot(sphereNormal, viewDir);
    vAlpha = mix(smoothstep(-0.1, 0.3, facing), 1.0, uMorphFactor);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(morphedPosition, 1.0);
  }
`;

export const vectorOverlayFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;

  varying float vAlpha;

  void main() {
    gl_FragColor = vec4(uColor, uOpacity * vAlpha);
    #include <colorspace_fragment>
  }
`;

