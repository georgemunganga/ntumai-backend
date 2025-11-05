export declare class UpdateProfileDto {
    firstName?: string;
    lastName?: string;
    timezone?: string;
    avatarUrl?: string;
}
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
export declare class UploadProfileImageDto {
    imageUrl?: string;
}
