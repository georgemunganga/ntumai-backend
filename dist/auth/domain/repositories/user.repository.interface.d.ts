import { UserEntity } from '../entities/user.entity';
export interface IUserRepository {
    findById(id: string): Promise<UserEntity | null>;
    findByEmail(email: string): Promise<UserEntity | null>;
    findByPhone(phone: string): Promise<UserEntity | null>;
    findByIdentifier(identifier: string): Promise<UserEntity | null>;
    create(user: UserEntity): Promise<UserEntity>;
    update(user: UserEntity): Promise<UserEntity>;
    delete(id: string): Promise<void>;
    exists(email?: string, phone?: string): Promise<boolean>;
}
