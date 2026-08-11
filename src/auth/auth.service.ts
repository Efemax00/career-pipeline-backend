import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from './services/jwt.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../modules/users/schemas/user.schema';
import { ConfigService } from '@nestjs/config';

const admin = require('firebase-admin');

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async loginWithFirebase(idToken: string) {
    try {
      console.log('🔐 Login attempt with Firebase token');
      
      // Verify the Firebase token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      console.log(`✅ Token verified for user: ${decodedToken.uid}`);
      
      // Get or create user in MongoDB
      const user = await this.getOrCreateUser(decodedToken);
      
      // Generate JWT token for your app
      const accessToken = this.jwtService.generateToken(
        user.uid,
        user.email,
        user.roles || [],
      );

      console.log(`✅ Login successful: ${user.email}`);

      return {
        accessToken,
        user: {
          uid: user.uid,
          email: user.email,
          name: user.name,
          picture: user.picture,
          roles: user.roles,
        },
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Firebase login error:', message);
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }

  // TEST ENDPOINT - Uses UID from .env
  async loginWithTestUid() {
    const testUid = this.configService.get<string>('FIREBASE_TEST_UID');
    
    if (!testUid) {
      throw new UnauthorizedException('FIREBASE_TEST_UID not configured in .env');
    }

    console.log(`🔑 Test login with UID: ${testUid}`);

    // Check if user exists in MongoDB
    let user = await this.userModel.findOne({ uid: testUid });
    
    if (!user) {
      // Create test user if doesn't exist
      user = new this.userModel({
        uid: testUid,
        email: `test-${testUid.substring(0,8)}@example.com`,
        name: 'Test User',
        picture: '',
        roles: ['admin', 'user'],
        isActive: true,
        lastLoginAt: new Date(),
      });
      await user.save();
      console.log(`✅ Test user created with UID: ${testUid}`);
    } else {
      // Update last login
      user.lastLoginAt = new Date();
      await user.save();
      console.log(`✅ Test user found: ${user.email}`);
    }
    
    // Generate JWT token
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
        roles: user.roles,
      },
    };
  }

  async getOrCreateUser(decodedToken: any): Promise<UserDocument> {
    // Check if user exists in MongoDB
    let user = await this.userModel.findOne({ uid: decodedToken.uid });
    
    if (!user) {
      // Create new user with all available data
      const name = decodedToken.name || 
                   decodedToken.displayName || 
                   decodedToken.email?.split('@')[0] || 
                   'User';
      
      user = new this.userModel({
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        name: name,
        picture: decodedToken.picture || decodedToken.photoURL || '',
        roles: ['user'], // Default role for all users
        isActive: true,
        lastLoginAt: new Date(),
      });
      await user.save();
      console.log(`✅ New user created: ${decodedToken.email} (${name})`);
    } else {
      // Update existing user's info if needed
      let needsUpdate = false;
      
      // Update name if empty or changed
      if (!user.name && decodedToken.name) {
        user.name = decodedToken.name;
        needsUpdate = true;
      }
      
      // Update picture if empty or changed
      if (!user.picture && decodedToken.picture) {
        user.picture = decodedToken.picture;
        needsUpdate = true;
      }
      
      // Update last login
      user.lastLoginAt = new Date();
      
      if (needsUpdate) {
        await user.save();
        console.log(`✅ Updated user info: ${decodedToken.email}`);
      } else {
        await user.save();
        console.log(`✅ Existing user found: ${decodedToken.email}`);
      }
    }
    
    return user;
  }

  async verifyToken(token: string) {
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      return decoded;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Token verification failed:', message);
      return null;
    }
  }

  async getUserByUid(uid: string): Promise<UserDocument | null> {
    try {
      return this.userModel.findOne({ uid });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Error finding user:', message);
      return null;
    }
  }

  // ─── Admin Methods ─────────────────────────────────────────────

  async getAllUsers(): Promise<UserDocument[]> {
    return this.userModel.find().sort({ createdAt: -1 }).exec();
  }

  async updateUserRole(uid: string, roles: string[]): Promise<UserDocument | null> {
    const user = await this.userModel.findOne({ uid });
    if (!user) {
      return null;
    }
    user.roles = roles;
    await user.save();
    return user;
  }
}
