import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NecesidadMobiliario } from '../entities/solicitud.entity';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
import { UpdateSolicitudDto } from './dto/update-solicitud.dto';
import { EscuelaService } from '../escuelas/escuelas.service';
import { UserRankService } from '../user-rank/user-rank.service';

@Injectable()
export class NecesidadMobiliarioService {
  constructor(
    @InjectRepository(NecesidadMobiliario)
    private necesidadMobiliarioRepository: Repository<NecesidadMobiliario>,
    private escuelaService: EscuelaService,
    private userRankService: UserRankService,
  ) {}

  async findAll(userId: number): Promise<NecesidadMobiliario[]> {
    // Get rank-based filter: { escuelaId: X } or { municipioId: Y } or null
    const filter = await this.userRankService.getDataFilterForUser(userId);

    let whereCondition = {};
    if (filter) {
      if (filter.escuelaId) {
        whereCondition = { escuelaId: filter.escuelaId };
      } else if (filter.municipioId) {
        whereCondition = { escuela: { municipio: { id: filter.municipioId } } };
      }
    }

    return this.necesidadMobiliarioRepository.find({
      where: whereCondition,
      relations: ['escuela'],
      order: { fechaReporte: 'DESC' },
    });
  }

  async findOne(id: number, userId: number): Promise<NecesidadMobiliario> {
    const filter = await this.userRankService.getDataFilterForUser(userId);

    // If user is a Director, they can ONLY fetch necesidades for their specific school
    if (filter?.escuelaId) {
      const necesidad = await this.necesidadMobiliarioRepository.findOne({
        where: { idNecesidad: id, escuelaId: filter.escuelaId },
        relations: ['escuela'],
      });

      if (!necesidad) {
        throw new NotFoundException(`Necesidad de mobiliario with ID ${id} not found or access denied`);
      }

      return necesidad;
    }

    // For Coordinador or Administrador, fetch and validate via escuela rank check
    const necesidad = await this.necesidadMobiliarioRepository.findOne({
      where: { idNecesidad: id },
      relations: ['escuela'],
    });

    if (!necesidad) {
      throw new NotFoundException(`Necesidad de mobiliario with ID ${id} not found`);
    }

    // Validate access to the related school
    if (filter?.municipioId) {
      if (necesidad.escuela.municipioId !== filter.municipioId) {
        throw new ForbiddenException('No tiene permiso para acceder a esta necesidad');
      }
    }

    return necesidad;
  }

  async findByEscuela(escuelaId: number, userId: number): Promise<NecesidadMobiliario[]> {
    // Validate user has access to this school
    await this.escuelaService.findOne(escuelaId, userId);

    return this.necesidadMobiliarioRepository.find({
      where: { escuelaId },
      relations: ['escuela'],
      order: { fechaReporte: 'DESC' },
    });
  }

  async create(createNecesidadMobiliarioDto: CreateSolicitudDto, userRole: string, userId: number): Promise<NecesidadMobiliario> {
    if (!['admin', 'user'].includes(userRole)) {
      throw new ForbiddenException('Only admin and user roles can create furniture needs');
    }

    const { escuelaId, ...rest } = createNecesidadMobiliarioDto;

    // Validate user has access to this school
    await this.escuelaService.findOne(escuelaId, userId);

    const newNecesidad = this.necesidadMobiliarioRepository.create({
      ...rest,
      estado: rest.estado || 'pendiente', // Default to 'pendiente' if not provided
    });
    newNecesidad.escuela = { id: escuelaId } as any;

    return this.necesidadMobiliarioRepository.save(newNecesidad);
  }

  async update(id: number, updateNecesidadMobiliarioDto: UpdateSolicitudDto, userRole: string, userId: number): Promise<NecesidadMobiliario> {
    if (!['admin', 'user'].includes(userRole)) {
      throw new ForbiddenException('Only admin and user roles can update furniture needs');
    }

    const necesidad = await this.findOne(id, userId);

    // If escuelaId is being updated, validate user has access to the new school
    if (updateNecesidadMobiliarioDto.escuelaId) {
      await this.escuelaService.findOne(updateNecesidadMobiliarioDto.escuelaId, userId);
    }

    Object.assign(necesidad, updateNecesidadMobiliarioDto);
    return this.necesidadMobiliarioRepository.save(necesidad);
  }

  async remove(id: number, userRole: string, userId: number): Promise<void> {
    if (!['admin', 'user'].includes(userRole)) {
      throw new ForbiddenException('Only admin and user roles can delete furniture needs');
    }

    const necesidad = await this.findOne(id, userId);
    await this.necesidadMobiliarioRepository.remove(necesidad);
  }

  async bulkInsert(data: any[]): Promise<{ imported: number; failed: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;
    let failed = 0;

    const batchSize = 100;
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      for (const item of batch) {
        try {
          if (!item.escuelaId) {
            errors.push(`Fila ${item.rowIndex}: Falta campo obligatorio (escuelaId)`);
            failed++;
            continue;
          }

          // Validate that the school exists (use userId 1 as bulk insert is admin-only)
          await this.escuelaService.findOne(item.escuelaId, 1);

          const existingRecord = await this.necesidadMobiliarioRepository.findOne({
            where: {
              escuelaId: item.escuelaId,
              fechaReporte: item.fechaReporte,
            },
          });

          // Ensure estado defaults to 'pendiente' if not provided
          const recordData = {
            ...item,
            estado: item.estado || 'pendiente',
          };

          if (existingRecord) {
            await this.necesidadMobiliarioRepository.update(existingRecord.idNecesidad, recordData);
          } else {
            const newRecord = this.necesidadMobiliarioRepository.create(recordData);
            await this.necesidadMobiliarioRepository.save(newRecord);
          }

          imported++;
        } catch (error) {
          errors.push(`Fila ${item.rowIndex}: ${error.message}`);
          failed++;
        }
      }
    }

    return { imported, failed, errors };
  }

  async validateBulkData(data: any[]): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    for (const item of data) {
      try {
        if (item.escuelaId) {
          await this.escuelaService.findOne(item.escuelaId, 1);
        } else {
          errors.push(`Fila ${item.rowIndex}: escuelaId es obligatorio`);
        }
      } catch (error) {
        errors.push(`Fila ${item.rowIndex}: ${error.message}`);
      }

      // Validate numeric fields
      const numericFields = ['necesidadEscritorios', 'necesidadMesasHexagonales', 'necesidadPizarras', 'necesidadCatedras'];
      for (const field of numericFields) {
        if (item[field] !== undefined && (isNaN(item[field]) || item[field] < 0)) {
          errors.push(`Fila ${item.rowIndex}: ${field} debe ser un número válido mayor o igual a 0`);
        }
      }

      // Validate estado field
      const validEstados = ['pendiente', 'en revision', 'aprobada', 'desaprobada', 'en proceso', 'completada'];
      if (item.estado && !validEstados.includes(item.estado)) {
        errors.push(`Fila ${item.rowIndex}: estado debe ser uno de: ${validEstados.join(', ')}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}