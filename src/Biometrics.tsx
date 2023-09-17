import React, {useEffect, useState} from "react";
import {IUnit, UnitColor} from "./IUnit";
import Cesium from "cesium";

interface IBiometricsProps {
    units: Array<IUnit>,
    isWireframeMode: boolean,
    mapTransparency: number,
    setWireFrameMode: Function,
    setMapTransparency: Function
}

function unitColorToRgba(unitColor: UnitColor): string {
    switch (unitColor) {
        case UnitColor.Red:
            return 'rgba(255.0, 0.0, 0.0, 1.0)';
        case UnitColor.Blue:
            return 'rgba(0.0, 0.0, 255.0, 1.0)';
        case UnitColor.Green:
            return 'rgba(0.0, 255.0, 0.0, 1.0)';
        case UnitColor.Purple:
            return 'rgba(165.0, 55.0, 253.0, 1.0)';
        case UnitColor.Orange:
            return 'rgba(241.0, 90.0, 34.0, 1.0)';
        default:
            return 'rgba(255.0, 255.0, 255.0, 1.0)';
    }
}

function Biometrics(props: IBiometricsProps) {
    return (
        <div id="biometrics-panel">
            {
                props?.units.map((unit, idx) => {
                    return (
                        <div key={unit?.id || idx} className={"unit-biometric"}>
                            <div style={{display: "flex", flexDirection: "row", alignContent: "center",
                                alignItems: "center", justifyContent: "start"}}>
                                <div style={{width: "10px", height: "10px", borderRadius: "100%", marginRight: "10px",
                                    backgroundColor: `${unitColorToRgba(unit.color)}`,
                                    background: `${unitColorToRgba(unit.color)}`}}> </div>
                                <h2 style={{marginTop: 10, marginBottom: 5}}>Unit {unit?.id}</h2>
                            </div>
                            <p>Name: {unit?.biometrics?.unitName || "Unknown"}</p>
                            <p>Heart rate: {unit?.biometrics?.heartRate || "Unknown"} BPM</p>
                            <p>Blood O2: {unit?.biometrics?.bloodO2 || "Unknown"}%</p>
                            <p>Body temperature: {unit?.biometrics?.bodyTemp || "Unknown"} °F</p>
                        </div>
                    )
                })
            }
        </div>
    );
}

export default Biometrics;
