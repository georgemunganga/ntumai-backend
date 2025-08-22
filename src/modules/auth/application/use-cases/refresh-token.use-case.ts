export interface RefreshTokenCommand {
  refreshToken: string;
}

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
}

export abstract class RefreshTokenUseCase {
  abstract execute(command: RefreshTokenCommand): Promise<RefreshTokenResult>;
}