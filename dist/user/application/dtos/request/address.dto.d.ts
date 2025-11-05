import { AddressType } from '@prisma/client';
export declare class CreateAddressDto {
    type: AddressType;
    label?: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode?: string;
    latitude: number;
    longitude: number;
    instructions?: string;
    contactName?: string;
    contactPhone?: string;
    isDefault?: boolean;
}
export declare class UpdateAddressDto {
    type?: AddressType;
    label?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
    instructions?: string;
    contactName?: string;
    contactPhone?: string;
    isDefault?: boolean;
}
