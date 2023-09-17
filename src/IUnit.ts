export enum UnitColor {
    Red = 1,
    Green,
    Blue,
    Purple,
    Orange,
    Default
}

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
    color: UnitColor,
    biometrics?: IBiometrics,
    latLongAlt?: ILatLongAlt,
    unitModelHandle?: any,
    unitBoxHandle?: any,
    unitLabelHandle?: any
}
