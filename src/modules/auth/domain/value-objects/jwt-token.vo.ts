export class JwtToken {
  constructor(
    readonly accessToken: string,
    readonly refreshToken: string,
    readonly expiresIn: number,
  ) {}

  isExpired(now: Date): boolean {
    return now.getTime() > this.expiresIn;
  }
}
