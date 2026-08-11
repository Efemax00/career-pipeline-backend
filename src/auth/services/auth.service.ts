import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '../services/jwt.service';
import * as admin from 'firebase-admin';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async loginWithFirebase(idToken: string) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const user = await this.getOrCreateUser(decodedToken);
      
      const accessToken = this.jwtService.generateToken(
        user.uid,
        user.email,
        user.roles || [],
      );

      return {
        accessToken,
        user: {
          uid: user.uid,
          email: user.email,
          name: user.name,
          picture: user.picture,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }

  async getOrCreateUser(decodedToken: admin.auth.DecodedIdToken) {
    // Here you would check if user exists in your database
    // If not, create them
    // This is a placeholder - we'll implement this when we have User model
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      name: decodedToken.name || '',
      picture: decodedToken.picture || '',
      roles: ['user'],
    };
  }

  async verifyToken(token: string) {
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      return decoded;
    } catch (error) {
      return null;
    }
  }
}
