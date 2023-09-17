import MapViewer from "./MapViewer";
import './styles.css';
import React, {useEffect, useState} from "react";
import {IUnit, UnitColor} from "./IUnit";
import Biometrics from "./Biometrics";

function App() {
    const [units, setUnits] = useState<Array<IUnit>>([]);

    useEffect(() => {
        setUnits([
            {
                id: "1",
                color: UnitColor.Red,
                latLongAlt: {
                    latitude: 35.6585945,
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
            <MapViewer units={units} />
            <Biometrics units={units} />
        </div>
    )
}

export default App
