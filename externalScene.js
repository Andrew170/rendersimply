import * as THREE from './build/three.module.js';

import Stats from './build/stats.module.js';

import { GLTFLoader } from './build/GLTFLoader.js';

import { Octree } from './build/Octree.js';
import { OctreeHelper } from './build/OctreeHelper.js';

import { Capsule } from './build/Capsule.js';
import {RGBELoader} from "./build/RGBELoader.js";


// show gui for debug mode
// import { GUI } from '/jsm/libs/lil-gui.module.min.js';





            

			const clock = new THREE.Clock();


			
			const scene = new THREE.Scene();
			scene.background = new THREE.Color( 0x88ccee );
			// scene.fog = new THREE.Fog( 0x88ccee, 0, 50 );

			const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 1000 );
			camera.rotation.order = 'YXZ';

			const axesHelper = new THREE.AxesHelper(20);
    		scene.add(axesHelper);




			// LIGHTS....................................

			// const fillLight1 = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
			// fillLight1.position.set( 1, 1, 1 );
			// scene.add( fillLight1 );

			// const hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
    		// hemiLight.color.setHSL( 0.6, 1, 0.6 );
    		// hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
    		// hemiLight.position.set( 1, 3, 1 );
    		// scene.add( hemiLight );

			// const hemiLighthelper = new THREE.HemisphereLightHelper( hemiLight, 1 );
			// scene.add( hemiLighthelper );



			const Amlight = new THREE.AmbientLight( 0xffffff , 0.5); // soft white light
			scene.add( Amlight );





			const dirLight = new THREE.DirectionalLight( 0xffffff, 1.2 );
			dirLight.position.set( 20, 8, 2 );
			// dirLight.color.setHSL( 0.1, 1, 0.95 );
    		// dirLight.position.multiplyScalar( 15 );
			
			
    		dirLight.castShadow = true;
    		scene.add( dirLight );

    		dirLight.shadow.mapSize.width = 4096;
    		dirLight.shadow.mapSize.height = 4096;

    		const d = 50;

    		dirLight.shadow.camera.left = - d;
    		dirLight.shadow.camera.right = d;
    		dirLight.shadow.camera.top = d;
    		dirLight.shadow.camera.bottom = - d;

   		 	dirLight.shadow.camera.near = 0.5;
    		dirLight.shadow.camera.far = 250;
    		dirLight.shadow.radius = 80;
    		dirLight.shadow.blurSamples = 25;
			dirLight.shadow.bias = - 0.00001;

    
    		const dirLightHelper = new THREE.DirectionalLightHelper( dirLight, 10 );
    		scene.add( dirLightHelper );
			scene.add(new THREE.CameraHelper(dirLight.shadow.camera));


			const container = document.getElementById( 'container' );

			const renderer = new THREE.WebGLRenderer( { antialias: true } );
			renderer.setPixelRatio( window.devicePixelRatio );
			renderer.setSize( window.innerWidth, window.innerHeight );
			renderer.shadowMap.enabled = true;
			renderer.shadowMap.type = THREE.PCFSoftShadowMap;
			renderer.outputEncoding = THREE.sRGBEncoding;
			renderer.toneMapping = THREE.ACESFilmicToneMapping;
			renderer.toneMappingExposure = 0.5;
			// renderer.toneMapping = THREE.ReinhardToneMapping;
			// renderer.toneMapping = THREE.CineonToneMapping;
			renderer.physicallyCorrectLights = true
			container.appendChild( renderer.domElement );

			const stats = new Stats();
			stats.domElement.style.position = 'absolute';
			stats.domElement.style.top = '0px';
			container.appendChild( stats.domElement );









			// tecture cube variables
			// let textureEquirec, textureCube;




			const GRAVITY = 30;

			const NUM_SPHERES = 100;
			const SPHERE_RADIUS = 0.2;

			const STEPS_PER_FRAME = 5;

			const sphereGeometry = new THREE.IcosahedronGeometry( SPHERE_RADIUS, 5 );
			const sphereMaterial = new THREE.MeshLambertMaterial( { color: 0xbbbb44 } );

			const spheres = [];
			let sphereIdx = 0;

			for ( let i = 0; i < NUM_SPHERES; i ++ ) {

				const sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
				sphere.castShadow = true;
				sphere.receiveShadow = true;

				scene.add( sphere );

				spheres.push( {
					mesh: sphere,
					collider: new THREE.Sphere( new THREE.Vector3( 0, - 100, 0 ), SPHERE_RADIUS ),
					velocity: new THREE.Vector3()
				} );

			}

			const worldOctree = new Octree();

			const playerCollider = new Capsule( new THREE.Vector3( 0, 0.35, 0 ), new THREE.Vector3( 0, 1.8, 0 ), 0.20 );

			const playerVelocity = new THREE.Vector3();
			const playerDirection = new THREE.Vector3();

			let playerOnFloor = false;
			let mouseTime = 0;

			const keyStates = {};

			const vector1 = new THREE.Vector3();
			const vector2 = new THREE.Vector3();
			const vector3 = new THREE.Vector3();

			document.addEventListener( 'keydown', ( event ) => {

				keyStates[ event.code ] = true;

			} );

			document.addEventListener( 'keyup', ( event ) => {

				keyStates[ event.code ] = false;

			} );

			container.addEventListener( 'mousedown', () => {

				document.body.requestPointerLock();

				mouseTime = performance.now();

			} );

			// document.addEventListener( 'mouseup', () => {

			// 	if ( document.pointerLockElement !== null ) throwBall();

			// } );

			document.body.addEventListener( 'mousemove', ( event ) => {

				if ( document.pointerLockElement === document.body ) {

					camera.rotation.y -= event.movementX / 500;
					camera.rotation.x -= event.movementY / 500;

				}

			} );

			window.addEventListener( 'resize', onWindowResize );

			function onWindowResize() {

				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();

				renderer.setSize( window.innerWidth, window.innerHeight );

			}



			function playerCollisions() {

				const result = worldOctree.capsuleIntersect( playerCollider );

				playerOnFloor = false;

				if ( result ) {

					playerOnFloor = result.normal.y > 0;

					if ( ! playerOnFloor ) {

						playerVelocity.addScaledVector( result.normal, - result.normal.dot( playerVelocity ) );

					}

					playerCollider.translate( result.normal.multiplyScalar( result.depth ) );

				}

			}

			function updatePlayer( deltaTime ) {

				let damping = Math.exp( - 4 * deltaTime ) - 1;

				if ( ! playerOnFloor ) {

					playerVelocity.y -= GRAVITY * deltaTime;

					// small air resistance
					damping *= 0.1;

				}

				playerVelocity.addScaledVector( playerVelocity, damping );

				const deltaPosition = playerVelocity.clone().multiplyScalar( deltaTime );
				playerCollider.translate( deltaPosition );

				playerCollisions();

				camera.position.copy( playerCollider.end );

			}

			function playerSphereCollision( sphere ) {

				const center = vector1.addVectors( playerCollider.start, playerCollider.end ).multiplyScalar( 0.5 );

				const sphere_center = sphere.collider.center;

				const r = playerCollider.radius + sphere.collider.radius;
				const r2 = r * r;

				// approximation: player = 3 spheres

				for ( const point of [ playerCollider.start, playerCollider.end, center ] ) {

					const d2 = point.distanceToSquared( sphere_center );

					if ( d2 < r2 ) {

						const normal = vector1.subVectors( point, sphere_center ).normalize();
						const v1 = vector2.copy( normal ).multiplyScalar( normal.dot( playerVelocity ) );
						const v2 = vector3.copy( normal ).multiplyScalar( normal.dot( sphere.velocity ) );

						playerVelocity.add( v2 ).sub( v1 );
						sphere.velocity.add( v1 ).sub( v2 );

						const d = ( r - Math.sqrt( d2 ) ) / 2;
						sphere_center.addScaledVector( normal, - d );

					}

				}

			}

			function spheresCollisions() {

				for ( let i = 0, length = spheres.length; i < length; i ++ ) {

					const s1 = spheres[ i ];

					for ( let j = i + 1; j < length; j ++ ) {

						const s2 = spheres[ j ];

						const d2 = s1.collider.center.distanceToSquared( s2.collider.center );
						const r = s1.collider.radius + s2.collider.radius;
						const r2 = r * r;

						if ( d2 < r2 ) {

							const normal = vector1.subVectors( s1.collider.center, s2.collider.center ).normalize();
							const v1 = vector2.copy( normal ).multiplyScalar( normal.dot( s1.velocity ) );
							const v2 = vector3.copy( normal ).multiplyScalar( normal.dot( s2.velocity ) );

							s1.velocity.add( v2 ).sub( v1 );
							s2.velocity.add( v1 ).sub( v2 );

							const d = ( r - Math.sqrt( d2 ) ) / 2;

							s1.collider.center.addScaledVector( normal, d );
							s2.collider.center.addScaledVector( normal, - d );

						}

					}

				}

			}

			function updateSpheres( deltaTime ) {

				spheres.forEach( sphere => {

					sphere.collider.center.addScaledVector( sphere.velocity, deltaTime );

					const result = worldOctree.sphereIntersect( sphere.collider );

					if ( result ) {

						sphere.velocity.addScaledVector( result.normal, - result.normal.dot( sphere.velocity ) * 1.5 );
						sphere.collider.center.add( result.normal.multiplyScalar( result.depth ) );

					} else {

						sphere.velocity.y -= GRAVITY * deltaTime;

					}

					const damping = Math.exp( - 1.5 * deltaTime ) - 1;
					sphere.velocity.addScaledVector( sphere.velocity, damping );

					playerSphereCollision( sphere );

				} );

				spheresCollisions();

				for ( const sphere of spheres ) {

					sphere.mesh.position.copy( sphere.collider.center );

				}

			}

			function getForwardVector() {

				camera.getWorldDirection( playerDirection );
				playerDirection.y = 0;
				playerDirection.normalize();

				return playerDirection;

			}

			function getSideVector() {

				camera.getWorldDirection( playerDirection );
				playerDirection.y = 0;
				playerDirection.normalize();
				playerDirection.cross( camera.up );

				return playerDirection;

			}

			function controls( deltaTime ) {

				// gives a bit of air control
				const speedDelta = deltaTime * ( playerOnFloor ? 25 : 8 );

				if ( keyStates[ 'KeyW' ] ) {

					playerVelocity.add( getForwardVector().multiplyScalar( speedDelta ) );

				}

				if ( keyStates[ 'KeyS' ] ) {

					playerVelocity.add( getForwardVector().multiplyScalar( - speedDelta ) );

				}

				if ( keyStates[ 'KeyA' ] ) {

					playerVelocity.add( getSideVector().multiplyScalar( - speedDelta ) );

				}

				if ( keyStates[ 'KeyD' ] ) {

					playerVelocity.add( getSideVector().multiplyScalar( speedDelta ) );

				}

				if ( playerOnFloor ) {

					if ( keyStates[ 'Space' ] ) {

						playerVelocity.y = 3;

					}

				}

			}



			// hdri loader
			
			const hdriTextureURL = new URL("./models/hdri/kloofendal_48d_partly_cloudy_2k.hdr", import.meta.url);
			const hdriloader = new RGBELoader();
			hdriloader.load(hdriTextureURL, function(texture){
				texture.mapping = THREE.EquirectangularReflectionMapping;
				scene.background = texture;
				scene.environment = texture;

			});


			// // loads no collison file

			const loader2 = new GLTFLoader().setPath( './models/gltf/' );

				loader2.load( 'EXCollison off.glb', ( gltf2 ) => {

				scene.add( gltf2.scene );
				gltf2.scene.traverse( child => {

					if ( child.isMesh ) {

						child.material.shading = THREE.SmoothShading;
						child.castShadow = true;
						child.receiveShadow = true;

						if ( child.material.map ) {

							child.material.map.anisotropy = 4;
						}
					}
					} );
				
					
			 	});
			

			const loader = new GLTFLoader().setPath( './models/gltf/' );

			// // loads collison file with shade

			loader.load( 'EXCollison on.glb', ( gltf ) => {

				scene.add( gltf.scene );

				worldOctree.fromGraphNode( gltf.scene );

				gltf.scene.traverse( child => {

					if ( child.isMesh ) {

						child.material.shading = THREE.SmoothShading;
						child.castShadow = true;
						child.receiveShadow = true;

						if ( child.material.map ) {

							child.material.map.anisotropy = 4;
						}
					}
				} );



				// cube texture loader

				// const cubeLoader = new THREE.CubeTextureLoader();
				// cubeLoader.setPath( "./textures/cube/" );

				// textureCube = cubeLoader.load( [ 'posx.jpg', 'negx.jpg', 'posy.jpg', 'negy.jpg', 'posz.jpg', 'negz.jpg' ] );
				// textureCube.encoding = THREE.sRGBEncoding;

				// scene.background = textureCube;



				const helper = new OctreeHelper( worldOctree );
				helper.visible = false;
				scene.add( helper );

				// show gui for debug mode

				// const gui = new GUI( { width: 200 } );
				// gui.add( { debug: false }, 'debug' )
				// 	.onChange( function ( value ) {

				// 		helper.visible = value;

				// 	} );

				animate();

			 } );




			 

			function teleportPlayerIfOob() {

				if ( camera.position.y <= - 25 ) {

					playerCollider.start.set( 0, 0.35, 0 );
					playerCollider.end.set( 0, 1.5, 0 );
					playerCollider.radius = 0.35;
					camera.position.copy( playerCollider.end );
					camera.rotation.set( 0, 0, 0 );

				}

			}


			function animate() {

				const deltaTime = Math.min( 0.05, clock.getDelta() ) / STEPS_PER_FRAME;

				// we look for collisions in substeps to mitigate the risk of
				// an object traversing another too quickly for detection.

				for ( let i = 0; i < STEPS_PER_FRAME; i ++ ) {

					controls( deltaTime );

					updatePlayer( deltaTime );

					updateSpheres( deltaTime );

					teleportPlayerIfOob();

				}

				renderer.render( scene, camera );

				stats.update();

				requestAnimationFrame( animate );

			};

