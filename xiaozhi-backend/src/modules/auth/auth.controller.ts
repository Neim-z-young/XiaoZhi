import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  login(@Body() body: { username: string; password: string }) {
    return this.authService.login(body.username, body.password);
  }

  @Post('refresh')
  @ApiOperation({ summary: '刷新 Token' })
  refresh(@Body() body: { refreshToken: string }) {
    // TODO: 实现 Token 刷新
    return { message: 'Not implemented' };
  }

  @Post('logout')
  @ApiOperation({ summary: '退出登录' })
  logout() {
    return { success: true };
  }
}
