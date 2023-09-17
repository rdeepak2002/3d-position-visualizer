import {useEffect, useState} from "react";
import * as Cesium from "cesium";
import {API_KEY} from "./api";
import {IUnit, UnitColor} from "./IUnit";

interface IMapViewerProps {
    units: Array<IUnit>
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

    const [viewerCenter, setViewerCenter] = useState(Cesium.Cartesian3.fromDegrees(
        139.6999859, // longitude
        35.6590945, // latitude
        150.0 // height (altitude)
    ));
    const [cesiumViewer, setCesiumViewer] = useState<Cesium.Viewer | undefined>(undefined);

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

    // run cesium viewer
    useEffect(() => {
        if (cesiumViewer) {
            // remove all entities
            cesiumViewer.entities.removeAll();

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

                setViewerCenter(cesiumLongLatHeight);
                console.debug("Fetching model");

                // firefighter model
                if (!unit.unitModelHandle) {
                    unit.unitModelHandle = cesiumViewer.entities.add({
                        position: cesiumLongLatHeight,
                        model: {
                            uri: 'models/firefighter/scene.gltf'
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

            const tileset = viewer.scene.primitives.add(new Cesium.Cesium3DTileset({
                url: `https://tile.googleapis.com/v1/3dtiles/root.json?key=${API_KEY}`,
                showCreditsOnScreen: true,
            }));

            viewer.scene.globe.show = false;

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

    return (
        <div id="cesiumContainer"></div>
    )
}

export default MapViewer;
