export interface IBiometrics {
    unitName: string,
    heartRate: number,
    bloodO2: number,
    bodyTemp: number
}

export interface ILatLongAlt {
    latitude: number,
    longitude: number,
    height: number
}

export interface IUnit {
    id: string,
    biometrics?: IBiometrics,
    latLongAlt?: ILatLongAlt
}
