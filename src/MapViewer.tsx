import {useEffect, useState} from "react";
import * as Cesium from "cesium";

function MapViewer() {
    const API_KEY = "AIzaSyCGrVl_1tcAnFz77pqjSyW3FTjpk-L9-0Y";
    const [cesiumViewer, setCesiumViewer] = useState<Cesium.Viewer | undefined>(undefined);

    useEffect(() => {
        if (!cesiumViewer) {
            // Cesium.Ion.defaultAccessToken = ;
            console.debug("Setting cesium viewer");
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
            const center = Cesium.Cartesian3.fromDegrees(
                139.6999859, // longitude
                35.6590945, // latitude
                150.0 // height (altitude)
            );

            const transform = Cesium.Transforms.eastNorthUpToFixedFrame(center);

            viewer.scene.camera.lookAtTransform(
                transform,
                new Cesium.HeadingPitchRange(0, -Math.PI / 8, 200)
            );

            // Orbit around this point.
            viewer.clock.onTick.addEventListener(function (clock) {
                viewer.scene.camera.rotateRight(0.005);
            });
        }
    }, []);

    return (
        <div id="cesiumContainer"></div>
    )
}

export default MapViewer;
