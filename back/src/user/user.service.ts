import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { CreateUserDto} from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'username', 'email', 'role', 'creadoEn'],
      order: { creadoEn: 'DESC' },
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'username', 'email', 'role', 'creadoEn'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }
  
  async findByUsername(username: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) {
        throw new NotFoundException(`User with username '${username}' not found`);
    }
    return user;
  }

 async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
  const existingUser = await this.userRepository.findOne({
    where: [{ username: createUserDto.username }, { email: createUserDto.email }],
  });

  if (existingUser) {
    throw new BadRequestException('Username or email already exists');
  }

  const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
  const newUser = this.userRepository.create({
    ...createUserDto,
    password: hashedPassword,
  });

  const savedUser = await this.userRepository.save(newUser);


  const { password, ...userWithoutPassword } = savedUser;
  return userWithoutPassword;
}


 async update(
  id: number,
  updateUserDto: UpdateUserDto,
  userRole: string
): Promise<Omit<User, 'password'>> {
  if (userRole !== 'admin') {
    throw new ForbiddenException('Only admin users can update users');
  }
  const user = await this.findOne(id);
  Object.assign(user, updateUserDto);
  if (updateUserDto.password) {
    user.password = await bcrypt.hash(updateUserDto.password, 10);
  }
  const updatedUser = await this.userRepository.save(user);

  const { password, ...userWithoutPassword } = updatedUser;
  return userWithoutPassword;
}


  async remove(id: number, userRole: string): Promise<void> {
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only admin users can delete users');
    }
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async bulkInsert(data: any[], userRole: string): Promise<{ imported: number; failed: number; errors: string[] }> {
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only admin users can perform bulk user import');
    }

    const errors: string[] = [];
    let imported = 0;
    let failed = 0;

    const batchSize = 100;
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      for (const item of batch) {
        try {
          if (!item.username || !item.email || !item.password) {
            errors.push(`Fila ${item.rowIndex}: Faltan campos obligatorios (username, email, password)`);
            failed++;
            continue;
          }

          const existingRecord = await this.userRepository.findOne({
            where: [{ username: item.username }, { email: item.email }],
          });

          if (existingRecord) {
            errors.push(`Fila ${item.rowIndex}: Usuario con username o email ya existe`);
            failed++;
            continue;
          }
          
          const hashedPassword = await bcrypt.hash(item.password, 10);
          const newRecord = this.userRepository.create({
            ...item,
            password: hashedPassword,
          });
          await this.userRepository.save(newRecord);
          imported++;
        } catch (error) {
          errors.push(`Fila ${item.rowIndex}: ${error.message}`);
          failed++;
        }
      }
    }
    return { imported, failed, errors };
  }
}