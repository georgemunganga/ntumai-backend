import { AddressEntity } from '../entities/address.entity';
export interface IAddressRepository {
    findById(id: string): Promise<AddressEntity | null>;
    findByUserId(userId: string): Promise<AddressEntity[]>;
    findDefaultByUserId(userId: string): Promise<AddressEntity | null>;
    create(address: AddressEntity): Promise<AddressEntity>;
    update(address: AddressEntity): Promise<AddressEntity>;
    delete(id: string): Promise<void>;
    unsetDefaultForUser(userId: string): Promise<void>;
    setAsDefault(id: string, userId: string): Promise<void>;
}
