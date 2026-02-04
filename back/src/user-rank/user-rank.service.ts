import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRank } from '../entities/user-rank.entity';
import { User } from '../entities/user.entity';
import { Escuela } from '../entities/escuela.entity';
import { Municipio } from '../entities/municipio.entity';
import { CreateUserRankDto } from './dto/create-user-rank.dto';
import { UpdateUserRankDto } from './dto/update-user-rank.dto';

@Injectable()
export class UserRankService {
  constructor(
    @InjectRepository(UserRank)
    private userRankRepository: Repository<UserRank>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Escuela)
    private escuelaRepository: Repository<Escuela>,
    @InjectRepository(Municipio)
    private municipioRepository: Repository<Municipio>,
  ) {}

  async findAll(): Promise<UserRank[]> {
    return this.userRankRepository.find({
      relations: ['user', 'escuela', 'municipio'],
      order: { asignadoEn: 'DESC' },
    });
  }

  async findOne(id: number): Promise<UserRank> {
    const userRank = await this.userRankRepository.findOne({
      where: { id },
      relations: ['user', 'escuela', 'municipio'],
    });

    if (!userRank) {
      throw new NotFoundException(`UserRank with ID ${id} not found`);
    }
    return userRank;
  }

  async findByUserId(userId: number): Promise<UserRank | null> {
    return this.userRankRepository.findOne({
      where: { userId },
      relations: ['user', 'escuela', 'municipio'],
    });
  }

  async create(createUserRankDto: CreateUserRankDto): Promise<UserRank> {
    // Verify user exists
    const user = await this.userRepository.findOne({
      where: { id: createUserRankDto.userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${createUserRankDto.userId} not found`);
    }

    // Check if user already has a rank
    const existingRank = await this.userRankRepository.findOne({
      where: { userId: createUserRankDto.userId },
    });

    if (existingRank) {
      throw new BadRequestException('User already has a rank assigned');
    }

    // Validate rank-specific requirements
    await this.validateRankRequirements(createUserRankDto);

    const newUserRank = this.userRankRepository.create(createUserRankDto);
    return this.userRankRepository.save(newUserRank);
  }

  async update(id: number, updateUserRankDto: UpdateUserRankDto, userRole: string): Promise<UserRank> {
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only admin users can update user ranks');
    }

    const userRank = await this.findOne(id);

    // Validate rank-specific requirements if rank or IDs are being changed
    if (updateUserRankDto.rank || updateUserRankDto.escuelaId !== undefined || updateUserRankDto.municipioId !== undefined) {
      const dtoToValidate = {
        rank: updateUserRankDto.rank || userRank.rank,
        escuelaId: updateUserRankDto.escuelaId !== undefined ? updateUserRankDto.escuelaId : userRank.escuelaId,
        municipioId: updateUserRankDto.municipioId !== undefined ? updateUserRankDto.municipioId : userRank.municipioId,
      };
      await this.validateRankRequirements(dtoToValidate as CreateUserRankDto);
    }

    Object.assign(userRank, updateUserRankDto);
    return this.userRankRepository.save(userRank);
  }

  async remove(id: number, userRole: string): Promise<void> {
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only admin users can delete user ranks');
    }

    const userRank = await this.findOne(id);
    await this.userRankRepository.remove(userRank);
  }

  async bulkInsert(data: any[], userRole: string): Promise<{ imported: number; failed: number; errors: string[] }> {
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only admin users can perform bulk user rank import');
    }

    const errors: string[] = [];
    let imported = 0;
    let failed = 0;

    const batchSize = 100;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      for (const item of batch) {
        try {
          if (!item.userId || !item.rank) {
            errors.push(`Fila ${item.rowIndex}: Faltan campos obligatorios (userId, rank)`);
            failed++;
            continue;
          }

          // Check if user exists
          const user = await this.userRepository.findOne({
            where: { id: item.userId },
          });

          if (!user) {
            errors.push(`Fila ${item.rowIndex}: Usuario con ID ${item.userId} no encontrado`);
            failed++;
            continue;
          }

          // Check if user already has a rank
          const existingRank = await this.userRankRepository.findOne({
            where: { userId: item.userId },
          });

          if (existingRank) {
            errors.push(`Fila ${item.rowIndex}: Usuario ya tiene un rango asignado`);
            failed++;
            continue;
          }

          // Validate rank requirements
          try {
            await this.validateRankRequirements(item);
          } catch (validationError) {
            errors.push(`Fila ${item.rowIndex}: ${validationError.message}`);
            failed++;
            continue;
          }

          const newRecord = this.userRankRepository.create(item);
          await this.userRankRepository.save(newRecord);
          imported++;
        } catch (error) {
          errors.push(`Fila ${item.rowIndex}: ${error.message}`);
          failed++;
        }
      }
    }
    return { imported, failed, errors };
  }

  // ============================================
  // FILTERING METHODS FOR DATA ACCESS CONTROL
  // ============================================

  /**
   * Get the appropriate WHERE condition for filtering data based on user rank
   * @param userId - The ID of the user making the request
   * @returns Object with filtering conditions or null if user is Administrador
   */
  async getDataFilterForUser(userId: number): Promise<{ escuelaId?: number; municipioId?: number } | null> {
    const userRank = await this.findByUserId(userId);

    if (!userRank) {
      throw new ForbiddenException('User does not have a rank assigned');
    }

    switch (userRank.rank) {
      case 'Administrador':
        // Administrador can see all data - no filter needed
        return null;

      case 'Coordinador':
        // Coordinador can only see data from schools in their municipio
        if (!userRank.municipioId) {
          throw new BadRequestException('Coordinador must have a municipio assigned');
        }
        return { municipioId: userRank.municipioId };

      case 'Director':
        // Director can only see data from their specific school
        if (!userRank.escuelaId) {
          throw new BadRequestException('Director must have a escuela assigned');
        }
        return { escuelaId: userRank.escuelaId };

      default:
        throw new BadRequestException('Invalid rank');
    }
  }

  /**
   * Get list of school IDs that a user has access to based on their rank
   * @param userId - The ID of the user making the request
   * @returns Array of school IDs the user can access, or null if Administrador (all schools)
   */
  async getAccessibleSchoolIds(userId: number): Promise<number[] | null> {
    const userRank = await this.findByUserId(userId);

    if (!userRank) {
      throw new ForbiddenException('User does not have a rank assigned');
    }

    switch (userRank.rank) {
      case 'Administrador':
        // Administrador can access all schools
        return null;

      case 'Coordinador':
        // Coordinador can access all schools in their municipio
        if (!userRank.municipioId) {
          throw new BadRequestException('Coordinador must have a municipio assigned');
        }
        const schools = await this.escuelaRepository.find({
          where: { municipioId: userRank.municipioId },
          select: ['id'],
        });
        return schools.map(school => school.id);

      case 'Director':
        // Director can only access their specific school
        if (!userRank.escuelaId) {
          throw new BadRequestException('Director must have a escuela assigned');
        }
        return [userRank.escuelaId];

      default:
        throw new BadRequestException('Invalid rank');
    }
  }

  /**
   * Check if a user has access to a specific school
   * @param userId - The ID of the user making the request
   * @param escuelaId - The ID of the school to check access for
   * @returns true if user has access, false otherwise
   */
  async canAccessSchool(userId: number, escuelaId: number): Promise<boolean> {
    const accessibleSchools = await this.getAccessibleSchoolIds(userId);

    // If null, user is Administrador and can access all schools
    if (accessibleSchools === null) {
      return true;
    }

    return accessibleSchools.includes(escuelaId);
  }

  /**
   * Check if a user has access to a specific municipio
   * @param userId - The ID of the user making the request
   * @param municipioId - The ID of the municipio to check access for
   * @returns true if user has access, false otherwise
   */
  async canAccessMunicipio(userId: number, municipioId: number): Promise<boolean> {
    const userRank = await this.findByUserId(userId);

    if (!userRank) {
      throw new ForbiddenException('User does not have a rank assigned');
    }

    switch (userRank.rank) {
      case 'Administrador':
        return true;

      case 'Coordinador':
        return userRank.municipioId === municipioId;

      case 'Director':
        // Director needs to check if their school is in this municipio
        if (!userRank.escuelaId) {
          return false;
        }
        const school = await this.escuelaRepository.findOne({
          where: { id: userRank.escuelaId },
          select: ['municipioId'],
        });
        return school ? school.municipioId === municipioId : false;

      default:
        return false;
    }
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private async validateRankRequirements(dto: CreateUserRankDto): Promise<void> {
    switch (dto.rank) {
      case 'Director':
        if (!dto.escuelaId) {
          throw new BadRequestException('Director rank requires an escuelaId');
        }
        if (dto.municipioId) {
          throw new BadRequestException('Director rank should not have a municipioId');
        }
        // Verify escuela exists
        const escuela = await this.escuelaRepository.findOne({
          where: { id: dto.escuelaId },
        });
        if (!escuela) {
          throw new NotFoundException(`Escuela with ID ${dto.escuelaId} not found`);
        }
        break;

      case 'Coordinador':
        if (!dto.municipioId) {
          throw new BadRequestException('Coordinador rank requires a municipioId');
        }
        if (dto.escuelaId) {
          throw new BadRequestException('Coordinador rank should not have an escuelaId');
        }
        // Verify municipio exists
        const municipio = await this.municipioRepository.findOne({
          where: { id: dto.municipioId },
        });
        if (!municipio) {
          throw new NotFoundException(`Municipio with ID ${dto.municipioId} not found`);
        }
        break;

      case 'Administrador':
        if (dto.escuelaId || dto.municipioId) {
          throw new BadRequestException('Administrador rank should not have escuelaId or municipioId');
        }
        break;

      default:
        throw new BadRequestException('Invalid rank value');
    }
  }
}