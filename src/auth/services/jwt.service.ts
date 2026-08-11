import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';

@Injectable()
export class JwtService {
  constructor(private jwtService: NestJwtService) {}

  generateToken(userId: string, email: string, roles: string[] = []) {
    const payload = {
      sub: userId,
      email,
      roles,
    };
    return this.jwtService.sign(payload);
  }

  verifyToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      return null;
    }
  }

  decodeToken(token: string) {
    return this.jwtService.decode(token);
  }
}