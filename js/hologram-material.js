/* ORION 2.3 holographic surface shader (original implementation).
 * Inspired by the Fresnel / scanline approach demonstrated by
 * https://github.com/ektogamat/threejs-vanilla-holographic-material (MIT).
 * Written to work with the project's global Three.js r128 (no bundler).
 */
(function () {
  'use strict';
  window.ORIONHologram = {
    create(options = {}) {
      if (typeof THREE === 'undefined') return null;
      const uniforms = {
        uTime: { value: 0 },
        uCharge: { value: 0.75 },
        uHue: { value: new THREE.Color(options.color || 0x16dfff) },
        uOpacity: { value: options.opacity == null ? 0.34 : options.opacity },
        uScanDensity: { value: options.scanDensity || 22 }
      };
      const material = new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vEye;
          varying vec3 vPosition;
          void main() {
            vec4 view = modelViewMatrix * vec4(position, 1.0);
            vNormal = normalize(normalMatrix * normal);
            vEye = normalize(-view.xyz);
            vPosition = position;
            gl_Position = projectionMatrix * view;
          }
        `,
        fragmentShader: `
          precision mediump float;
          uniform float uTime;
          uniform float uCharge;
          uniform float uOpacity;
          uniform float uScanDensity;
          uniform vec3 uHue;
          varying vec3 vNormal;
          varying vec3 vEye;
          varying vec3 vPosition;
          void main() {
            float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vEye))), 2.35);
            float scan = pow(0.5 + 0.5 * sin(vPosition.y * uScanDensity - uTime * 2.5), 12.0);
            float echo = 0.5 + 0.5 * sin(vPosition.y * 3.2 + uTime * 0.9);
            float strength = (0.06 + rim * 0.90 + scan * 0.28 + echo * 0.055) * (0.48 + uCharge * 0.52);
            vec3 color = uHue * (0.75 + rim * 0.75 + scan * 0.32);
            gl_FragColor = vec4(color, clamp(strength * uOpacity, 0.0, 0.80));
          }
        `
      });
      return {
        material,
        uniforms,
        update(seconds, charge) {
          uniforms.uTime.value = seconds;
          if (typeof charge === 'number') uniforms.uCharge.value = charge;
        },
        setColor(hex) { uniforms.uHue.value.setHex(hex); }
      };
    }
  };
})();
