import * as THREE from 'three';
import dat from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { DragControls } from 'three/examples/jsm/controls/DragControls';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const container = document.querySelector('#container');

const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

const clock = new THREE.Clock();

let renderer, scene, camera, orbitControls, cameraDragControls, lookDragControls, mixer, gui;
let cameraPoints = [];
let lookPoints = [];
let cameraMoves;
let cameraMovesPoints = [];
let lookMoves;
let lookMovesPoints = [];
let lookPointFirst;
let currentCamera;
let currentLook;

let chkOrbitControl = false;
let chkDebug = true;

const value = {
    camera: [
        new THREE.Vector3(-2.2,   0,    -3.5),
        new THREE.Vector3( 1.2,   0.5,  -6.3),
        new THREE.Vector3( 6,     0.51, -5.92),
        new THREE.Vector3( 3.73,  2.03, -7.24),
        new THREE.Vector3( 7.8,   2,    -2.8 ),
        new THREE.Vector3( 4.5,   0,     0 ),
        new THREE.Vector3( 5.94, -0.46,  2.78 ),
        new THREE.Vector3( 3.09, -0.69, -0.19 ),
        new THREE.Vector3( 3.09, -0.69, -0.19 ),
        new THREE.Vector3( 1.18, -0.6,  -0.14 ),
        new THREE.Vector3( 0.74, -0.42,  0.32 ),
        new THREE.Vector3( 0.32, -0.4,   1.85 ),
        new THREE.Vector3( 1.24, -0.73,  4.14 ),
        new THREE.Vector3( 0.33,  0.47,  4.12 ),
        new THREE.Vector3( 0.33,  0.47,  4.12 ),
        new THREE.Vector3( 1.06,  2.32,  4.13 ),
    ],
    look: [
        new THREE.Vector3(-2.2,  -0.5,   0),
        new THREE.Vector3(-1.4,  -0.5,  -1.8),
        new THREE.Vector3( 2.5,  -0.3,  -2.7),
        new THREE.Vector3( 2.67,  0.53, -2.11),
        new THREE.Vector3( 2.8,   0.15,  1.27),
        new THREE.Vector3( 2.8,   0.3,  -0.2),
        new THREE.Vector3( 1.8,  -0.8,  -0.2),
        // new THREE.Vector3( 0.75,  0.4, -0.15),
        // new THREE.Vector3( 0.63,  0.7,  0.04),
        new THREE.Vector3( 0.91, -0.7,  -0.36),
        new THREE.Vector3(-0.17, -0.53, -0.5),
        new THREE.Vector3( 0.6,  -0.5,   1.12),
        new THREE.Vector3( 1.40, -0.94,  2.10),
        new THREE.Vector3( 0.89, -0.54,  1.66),
        new THREE.Vector3(-0.55,  0.61,  1.62),
        new THREE.Vector3( 1.44,  2.66,  1.02),
    ],
}

const init = function () {
    // Renderer
    renderer = new THREE.WebGL1Renderer({ antialias: true, });
    renderer.setSize(WIDTH, HEIGHT);
    renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild( renderer.domElement );

    // PmremGenerator
    const pmremGenerator = new THREE.PMREMGenerator( renderer );

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xbfe3dd );
    scene.environment = pmremGenerator.fromScene( new RoomEnvironment(), 0.04 ).texture;

    // Camera
    camera = new THREE.PerspectiveCamera( 40, WIDTH/HEIGHT, 0.1, 100 );
    camera.position.set(5, 3, 8);
    camera.lookAt(0, 0.5, 0);
    scene.add(camera);

    // Controls
    orbitControls = new OrbitControls( camera, renderer.domElement );
    orbitControls.target.set( 0, 0.5, 0 );

    // Floor
    const floorGeomatery = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.MeshBasicMaterial({ color: '#080808', side: THREE.DoubleSide });
    const floorMesh = new THREE.Mesh(floorGeomatery, floorMaterial);
    floorMesh.rotation.x = Math.PI / 2;
    floorMesh.position.y = -1;
    scene.add(floorMesh);

    // Loader
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath( '/libs/draco/gltf/' );

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader( dracoLoader );
    gltfLoader.load( 
        '/models/gltf/LittlestTokyo.glb', 
        gltf => {
            const model = gltf.scene;
            model.position.set( 1, 1, 0 );
            model.scale.set( 0.01, 0.01, 0.01 );
            scene.add( model );
            
            mixer = new THREE.AnimationMixer( model );
            mixer.clipAction( gltf.animations[0] ).play();
        }
    ), undefined, function ( e ) {
        console.error( e );
    } 

    createRoute();
}

