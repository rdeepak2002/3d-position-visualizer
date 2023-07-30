import {
    AmbientLight,
    DirectionalLight,
    Matrix4,
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
} from "three";
import { io } from "socket.io-client";

const MODEL_SCALE = 2;

import { GLTFLoader } from "GLTFLoader";
let map;

const urlParams = new URLSearchParams(window?.location?.search);
const socketUrl = urlParams?.get('socket_url');
let socket;
if (socketUrl) {
    socket = io(socketUrl);
    console.log("Using socket URL", socketUrl);
} else {
    socket = io();
    console.log("Using current host as socket URL");
}

const mapOptions = {
    tilt: 67.5,
    heading: 0,
    zoom: 21,
    center: { lat: 35.6590945, lng: 139.6999859 },
    mapId: "15431d2b469f209e",  // Google's map id
    // mapId: "c4ea8f63cbffe52d",   // My map id
    // disable interactions due to animation loop and moveCamera
    // disableDefaultUI: true,
    // gestureHandling: "none",
    // keyboardShortcuts: true,
    isFractionalZoomEnabled: true
};

function initMap() {
    const mapDiv = document.getElementById("map");
    map = new google.maps.Map(mapDiv, mapOptions);
    initWebglOverlayView(map);
}

let latLngAltitudeLiteral = {
    lat: mapOptions.center.lat,
    lng: mapOptions.center.lng,
    altitude: 10
};

socket.on("connect", () => {
    console.log("Connected to socket server");
});

socket.on("device-data", (data) => {
    const lat = data?.Position?.x;
    const lng = data?.Position?.y;
    const altitude = data?.Position?.z;

    console.log('Received data from socket (x is lat, y is lng, z is altitude)', data);
    if (lat && lng && altitude) {
        latLngAltitudeLiteral.lat = lat;
        latLngAltitudeLiteral.lng = lng;
        latLngAltitudeLiteral.altitude = altitude;

        const center = { lat: lat, lng: lng };
        mapOptions.center = center;
        map.moveCamera({ center });
    } else {
        console.error("Unable to get lat lng altitude", lat, lng, altitude);
    }
});

function initWebglOverlayView(map) {
    let scene, renderer, camera, loader;
    const webglOverlayView = new google.maps.WebGLOverlayView();

    webglOverlayView.onAdd = () => {
        // Set up the scene.
        scene = new Scene();
        camera = new PerspectiveCamera();

        const ambientLight = new AmbientLight(0xffffff, 0.75); // Soft white light.

        scene.add(ambientLight);

        const directionalLight = new DirectionalLight(0xffffff, 0.25);

        directionalLight.position.set(0.5, -1, 0.5);
        scene.add(directionalLight);
        // Load the model.
        loader = new GLTFLoader();

        const source =
            "./firefighter/scene.gltf";

        loader.load(source, (gltf) => {
            gltf.scene.rotation.x = Math.PI / 2;
            gltf.scene.scale.set(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
            scene.add(gltf.scene);
        });
    };

    webglOverlayView.onContextRestored = ({ gl }) => {
        renderer = new WebGLRenderer({
            canvas: gl.canvas,
            context: gl,
            ...gl.getContextAttributes(),
        });
        renderer.autoClear = false;
        loader.manager.onLoad = () => {
            renderer.setAnimationLoop(() => {
                webglOverlayView.requestRedraw();
                // latLngAltitudeLiteral.altitude += 0.1;
            });
        };
    };

    webglOverlayView.onDraw = ({ gl, transformer }) => {
        // Update camera matrix to ensure the model is georeferenced correctly on the map.
        const matrix = transformer.fromLatLngAltitude(latLngAltitudeLiteral);

        camera.projectionMatrix = new Matrix4().fromArray(matrix);
        webglOverlayView.requestRedraw();
        renderer.render(scene, camera);
        // Sometimes it is necessary to reset the GL state.
        renderer.resetState();
    };

    webglOverlayView.setMap(map);
}

window.initMap = initMap;
