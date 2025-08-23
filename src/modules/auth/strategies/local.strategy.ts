import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthenticationDomainService } from '../domain/services';
import { UserRepository } from '../domain/repositories';
import { Email, Password } from '../domain/value-objects';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authDomainService: AuthenticationDomainService,
    private readonly userRepository: UserRepository,
  ) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    try {
      const emailVO = Email.create(email);
      const passwordVO = await Password.create(password);
      
      const user = await this.userRepository.findByEmail(emailVO);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const authenticatedUser = await this.authDomainService.authenticateUser(user, password);

      return {
        id: authenticatedUser.id,
        email: authenticatedUser.email.value,
        firstName: authenticatedUser.getFirstName(),
        lastName: authenticatedUser.getLastName(),
        role: authenticatedUser.currentRole.value,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }
}