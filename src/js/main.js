import * as THREE from 'three';
import dat from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { DragControls } from 'three/examples/jsm/controls/DragControls';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

const clock = new THREE.Clock();
let renderer, scene, camera, orbitControls, dragControls, mixer, gui;
let lookPoints = [];

const value = {
    look: [
        new THREE.Vector3(-2.4, -0.5, 0),
        new THREE.Vector3(-1.4, -0.5, -1.8),
    ],
}

const init = function () {
    // Renderer
    renderer = new THREE.WebGL1Renderer({ antialias: true, });
    renderer.setSize(WIDTH, HEIGHT);
    renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
    renderer.outputEncoding = THREE.sRGBEncoding;
    document.querySelector('#container').appendChild( renderer.domElement );

    // PmremGenerator
    const pmremGenerator = new THREE.PMREMGenerator( renderer );

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xbfe3dd );
    scene.environment = pmremGenerator.fromScene( new RoomEnvironment(), 0.04 ).texture;

    // Camera
    camera = new THREE.PerspectiveCamera( 40, WIDTH/HEIGHT, 1, 100 );
    camera.position.set(5, 3, 8);
    camera.lookAt(0, 0.5, 0);
    scene.add(camera);

    // Helper
    gui = new dat.GUI();
    gui.add(camera.position, 'x', 0, 20, 0.01).name('camera p x');
    gui.add(camera.position, 'y', 0, 20, 0.01).name('camera p y');
    gui.add(camera.position, 'z', 0, 20, 0.01).name('camera p z');
    gui.add(camera.rotation, 'x', -3, 3, 0.001).name('camera r x');
    gui.add(camera.rotation, 'y', -3, 3, 0.001).name('camera r y');
    gui.add(camera.rotation, 'z', -3, 3, 0.001).name('camera r z');

    // Controls
    orbitControls = new OrbitControls( camera, renderer.domElement );
    orbitControls.target.set( 0, 0.5, 0 );

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

    createPoint();
}

const draw = function () {
    const delta = clock.getDelta();

    orbitControls.update();
    if( mixer ) mixer.update( delta );

    renderer.render( scene, camera );
    renderer.setAnimationLoop(draw);
}

const createPoint = function () {
    const pointGeometry = new THREE.SphereGeometry(0.5);
    const pointMaterial = new THREE.MeshBasicMaterial({ color: 'blue' });
    
    // camera

    // look
    const lookPoint = new THREE.Mesh(pointGeometry, pointMaterial);
    lookPoint.position.set(-2.4, -0.5, 0);
    scene.add(lookPoint);
    lookPoints.push(lookPoint);

    gui.add(lookPoint.position, 'x', -50, 100, 0.01).name('lookPoint x');
    gui.add(lookPoint.position, 'y', -50, 100, 0.01).name('lookPoint y');
    gui.add(lookPoint.position, 'z', -50, 100, 0.01).name('lookPoint z');


    
    dragControls = new DragControls( lookPoint, camera, renderer.domElement );
    console.log(dragControls.domElement);
    // dragControls.domElement.addEventListener('click', function () {
    //     dragControls.lock();
    // })
    
}

const createRoute = function () {
    //
}

init();
draw();