import {
    AmbientLight,
    DirectionalLight,
    Matrix4,
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
    SphereGeometry,
    MeshBasicMaterial,
    Mesh,
    Texture,
    PlaneGeometry
} from "three";
import { io } from "socket.io-client";

const MODEL_SCALE = 2;

import { GLTFLoader } from "GLTFLoader";
let map;

const urlParams = new URLSearchParams(window?.location?.search);
const socketUrl = urlParams?.get('socket_url') || 'https://drone-position-visualizer.herokuapp.com';
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

/**
 * Create a custom button in the top center of Google Maps view
 */
function createCenterControl(textContent, map, cb) {
    const controlButton = document.createElement("button");
    controlButton.style.backgroundColor = "#fff";
    controlButton.style.border = "2px solid #fff";
    controlButton.style.borderRadius = "3px";
    controlButton.style.boxShadow = "0 2px 6px rgba(0,0,0,.3)";
    controlButton.style.color = "rgb(25,25,25)";
    controlButton.style.cursor = "pointer";
    controlButton.style.fontFamily = "Roboto,Arial,sans-serif";
    controlButton.style.fontSize = "16px";
    controlButton.style.lineHeight = "38px";
    controlButton.style.margin = "8px 8px 22px";
    controlButton.style.padding = "0 5px";
    controlButton.style.textAlign = "center";
    controlButton.textContent = textContent;
    controlButton.title = "Click to recenter the map";
    controlButton.type = "button";
    controlButton.addEventListener("click", () => {
        cb(map);
    });
    return controlButton;
}

function addButtonsToMap(map) {
    const centerControlDiv = document.createElement("div");
    const startBtn = createCenterControl("Start", map, (_map) => {
        let inputText = window.prompt("Please input latitude, longitude, altitude, and unit ID (ex: '55.55, 66.66, 77.77, unit-1')", "");
        let data = inputText?.split(",");
        if (data && data.length >= 4) {
            const lat = parseFloat(data[0]?.trim() || 0.00);
            const lng = parseFloat(data[1]?.trim() || 0.00);
            const alt = parseFloat(data[2]?.trim() || 0.00);
            const id = data[3]?.trim() || "no_id";
            socket.emit("start", lat, lng, alt, id);
        } else {
            console.error("Input is not valid");
            alert("Input is not valid");
        }
    });
    const stopBtn = createCenterControl("Stop", map, (_map) => {
        let inputText = window.prompt("Please input unit ID (ex: 'unit-1')", "");
        const id = inputText?.trim() || "no_id";
        socket.emit("stop", id);
    });
    centerControlDiv.appendChild(startBtn);
    centerControlDiv.appendChild(stopBtn);
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(centerControlDiv);
}

function initMap() {
    const mapDiv = document.getElementById("map");
    map = new google.maps.Map(mapDiv, mapOptions);
    addButtonsToMap(map);
    initWebglOverlayView(map);
}

let unitPositions = {};

// let latLngAltitudeLiteral = {
//     lat: mapOptions.center.lat,
//     lng: mapOptions.center.lng,
//     altitude: 10
// };

socket.on("connect", () => {
    console.log("Connected to socket server");
});

socket.on("device-data", (data) => {
    const lat = data?.Position?.x;
    const lng = data?.Position?.y;
    const altitude = data?.Position?.z;
    const id = data?.ID;

    console.log('Received data from socket (x is lat, y is lng, z is altitude)', data);
    if (lat && lng && altitude) {
        unitPositions[id] = {
            lat: lat,
            lng: lng,
            altitude: altitude
        };
        const center = { lat: lat, lng: lng };
        mapOptions.center = center;
        map.moveCamera({ center });
    } else {
        console.error("Unable to get lat lng altitude", lat, lng, altitude);
    }
});

function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
    };
    return `0x${f(0)}${f(8)}${f(4)}`;
}

function getColorFromText(stringInput) {
    if (stringInput === 'unit-1' || stringInput === 'unit-unit-1') {
        return parseInt('0x59c759', 16);
    } else if (stringInput === 'unit-2' || stringInput === 'unit-unit-2') {
        return parseInt('0xff5757', 16);
    } else if (stringInput === 'unit-3' || stringInput === 'unit-unit-3') {
        return parseInt('0x5e00ff', 16);
    } else if (stringInput === 'unit-4' || stringInput === 'unit-unit-4') {
        return parseInt('0x689096', 16);
    } else if (stringInput === 'unit-5' || stringInput === 'unit-unit-5') {
        return parseInt('0xdbc7ff', 16);
    }
    let stringUniqueHash = [...stringInput].reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    return parseInt(hslToHex(stringUniqueHash % 360, 0.95, 0.35), 16);
}

