/*import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { username } });
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  async register(username: string, email: string, password: string, role: 'admin' | 'user' = 'user') {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
      role,
    });
    
    try {
      await this.userRepository.save(user);
      const { password: _, ...result } = user;
      return result;
    } catch (error) {
      throw new UnauthorizedException('Username or email already exists');
    }
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
}
}
*/

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { username } });
    
 
    console.log('Login attempt:', { username, password });
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (user) {
      console.log('Stored password:', user.password);
  
      if (user.password === password) {
        const { password, ...result } = user;
        return result;
      }
    }
    
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  async register(username: string, password: string, role: 'admin' | 'user' = 'user') {
     const user = this.userRepository.create({
      username,
      password,
      role,
    });
    
    try {
      await this.userRepository.save(user);
      const { password: _, ...result } = user;
      return result;
    } catch (error) {
      throw new UnauthorizedException('Username or email already exists');
    }
  }

  async findById(id: number): Promise<User|null > {
    return this.userRepository.findOne({ where: { id } });
  }
}
