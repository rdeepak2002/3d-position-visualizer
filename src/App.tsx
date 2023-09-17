import MapViewer from "./MapViewer";
import './styles.css';
import {useEffect, useState} from "react";
import {IUnit, UnitColor} from "./IUnit";

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
                }
            }
        ]);
    }, []);

    return (
        <div>
            <MapViewer units={units} />
        </div>
    )
}

export default App
