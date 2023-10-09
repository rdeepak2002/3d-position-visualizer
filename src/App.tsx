import MapViewer from "./MapViewer";
import './styles.css';
import React, {useEffect, useState} from "react";
import {IUnit, UnitColor} from "./IUnit";
import Biometrics from "./Biometrics";
import {io, Socket} from "socket.io-client";
import {API_KEY, SOCKET_URL} from "./api";
import * as Cesium from "cesium";
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import queryString from 'query-string';

function getUnitColorFromId(idIn: any): UnitColor {
    const id = `${idIn}`.trim();
    if (id == "1" || id == "unit-1" || id == "unit1") {
        return UnitColor.Red;
    } else if (id == "2" || id == "unit-2" || id == "unit2") {
        return UnitColor.Blue;
    } else if (id == "3" || id == "unit-3" || id == "unit3") {
        return UnitColor.Green;
    } else if (id == "4" || id == "unit-4" || id == "unit4") {
        return UnitColor.Purple;
    } else if (id == "5" || id == "unit-5" || id == "unit5") {
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
    const [enableTransparency, setEnableTransparency] = useState(queryString?.parse(location?.search || "")?.is_transparent === "true");

    const [shouldCenterAroundNewUnitUpdates, setShouldCenterAroundNewUnitUpdates] = useState(true);

    const [show, setShow] = useState(false);
    const [startData, setStartData] = useState([
        {
            lat: "33.748997",
            lng: "-84.387985",
            alt: "auto",
            unitId: "1",
            scenario: "a",
            key: 1
        },
        {
            lat: "33.748997",
            lng: "-84.387985",
            alt: "auto",
            unitId: "2",
            scenario: "a",
            key: 2
        },
        {
            lat: "33.748997",
            lng: "-84.387985",
            alt: "auto",
            unitId: "3",
            scenario: "a",
            key: 3
        },
        {
            lat: "33.748997",
            lng: "-84.387985",
            alt: "auto",
            unitId: "4",
            scenario: "a",
            key: 4
        }
    ]);

    useEffect(() => {
        setMapTransparency(enableTransparency ? 0.5 : 1.0);
    }, [enableTransparency]);

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
            <Modal size="lg" show={show} onHide={() => {
                setShow(false);
            }}>
                <Modal.Header closeButton>
                    <Modal.Title>Start</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Please input latitude, longitude, altitude, unit ID, and scenario</p>
                    {
                        startData.map((data, idx) => {
                            return (
                                <div key={data.key}>
                                    <InputGroup className="mb-3">
                                        {/*<InputGroup.Text>Unit</InputGroup.Text>*/}
                                        <Form.Control aria-label="Latitude" defaultValue={data.lat} onChange={(e) => {
                                            data.lat = e.target.value;
                                            startData[idx] = data;
                                            setStartData([...startData]);
                                        }} />
                                        <Form.Control aria-label="Longitude" defaultValue={data.lng} onChange={(e) => {
                                            data.lng = e.target.value;
                                            startData[idx] = data;
                                            setStartData([...startData]);
                                        }}  />
                                        <Form.Control aria-label="Altitude" defaultValue={data.alt} onChange={(e) => {
                                            data.alt = e.target.value;
                                            startData[idx] = data;
                                            setStartData([...startData]);
                                        }}  />
                                        <Form.Control aria-label="Unit ID" defaultValue={data.unitId} onChange={(e) => {
                                            data.unitId = e.target.value;
                                            startData[idx] = data;
                                            setStartData([...startData]);
                                        }}  />
                                        <Form.Control aria-label="Scenario" defaultValue={data.scenario} onChange={(e) => {
                                            data.scenario = e.target.value;
                                            startData[idx] = data;
                                            setStartData([...startData]);
                                        }}  />
                                        <Button variant="outline-danger" onClick={() => {
                                            startData.splice(idx, 1);
                                            setStartData([...startData]);
                                        }}>Remove</Button>
                                    </InputGroup>
                                </div>
                            );
                        })
                    }
                    <Button variant="primary" onClick={() => {
                        startData.push({
                            lat: "33.748997",
                            lng: "-84.387985",
                            alt: "auto",
                            unitId: `${startData.length + 1}`,
                            scenario: "a",
                            key: new Date().getTime()
                        });
                        setStartData([...startData]);
                    }}>
                        Add
                    </Button>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => {
                        setShow(false);
                    }}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={async () => {
                        if (socket) {
                            for (const data of startData) {
                                let alt: any = data.alt.trim();
                                if (data.alt.trim() === "auto") {
                                    // automatically find lat long of altitude
                                    const corsAnywhereUrl = `https://rdeepak2002-cors-anywhere-ca868129ad08.herokuapp.com/`;
                                    const url = `${corsAnywhereUrl}https://maps.googleapis.com/maps/api/elevation/json?locations=${data.lat},${data.lng}&key=${API_KEY}`;
                                    console.log("Going to fetch from API", url);
                                    try {
                                        const response = await axios.get(url);
                                        alt = parseFloat(`${response?.data?.results[0]?.elevation || 10.0}`);
                                    } catch (e) {
                                        console.error("Unable to make request to google elevation api", e);
                                    }
                                } else {
                                    alt = parseFloat(data.alt.trim() || '0.00');
                                }
                                console.log("Sending start data", parseFloat(data.lat), parseFloat(data.lng), parseFloat(alt), data.unitId, data.scenario);
                                socket.emit("start", parseFloat(data.lat), parseFloat(data.lng), parseFloat(alt), data.unitId, data.scenario);
                            }
                            setShow(false);
                        } else {
                            setShow(false);
                        }
                    }}>
                        Send Data
                    </Button>
                </Modal.Footer>
            </Modal>
            <MapViewer units={units} isWireframeMode={isWireframeMode} mapTransparency={mapTransparency}
                       selectedUnitIdx={selectedUnitIdx} shouldCenterAroundNewUnitUpdates={shouldCenterAroundNewUnitUpdates}/>
            <div style={{marginLeft: "10px", display: "flex", alignItems: "center", columnGap: "10px"}}>
                <p style={{marginRight: "10px", marginTop: "auto", marginBottom: "auto", fontSize: "1.5rem"}}>Wireframe</p>
                <label className="switch">
                    <input checked={isWireframeMode} type="checkbox" onChange={(e) => {
                        setWireFrameMode(e?.target?.checked || false);
                    }}></input>
                        <span className="slider round"></span>
                </label>
                <p style={{marginRight: "10px", marginTop: "auto", marginBottom: "auto", fontSize: "1.5rem"}}>Center on Unit Updates</p>
                <label className="switch">
                    <input checked={shouldCenterAroundNewUnitUpdates} type="checkbox" onChange={(e) => {
                        setShouldCenterAroundNewUnitUpdates(e?.target?.checked || false);
                    }}></input>
                    <span className="slider round"></span>
                </label>
                <p style={{marginRight: "10px", marginTop: "auto", marginBottom: "auto", fontSize: "1.5rem"}}>Transparency</p>
                <label className="switch">
                    <input checked={enableTransparency} type="checkbox" onChange={(e) => {
                        setEnableTransparency(e?.target?.checked || false);
                    }}></input>
                    <span className="slider round"></span>
                </label>
                <Button variant="primary" onClick={() => {
                    setShow(true);
                }}>
                    Start
                </Button>
                <Button variant="primary" onClick={() => {
                    if (socket) {
                        const unitIds = startData.map((sd) => sd.unitId).join(",");
                        let inputText = window.prompt("Please input unit IDs (ex: '1, 2, 3, 4')", unitIds);
                        const ids = inputText?.trim().split(",") || "no_id";
                        for (const id of ids) {
                            console.log("Sending stop message", id.trim());
                            socket.emit("stop", id.trim());
                        }
                    }
                }}>
                    Stop
                </Button>
                <Button variant="primary" onClick={() => {
                    if (socket) {
                        const unitIds = startData.map((sd) => sd.unitId).join(",");
                        let inputText = window.prompt("Please input unit IDs (ex: '1, 2, 3, 4')", unitIds);
                        const ids = inputText?.trim().split(",") || "no_id";
                        for (const id of ids) {
                            console.log("Sending upload message", id.trim());
                            socket.emit("upload", id.trim());
                        }
                    }
                }}>
                    Upload
                </Button>
            </div>
            <Biometrics units={units} isWireframeMode={isWireframeMode} selectedUnitIdx={selectedUnitIdx}
                        mapTransparency={mapTransparency} setWireFrameMode={setWireFrameMode}
                        setMapTransparency={setMapTransparency} setSelectedUnitIdx={setSelectedUnitIdx}/>
        </div>
    )
}

export default App
