import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

const CubeBackground = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    let animationFrameId;

    // CONFIG
    const COUNT = 20000;
    const SPEED_MULT = 1;
    const AUTO_SPIN = true;

    // SETUP
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.01);
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 0, 100);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance", alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // Transparent background
    
    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = AUTO_SPIN;
    controls.autoRotateSpeed = 2.0;

    // POST PROCESSING
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.strength = 1.8; 
    bloomPass.radius = 0.4; 
    bloomPass.threshold = 0;
    composer.addPass(bloomPass);

    // SWARM OBJECTS
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const target = new THREE.Vector3();
    
    // INSTANCED MESH
    const geometry = new THREE.TetrahedronGeometry(0.25);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    const instancedMesh = new THREE.InstancedMesh(geometry, material, COUNT);
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(instancedMesh);

    // DATA ARRAYS
    const positions = [];
    for(let i=0; i<COUNT; i++) {
        positions.push(new THREE.Vector3((Math.random()-0.5)*100, (Math.random()-0.5)*100, (Math.random()-0.5)*100));
        instancedMesh.setColorAt(i, color.setHex(0x00ff88)); // Init Color
    }

    // ANIMATION LOOP
    const clock = new THREE.Clock();
    
    const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const time = clock.getElapsedTime() * SPEED_MULT;
        
        controls.update();

        // SWARM LOGIC
        const count = COUNT; 
        for(let i=0; i<COUNT; i++) {
             const s = Math.ceil(Math.pow(count, 1/3));
             const sep = 2.5; const off = (s * sep) / 2;
             let z = Math.floor(i / (s*s));
             let y = Math.floor((i % (s*s)) / s);
             let x = i % s;
             target.set(x * sep - off, y * sep - off, z * sep - off);
             color.setHex(0x00aaff); // Cyan color for tech-noir feel

             // LERP & UPDATE
             positions[i].lerp(target, 0.1);
             dummy.position.copy(positions[i]);
             dummy.updateMatrix();
             instancedMesh.setMatrixAt(i, dummy.matrix);
             instancedMesh.setColorAt(i, color); 
        }
        instancedMesh.instanceMatrix.needsUpdate = true;
        instancedMesh.instanceColor.needsUpdate = true;

        composer.render();
    };
    
    animate();

    const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationFrameId);
        if (mountRef.current && renderer.domElement) {
            mountRef.current.removeChild(renderer.domElement);
        }
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        composer.dispose();
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className="fixed inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen"
      style={{ filter: 'blur(1px)' }}
    ></div>
  );
};

export default CubeBackground;
