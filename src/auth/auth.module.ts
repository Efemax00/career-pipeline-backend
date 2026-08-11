import { Module, Global, OnModuleInit } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from './services/jwt.service';
import { FirebaseAuthStrategy } from './strategies/firebase-auth.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User, UserSchema } from '../modules/users/schemas/user.schema';
import { initializeFirebase } from '../config/firebase.config';
import { MongooseModule } from '@nestjs/mongoose';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('jwt.secret') || 'default-secret-change-me';
        const expiresIn = configService.get<string>('jwt.expiresIn') || '7d';
        
        return {
          secret: secret,
          signOptions: {
            expiresIn: expiresIn as any, // Type assertion to fix compatibility
          },
        };
      },
      inject: [ConfigService],
    }),
    // Register User schema directly in AuthModule
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtService,
    FirebaseAuthStrategy,
    JwtStrategy,
  ],
  exports: [AuthService, JwtService],
})
export class AuthModule implements OnModuleInit {
  onModuleInit() {
    initializeFirebase();
  }
}