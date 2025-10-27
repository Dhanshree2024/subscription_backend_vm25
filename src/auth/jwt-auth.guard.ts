import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, HttpStatus, HttpException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { UserRepository } from 'src/user/user.repository';
import { parse } from 'cookie';
import { compactDecrypt, SignJWT, CompactEncrypt } from 'jose'; // Correctly importing from jose
import * as bcrypt from 'bcrypt';  // Ensure bcrypt is imported
import { exit } from 'process';
import { decrypt, encrypt } from 'src/common/encryption_decryption/crypto-utils';
import { Session } from 'src/organizational-profile/public_schema_entity/sessions.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/user.entity';
import { RegisterUserLogin } from 'src/organization_register/entities/register-user-login.entity';
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,

    @InjectRepository(UserRepository) private userRepository: UserRepository,

    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,

    @InjectRepository(RegisterUserLogin)
    private readonly registerUserLogin: Repository<RegisterUserLogin>,

  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {

    const request = context.switchToHttp().getRequest();
    const response: Response = context.switchToHttp().getResponse();

    console.log('s');
    const cookies = parse(request.headers.cookie || '');

    console.log("cookies",cookies)
    const accessToken = cookies.jwtToken;
    const refreshToken = cookies.jwt_refresh_token;
    const accessSecret = Buffer.from(process.env.JWT_ACCESS_SECRET_KEY.padEnd(32, '0'));
    const x_user_id = cookies.system_user_id;
    const sessionId = cookies.session_id;
    console.log("sessionId",sessionId)

    if (!sessionId) throw new UnauthorizedException('Session ID missing');

    if (!x_user_id) {
      throw new UnauthorizedException('User ID cookie is missing.');
    }

    const decryptedUserId = decrypt(x_user_id.toString());
    const numericUserId = Number(decryptedUserId);
    console.log("numericUserId", numericUserId)

    if (isNaN(numericUserId)) {
      throw new UnauthorizedException('Invalid user ID');
    }

    const session = await this.sessionRepository.findOne({ where: { session_id: sessionId, user_id: numericUserId } });

    if (!session || !session.is_active || session.is_blocked) {
      throw new UnauthorizedException('Session is inactive or blocked.');
    }

    console.log('session', session);

    // 4. Check user status
    const user = await this.registerUserLogin.findOne({
      where: { user_id: numericUserId }
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('User is inactive.');
    }

    // exit();
    if (!accessToken) {
      throw new UnauthorizedException('Access token not found. Please log in.');
    }

    const maxInactiveMinutes = 30;
    if (new Date().getTime() - new Date(session.last_seen).getTime() > maxInactiveMinutes * 60000) {
      console.log(`User ${session.user_id} inactive for > ${maxInactiveMinutes} mins.`);
      // DO NOT delete session
    }

    // Update last_active timestamp
    await this.sessionRepository.update(sessionId, { last_seen: new Date() });

    try {
      const decoded = await this.jwtService.verify(accessToken, { secret: accessSecret });
      request.user = decoded;
      return true;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        if (!refreshToken) {
          throw new UnauthorizedException('Refresh token is missing. Please log in again.');
        }

        try {
          const user = await this.userRepository.findOne({
            where: { user_id: numericUserId, verified: true },
            relations: ['organization'], // Load the associated organization data
          });

          if (!user) {
            throw new UnauthorizedException('Invalid refresh token. Please log in again.');
          }

          console.log(refreshToken);
          console.log(user.refreshToken);

          const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
          console.log(isMatch);
          if (!isMatch) {
            throw new UnauthorizedException('Invalid refresh token. Please log in again.');
          }
          const tokens = await this.generateTokens(user);

          response.clearCookie('jwtToken', {
            httpOnly: true,
            // secure: true, sameSite: 'none'
          });
          response.clearCookie('jwt_refresh_token', {
            httpOnly: true,
            //  secure: true, sameSite: 'none'
          });

          response.cookie('jwtToken', tokens.accessToken, {
            httpOnly: true,
            // secure: true, sameSite: 'none' 
          });
          response.cookie('jwt_refresh_token', tokens.refreshToken, {
            httpOnly: true,
            //  secure: true, sameSite: 'none' 
          });

          const newDecoded = this.jwtService.verify(tokens.accessToken, { secret: accessSecret });
          request.user = newDecoded;

          await this.sessionRepository.update(sessionId, { last_seen: new Date() });

          return true;
        } catch (refreshError) {
          console.log(refreshError);
          throw new UnauthorizedException('Invalid refresh token. Please log in again.');
        }
      } else {
        throw new UnauthorizedException('Invalid access token. Please log in again.');
      }
    }
  }


  async generateTokens(user: any): Promise<{ accessToken: string; refreshToken: string }> {

    console.log('in the generated token funtion');
    console.log(user);
    const JWT_ACCESS_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION;
    const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION;

    const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET_KEY;
    const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET_KEY;

    const accessSecret = Buffer.from(ACCESS_SECRET.padEnd(32, '0'));
    const refreshSecret = Buffer.from(REFRESH_SECRET.padEnd(32, '0'));

    const payload = {
      userId: user.user_id,
      organizationSchema: user.organization.organization_schema_name,
    };

    const encryptPayload = async (payload: object, secret: Buffer): Promise<string> => {
      const encodedPayload = new TextEncoder().encode(JSON.stringify(payload));
      return await new CompactEncrypt(encodedPayload)
        .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
        .encrypt(secret);
    };

    const encryptedPayload = await encryptPayload(payload, accessSecret);

    const accessToken = await new SignJWT({ data: encryptedPayload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(JWT_ACCESS_EXPIRATION)
      .sign(accessSecret);

    const refreshToken = await new SignJWT({ data: encryptedPayload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(JWT_REFRESH_EXPIRATION)
      .sign(refreshSecret);

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userRepository.update(user.user_id, { refreshToken: hashedRefreshToken });

    return { accessToken, refreshToken };
  }
}