const scroll = function () {
    let scrollTop = window.pageYOffset;
    let moveArea = container.offsetHeight - window.innerHeight;
    let percent = scrollTop / moveArea;

    currentCamera = Math.round(percent * (cameraMovesPoints.length - 1));
    currentLook = Math.round(percent * (lookMovesPoints.length - 1));
}

const draw = function () {
    const delta = clock.getDelta();

    if ( chkOrbitControl ) {
        orbitControls.update();
    } else {
        orbitControls.enabled = false;
    
        if ( cameraMovesPoints[currentCamera] ) {
            camera.position.lerp(cameraMovesPoints[currentCamera], 0.05);
            lookPointFirst.lerp(lookMovesPoints[currentLook], 0.05);
            camera.lookAt(lookPointFirst);
        }
    }
    if ( mixer ) mixer.update( delta );

    renderer.render( scene, camera );
    renderer.setAnimationLoop(draw);
}

const createRoute = function () {
    const pointGeometry = new THREE.SphereGeometry(0.05);
    const pointMaterialBlue = new THREE.MeshBasicMaterial({ color: 'blue' });
    const pointMaterialRed = new THREE.MeshBasicMaterial({ color: 'red' });
    
    // camera - point
    for (let i = 0; i < value.camera.length; i++) {
        const cameraPoint = new THREE.Mesh(pointGeometry, pointMaterialRed);
        cameraPoint.position.set(value.camera[i].x, value.camera[i].y, value.camera[i].z);
        cameraPoint.name = `lookPoint_${i}`;
        cameraPoints.push(cameraPoint);

        if ( chkDebug ) scene.add(cameraPoint);
    }
    if ( chkDebug ) {
        cameraDragControls = new DragControls( cameraPoints, camera, renderer.domElement );
        cameraDragControls.addEventListener('dragstart', e => {
            orbitControls.enabled = false;
        });
        cameraDragControls.addEventListener('dragend', e => {
            console.log(e.object.position);
            orbitControls.enabled = true;
        });
    }

    // camera - line
    cameraMoves = new THREE.CatmullRomCurve3( value.camera );
    cameraMovesPoints = cameraMoves.getSpacedPoints(200);
    const cameraMoveLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(cameraMovesPoints),
        new THREE.LineBasicMaterial({ color: 'orange' })
    );
    if ( chkDebug ) scene.add(cameraMoveLine);

    // look - point
    for (let i = 0; i < value.look.length; i++) {
        const lookPoint = new THREE.Mesh(pointGeometry, pointMaterialBlue);
        lookPoint.position.set(value.look[i].x, value.look[i].y, value.look[i].z);
        lookPoint.name = `lookPoint_${i}`;
        if ( chkDebug ) scene.add(lookPoint);
        lookPoints.push(lookPoint);
    }
    if ( chkDebug ) {
        lookDragControls = new DragControls( lookPoints, camera, renderer.domElement );
        lookDragControls.addEventListener('dragstart', e => {
            orbitControls.enabled = false;
        });
        lookDragControls.addEventListener('dragend', e => {
            console.log(e.object.position);
            orbitControls.enabled = true;
        });
    }

    // look - line
    lookPointFirst = value.look[0].clone();
    lookMoves = new THREE.CatmullRomCurve3( value.look );
    lookMovesPoints = lookMoves.getSpacedPoints(200);
    const lookMoveLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(lookMovesPoints),
        new THREE.LineBasicMaterial({ color: 'purple' })
    );
    if ( chkDebug ) scene.add(lookMoveLine)
}

init();
draw();
scroll();
window.addEventListener('scroll', scroll);

// if ( chkOrbitControl ) {
//     window.addEventListener('click', function() {
//         console.log('camera position', camera.position );
//     })
// } 