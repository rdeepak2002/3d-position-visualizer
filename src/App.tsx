import MapViewer from "./MapViewer";
import './styles.css';
import React, {useEffect, useState} from "react";
import {IUnit, UnitColor} from "./IUnit";
import Biometrics from "./Biometrics";

function App() {
    const [units, setUnits] = useState<Array<IUnit>>([]);
    const [isWireframeMode, setWireFrameMode] = useState(false);
    const [mapTransparency, setMapTransparency] = useState(1.0);

    useEffect(() => {
        setUnits([
            {
                id: "1",
                color: UnitColor.Red,
                latLongAlt: {
                    latitude: 35.6586945,
                    longitude: 139.6999859,
                    height: 150.0
                },
                biometrics: {
                    unitName: "B. Krakowsky",
                    heartRate: 100,
                    bloodO2: 95,
                    bodyTemp: 99
                }
            },
            {
                id: "2",
                color: UnitColor.Blue,
                latLongAlt: {
                    latitude: 35.6584945,
                    longitude: 139.6999859,
                    height: 150.0
                },
                biometrics: {
                    unitName: "C. Krakowsky",
                    heartRate: 100,
                    bloodO2: 95,
                    bodyTemp: 99
                }
            }
        ]);
    }, []);

    return (
        <div style={{display: "flex", height: "100%", flexDirection: "column"}}>
            <MapViewer units={units} isWireframeMode={isWireframeMode} mapTransparency={mapTransparency}/>
            <div style={{marginLeft: "10px", display: "flex", alignItems: "center"}}>
                <p style={{marginRight: "10px"}}>Wireframe</p>
                <label className="switch">
                    <input checked={isWireframeMode} type="checkbox" onChange={(e) => {
                        setWireFrameMode(e?.target?.checked || false);
                    }}></input>
                        <span className="slider round"></span>
                </label>
                {/*this only changes the transparency on map load*/}
                {/*<p style={{marginRight: "10px"}}>Transparency</p>*/}
                {/*<input type="range" min="0.0" max="1.0" step="0.05" value={mapTransparency}*/}
                {/*       id="transparencyScale" onChange={(e) => {*/}
                {/*           setMapTransparency(parseFloat(e?.target?.value || "1.0"));*/}
                {/*}}></input>*/}
            </div>
            <Biometrics units={units} isWireframeMode={isWireframeMode} mapTransparency={mapTransparency}
                        setWireFrameMode={setWireFrameMode} setMapTransparency={setMapTransparency}/>
        </div>
    )
}

export default App
