export declare class GeoLocation {
    readonly lat: number;
    readonly lng: number;
    constructor(lat: number, lng: number);
    private validate;
    distanceTo(other: GeoLocation): number;
    private toRad;
    toString(): string;
}