function initWebglOverlayView(map) {
    let scene, renderer, camera, loader, model3D;
    const webglOverlayView = new google.maps.WebGLOverlayView();

    webglOverlayView.onAdd = () => {
        camera = new PerspectiveCamera();

        // Set up the scene.
        scene = new Scene();
        // const ambientLight = new AmbientLight(0xffffff, 0.75); // Soft white light.
        // scene.add(ambientLight);
        // const directionalLight = new DirectionalLight(0xffffff, 0.25);
        // directionalLight.position.set(0.5, -1, 0.5);
        // scene.add(directionalLight);
        // // Load the model.
        loader = new GLTFLoader();
        // // status
        // {
        //     // sphere
        //     {
        //         const geometry = new SphereGeometry( 0.5, 32, 16 );
        //         const material = new MeshBasicMaterial( { color: 0xffff00 } );
        //         const sphere = new Mesh( geometry, material );
        //         scene.add( sphere );
        //     }
        // }
        // 3D model
        {
            const source =
                "./firefighter/scene.gltf";
            loader.load(source, (gltf) => {
                model3D = gltf;
                // gltf.scene.rotation.x = Math.PI / 2;
                // gltf.scene.scale.set(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
                // scene.add(gltf.scene);
            });
        }
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
            });
        };
    };

    webglOverlayView.onDraw = ({ gl, transformer }) => {
        // clear scene and add lights
        if (scene) {
            while(scene.children.length > 0){
                scene.remove(scene.children[0]);
            }
            const ambientLight = new AmbientLight(0xffffff, 0.75); // Soft white light.
            scene.add(ambientLight);
            const directionalLight = new DirectionalLight(0xffffff, 0.25);
            directionalLight.position.set(0.5, -1, 0.5);
            scene.add(directionalLight);
        }

        const keys = Object.keys(unitPositions);
        for (let i = 0; i < keys.length; i++) {
            const id = keys[i];
            // console.log(id, Object.keys(unitPositions));
            const latLongAlt = unitPositions[id];
            if (latLongAlt === undefined) {
                console.warn(`Undefined latLongAlt for ${id} in ${JSON.stringify(unitPositions)}`);
                continue;
            }
            // console.log(`Drawing ${id} at ${latLongAlt}`)

            // Update camera matrix to ensure the model is georeferenced correctly on the map.
            const matrix = transformer.fromLatLngAltitude(latLongAlt);

            camera.projectionMatrix = new Matrix4().fromArray(matrix);
            webglOverlayView.requestRedraw();

            if (scene) {
                // add elements for each firefighter
                {
                    // status
                    {
                        // sphere
                        {
                            const geometry = new SphereGeometry( 0.4, 32, 16 );
                            const material = new MeshBasicMaterial( { color: getColorFromText(`unit-${id}`) || 0xffff00 } );
                            const sphere = new Mesh( geometry, material );
                            sphere.position.x = -1;
                            sphere.position.z = 4;
                            scene.add( sphere );
                        }
                        // text
                        {
                            const name = `Unit ${id}`;
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext("2d");
                            ctx.font="100px Georgia";
                            ctx.fillStyle = "#ffffff";
                            ctx.fillText(name,10,110);
                            const texture = new Texture(canvas);
                            texture.needsUpdate = true; //just to make sure it's all up to date.
                            const label = new Mesh(new PlaneGeometry, new MeshBasicMaterial({map:texture}));
                            label.rotation.x = Math.PI * 0.5;
                            label.position.z = 4;
                            // label.lookAt(camera.position);
                            scene.add(label);
                        }
                    }
                    if (model3D !== undefined) {
                        model3D.scene.rotation.x = Math.PI / 2;
                        model3D.scene.scale.set(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
                        scene.add(model3D.scene);
                    }
                }
                renderer.render(scene, camera);
            }

            // renderer.render(scene, camera);
            // Sometimes it is necessary to reset the GL state.
            renderer.resetState();
        }
    };

    webglOverlayView.setMap(map);
}

window.initMap = initMap;
