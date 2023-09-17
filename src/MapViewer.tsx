import {useEffect, useRef, useState} from "react";
import * as Cesium from "cesium";
import {API_KEY} from "./api";
import {IUnit, UnitColor} from "./IUnit";

interface IMapViewerProps {
    units: Array<IUnit>,
    isWireframeMode: boolean,
    mapTransparency: number,
    selectedUnitIdx: number,
}

function getCesiumMaterialFromUnitColor(unitColor: UnitColor): Cesium.Color {
    switch (unitColor) {
        case UnitColor.Red:
            return Cesium.Color.RED.withAlpha(0.5);
        case UnitColor.Blue:
            return Cesium.Color.BLUE.withAlpha(0.5);
        case UnitColor.Green:
            return Cesium.Color.GREEN.withAlpha(0.5);
        case UnitColor.Purple:
            return Cesium.Color.PURPLE.withAlpha(0.5);
        case UnitColor.Orange:
            return Cesium.Color.ORANGE.withAlpha(0.5);
        default:
            return Cesium.Color.GREY.withAlpha(0.5);
    }
}

function MapViewer(props: IMapViewerProps) {
    // TODO: use viewer.zoomTo(viewer.entities); to allow selection and viewing of a particular unit

    const [tileset, setTileset] = useState<Cesium.Cesium3DTileset | undefined>(undefined);
    const [viewerCenter, setViewerCenter] = useState(Cesium.Cartesian3.fromDegrees(
        139.6999859, // longitude
        35.6590945, // latitude
        150.0 // height (altitude)
    ));
    const [cesiumViewer, setCesiumViewer] = useState<Cesium.Viewer | undefined>(undefined);
    const moveVelocityX = useRef(0);
    const moveVelocityY = useRef(0);
    const moveVelocityZ = useRef(0);
    const velocityMultiplier = useRef(2.0);

    function setupKeyListeners() {
        window.addEventListener('keypress', (event) => {
            const name = event.key;
            const speed = 0.05;
            if (cesiumViewer) {
                if (name.toLowerCase() == 'd') {
                    moveVelocityX.current = speed;
                }
                if (name.toLowerCase() == 'a') {
                    moveVelocityX.current = -speed;
                }
                if (name.toLowerCase() == 'w') {
                    moveVelocityZ.current = speed * 2;
                }
                if (name.toLowerCase() == 's') {
                    moveVelocityZ.current = -speed * 2;
                }
                if (name.toLowerCase() == 'r') {
                    moveVelocityY.current = speed;
                }
                if (name.toLowerCase() == 'f') {
                    moveVelocityY.current = -speed;
                }
            }
        }, false);
        window.addEventListener('keyup', (event) => {
            const name = event.key;
            const speed = 0.1;
            if (cesiumViewer) {
                if (name.toLowerCase() == 'd') {
                    moveVelocityX.current = 0;
                }
                if (name.toLowerCase() == 'a') {
                    moveVelocityX.current = 0;
                }
                if (name.toLowerCase() == 'w') {
                    moveVelocityZ.current = 0;
                }
                if (name.toLowerCase() == 's') {
                    moveVelocityZ.current = 0;
                }
                if (name.toLowerCase() == 'r') {
                    moveVelocityY.current = 0;
                }
                if (name.toLowerCase() == 'f') {
                    moveVelocityY.current = 0;
                }
            }
        }, false);
    }

    // center around new unit since it is selected
    useEffect(() => {
        const unitIdx = props.selectedUnitIdx;
        console.debug("Viewer is selecting", unitIdx);
        if (props?.units.length > 0 && unitIdx < props?.units.length) {
            const unit = props?.units[unitIdx];
            if (unit) {
                const longitude = unit?.latLongAlt?.longitude || 0.0;
                const latitude = unit?.latLongAlt?.latitude || 0.0;
                const height = unit?.latLongAlt?.height || 0.0;

                const cesiumLongLatHeight = Cesium.Cartesian3.fromDegrees(
                    longitude,
                    latitude,
                    height
                );

                setViewerCenter(cesiumLongLatHeight);
            }
        }
    }, [props?.selectedUnitIdx, cesiumViewer]);

    // make map wireframe mode
    useEffect(() => {
        if (tileset) tileset.debugWireframe = props?.isWireframeMode || false;
    }, [props?.isWireframeMode]);

    // change transparency of newly loaded tiles
    useEffect(() => {
        if (tileset) {
            tileset.style = new Cesium.Cesium3DTileStyle({
                color : `color('#FFFFFF', ${props?.mapTransparency})`,
                show : true
            });
        }
    }, [props?.mapTransparency]);

    // when viewing center variable changes, make cesium viewer look at that
    useEffect(() => {
        if (cesiumViewer && viewerCenter) {
            const transform = Cesium.Transforms.eastNorthUpToFixedFrame(viewerCenter);

            cesiumViewer.scene.camera.lookAtTransform(
                transform,
                new Cesium.HeadingPitchRange(0, -Math.PI / 8, 30)
            );

            cesiumViewer.scene.camera.rotateRight(1.7);
        }
    }, [viewerCenter, cesiumViewer]);

    // initialize cesium viewer
    useEffect(() => {
        if (cesiumViewer) {
            // remove all entities
            // cesiumViewer.entities.removeAll();

            // add entity per unit
            const units = props?.units || [];
            for (let unitIdx = 0; unitIdx < units.length; unitIdx++) {
                const unit = units[unitIdx];

                const longitude = unit?.latLongAlt?.longitude || 0.0;
                const latitude = unit?.latLongAlt?.latitude || 0.0;
                const height = unit?.latLongAlt?.height || 0.0;

                const cesiumLongLatHeight = Cesium.Cartesian3.fromDegrees(
                    longitude,
                    latitude,
                    height
                );

                if (props?.selectedUnitIdx === -1 || props?.selectedUnitIdx === undefined) {
                    setViewerCenter(cesiumLongLatHeight);
                }

                console.debug("Fetching model");

                // firefighter model
                if (!unit.unitModelHandle) {
                    unit.unitModelHandle = cesiumViewer.entities.add({
                        position: cesiumLongLatHeight,
                        model: {
                            uri: 'models/firefighter/scene.gltf'
                        },
                        point: {
                            pixelSize: 10,
                            color: getCesiumMaterialFromUnitColor(unit.color),
                            outlineColor: Cesium.Color.WHITE,
                            outlineWidth: 2,
                        },
                    });
                }

                // translucent box
                if (!unit.unitBoxHandle) {
                    unit.unitBoxHandle = cesiumViewer.entities.add({
                        position: Cesium.Cartesian3.fromDegrees(longitude, latitude, height + 0.8),
                        box: {
                            dimensions: new Cesium.Cartesian3(1.5, 1.5, 2),
                            material: getCesiumMaterialFromUnitColor(unit.color),
                            outline: true,
                            outlineColor: Cesium.Color.BLACK,
                        },
                    });
                    // how to change color: Cesium.Color.RED.withAlpha(0.5),
                    // unit.unitBoxHandle.box.material = Cesium.Color.GREEN.withAlpha(0.5);
                }

                // firefighter label
                if (!unit.unitLabelHandle) {
                    unit.unitLabelHandle = cesiumViewer.entities.add({
                        position: Cesium.Cartesian3.fromDegrees(longitude, latitude, height + 2.0),
                        label: {
                            text: `Unit ${unit.id}`,
                            font: "16pt monospace",
                            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                            outlineWidth: 4,
                            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                            pixelOffset: new Cesium.Cartesian2(0, 0),
                        },
                    });
                }

                console.debug("Units", units);
                console.debug("Done fetching model");
            }
        } else {
            // initialize cesium viewer
            // Cesium.Ion.defaultAccessToken = ;
            console.debug("Creating cesium viewer");
            const viewer = new Cesium.Viewer('cesiumContainer', {
                // imageryProvider: false,
                baseLayerPicker: false,
                requestRenderMode: true,
                homeButton: false,
                infoBox: false,
                timeline: false,
                navigationHelpButton: false,
                navigationInstructionsInitiallyVisible: false,
                scene3DOnly: true,
                creditViewport: undefined,
                creditContainer: undefined
            });
            setCesiumViewer(viewer);
            // const canvas = viewer.canvas;
            // canvas.setAttribute('tabindex', '0'); // needed to put focus on the canvas

            const tileset: Cesium.Cesium3DTileset = viewer.scene.primitives.add(new Cesium.Cesium3DTileset({
                url: `https://tile.googleapis.com/v1/3dtiles/root.json?key=${API_KEY}`,
                showCreditsOnScreen: true,
                backFaceCulling: true,
                enableDebugWireframe: true,
                // debugWireframe: true
            }));
            // viewer.scene.globe.show = false;
            // viewer.scene.globe.depthTestAgainstTerrain = true;

            tileset.debugWireframe = props?.isWireframeMode || false;
            tileset.style = new Cesium.Cesium3DTileStyle({
                color : `color('#FFFFFF', ${props?.mapTransparency})`,
                show : true
            });

            setTileset(tileset);

            // Lock the camera onto a point.
            // const transform = Cesium.Transforms.eastNorthUpToFixedFrame(viewerCenter);
            //
            // viewer.scene.camera.lookAtTransform(
            //     transform,
            //     new Cesium.HeadingPitchRange(0, -Math.PI / 8, 200)
            // );
            //
            // viewer.scene.camera.rotateRight(3.14);

            // Orbit around this point.
            // viewer.clock.onTick.addEventListener(function (clock) {
            //     viewer.scene.camera.rotateRight(0.005);
            // });
        }
    }, [props.units]);

    useEffect(() => {
        if (cesiumViewer) {
            cesiumViewer.clock.onTick.addEventListener(function (clock) {
                setupKeyListeners();
                cesiumViewer.camera.setView({
                    orientation: {
                        heading: cesiumViewer.camera.heading,
                        pitch: cesiumViewer.camera.pitch,
                        roll: 0
                    }
                });
                cesiumViewer.camera.moveRight(moveVelocityX.current * velocityMultiplier.current);
                cesiumViewer.camera.moveForward(moveVelocityZ.current * velocityMultiplier.current);
                cesiumViewer.camera.moveUp(moveVelocityY.current * velocityMultiplier.current);
            });
        }
    }, [cesiumViewer]);

    return (
        <div id="cesiumContainer"></div>
    )
}

export default MapViewer;
