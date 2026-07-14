import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(username: string, password: string): Promise<{ token: string; user: any }> {
    // TODO: 实现实际的数据库验证
    // 暂时使用模拟用户
    if (username === 'admin' && password === 'admin123') {
      const payload = { sub: 'user-1', username };
      const token = this.jwtService.sign(payload);
      return {
        token,
        user: { id: 'user-1', username, role: 'admin' },
      };
    }
    
    // 开发环境：任意用户名密码都可登录
    const payload = { sub: 'dev-user', username };
    const token = this.jwtService.sign(payload);
    return {
      token,
      user: { id: 'dev-user', username, role: 'user' },
    };
  }

  async validateToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
