import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { idToken: string }) {
    return this.authService.loginWithFirebase(loginDto.idToken);
  }

  // TEST ENDPOINT - Uses UID from .env
  @Post('test-login')
  async testLogin() {
    return this.authService.loginWithTestUid();
  }

  @Post('verify')
  async verifyToken(@Body() body: { token: string }) {
    const decoded = await this.authService.verifyToken(body.token);
    return { valid: !!decoded, user: decoded };
  }

  @Get('profile')
  @UseGuards(FirebaseAuthGuard)
  async getProfile(@Request() req) {
    return req.user;
  }
}