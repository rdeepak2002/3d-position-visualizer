import MapViewer from "./MapViewer";
import './styles.css';
import React, {useEffect, useState} from "react";
import {IUnit, UnitColor} from "./IUnit";
import Biometrics from "./Biometrics";
import {io, Socket} from "socket.io-client";
import {SOCKET_URL} from "./api";
import * as Cesium from "cesium";

function getUnitColorFromId(idIn: any): UnitColor {
    const id = `${idIn}`.trim();
    if (id == "1" || id == "unit-1") {
        return UnitColor.Red;
    } else if (id == "2" || id == "unit-2") {
        return UnitColor.Blue;
    } else if (id == "3" || id == "unit-3") {
        return UnitColor.Green;
    } else if (id == "4" || id == "unit-4") {
        return UnitColor.Purple;
    } else if (id == "5" || id == "unit-5") {
        return UnitColor.Orange;
    } else {
        return UnitColor.Default;
    }
}

function App() {
    const [units, setUnits] = useState<Array<IUnit>>([]);
    const [isWireframeMode, setWireFrameMode] = useState(false);
    const [mapTransparency, setMapTransparency] = useState(1.0);
    const [selectedUnitIdx, setSelectedUnitIdx] = useState(-1);
    const [socket, setSocket] = useState<undefined | Socket>();

    // setup socket listeners
    useEffect(() => {
        const socket = io(SOCKET_URL, {
            autoConnect: true
        });
        setSocket(socket);
        socket.on('connect', () => {
            console.debug("Connected to socket server");
        });
        socket.on("biometrics", (id, unitName, heartRate, bloodO2, bodyTemp) => {
            console.debug("Retrieved biometrics", id, unitName, heartRate, bloodO2, bodyTemp);

            // check if unit already in array
            let unit: IUnit | undefined = units.find((unit) => unit.id === id);

            // create unit if they do not exist
            if (!unit) {
                unit = {
                    id: id,
                    color: getUnitColorFromId(id)
                };
                units.push(unit);
            }

            // update biometric data of unit
            unit.biometrics = {
                unitName: unitName,
                heartRate: heartRate,
                bloodO2: bloodO2,
                bodyTemp: bodyTemp
            };

            // update array
            setUnits([...units]);
        });
        socket.on("device-data", (data: any) => {
            console.debug("Retrieved device data", data);
            const lat = data?.Position?.x;
            const lng = data?.Position?.y;
            const altitude = data?.Position?.z;
            const id = data?.ID;
            if (lat && lng && altitude) {
                // check if unit already in array
                let unit: IUnit | undefined = units.find((unit) => unit.id === id);

                // create unit if they do not exist
                if (!unit) {
                    unit = {
                        id: id,
                        color: getUnitColorFromId(id)
                    };
                    units.push(unit);
                }

                // set lat lng altitude
                unit.latLongAlt = {
                    latitude: lat,
                    longitude: lng,
                    height: altitude
                }

                const longitude = unit.latLongAlt.longitude;
                const latitude = unit.latLongAlt.latitude;
                const height = unit.latLongAlt.height;

                // update all cesium entities
                if (unit?.unitBoxHandle) {
                    unit.unitBoxHandle.position = Cesium.Cartesian3.fromDegrees(longitude, latitude, height + 0.8);
                }

                if (unit?.unitModelHandle) {
                    unit.unitModelHandle.position = Cesium.Cartesian3.fromDegrees(longitude, latitude, height);
                }

                if (unit?.unitLabelHandle) {
                    unit.unitLabelHandle.position = Cesium.Cartesian3.fromDegrees(longitude, latitude, height + 2.0);
                }

                // update array
                setUnits([...units]);

                // re-center map around unit
                const unitIndex = units.indexOf(unit);
                if (unitIndex === selectedUnitIdx) {
                    setSelectedUnitIdx(unitIndex);
                }

                // unitPositions[id] = {
                //     lat: lat,
                //     lng: lng,
                //     altitude: altitude
                // };
                // const center = { lat: lat, lng: lng };
                // mapOptions.center = center;
                // map.moveCamera({ center });
            } else {
                console.error("Unable to get lat lng altitude", lat, lng, altitude);
            }
        });
    }, []);

    // setup dummy data
    useEffect(() => {
        const debugMode = false;

        if (debugMode) {
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
        }
    }, []);

    return (
        <div style={{display: "flex", height: "100%", flexDirection: "column"}}>
            <MapViewer units={units} isWireframeMode={isWireframeMode} mapTransparency={mapTransparency}
                       selectedUnitIdx={selectedUnitIdx}/>
            <div style={{marginLeft: "10px", display: "flex", alignItems: "center"}}>
                <p style={{marginRight: "10px"}}>Wireframe</p>
                <label className="switch">
                    <input checked={isWireframeMode} type="checkbox" onChange={(e) => {
                        setWireFrameMode(e?.target?.checked || false);
                    }}></input>
                        <span className="slider round"></span>
                </label>
            </div>
            <Biometrics units={units} isWireframeMode={isWireframeMode} selectedUnitIdx={selectedUnitIdx}
                        mapTransparency={mapTransparency} setWireFrameMode={setWireFrameMode}
                        setMapTransparency={setMapTransparency} setSelectedUnitIdx={setSelectedUnitIdx}/>
        </div>
    )
}

export default App
