export class OnboardingToken {
  constructor(
    readonly token: string,
    readonly userId: string,
    readonly expiresAt: number,
  ) {}

  isExpired(): boolean {
    return Date.now() >= this.expiresAt;
  }

  static generate(
    userId: string,
    expiresInMinutes: number = 30,
  ): OnboardingToken {
    const token = `onboard_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
    return new OnboardingToken(token, userId, expiresAt);
  }
}
