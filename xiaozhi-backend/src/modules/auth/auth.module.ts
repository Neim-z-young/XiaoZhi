import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: 'xiaozhi-super-secret-key-change-in-production',
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  providers: [],
  exports: [JwtModule, PassportModule],
})
export class AuthModule {}
