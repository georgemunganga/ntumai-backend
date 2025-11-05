import { AddressType } from '@prisma/client';
export interface AddressProps {
    id: string;
    userId: string;
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
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare class AddressEntity {
    private readonly props;
    private constructor();
    static create(props: Omit<AddressProps, 'id' | 'createdAt' | 'updatedAt'>): AddressEntity;
    static fromPersistence(props: AddressProps): AddressEntity;
    get id(): string;
    get userId(): string;
    get type(): AddressType;
    get label(): string | undefined;
    get address(): string;
    get city(): string;
    get state(): string;
    get country(): string;
    get postalCode(): string | undefined;
    get latitude(): number;
    get longitude(): number;
    get instructions(): string | undefined;
    get contactName(): string | undefined;
    get contactPhone(): string | undefined;
    get isDefault(): boolean;
    get createdAt(): Date;
    get updatedAt(): Date;
    setAsDefault(): void;
    unsetDefault(): void;
    update(updates: Partial<Omit<AddressProps, 'id' | 'userId' | 'createdAt'>>): void;
    toPersistence(): AddressProps;
}
