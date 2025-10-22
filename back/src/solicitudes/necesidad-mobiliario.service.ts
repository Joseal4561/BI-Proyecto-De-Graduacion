import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NecesidadMobiliario } from '../entities/solicitud.entity';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
import { UpdateSolicitudDto } from './dto/update-solicitud.dto';
import { EscuelaService } from '../escuelas/escuelas.service';

@Injectable()
export class NecesidadMobiliarioService {
  constructor(
    @InjectRepository(NecesidadMobiliario)
    private necesidadMobiliarioRepository: Repository<NecesidadMobiliario>,
    private escuelaService: EscuelaService,
  ) {}

  async findAll(): Promise<NecesidadMobiliario[]> {
    return this.necesidadMobiliarioRepository.find({
      relations: ['escuela'],
      order: { fechaReporte: 'DESC' },
    });
  }

  async findOne(id: number): Promise<NecesidadMobiliario> {
    const necesidad = await this.necesidadMobiliarioRepository.findOne({
      where: { idNecesidad: id },
      relations: ['escuela'],
    });

    if (!necesidad) {
      throw new NotFoundException(`Necesidad de mobiliario with ID ${id} not found`);
    }

    return necesidad;
  }

  async findByEscuela(escuelaId: number): Promise<NecesidadMobiliario[]> {
    return this.necesidadMobiliarioRepository.find({
      where: { escuelaId },
      relations: ['escuela'],
      order: { fechaReporte: 'DESC' },
    });
  }

  async create(createNecesidadMobiliarioDto: CreateSolicitudDto, userRole: string): Promise<NecesidadMobiliario> {
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only admin users can create furniture needs');
    }

    const { escuelaId, ...rest } = createNecesidadMobiliarioDto;

    // Validate that the school exists
    await this.escuelaService.findOne(escuelaId);

    const newNecesidad = this.necesidadMobiliarioRepository.create(rest);
    newNecesidad.escuela = { id: escuelaId } as any;

    return this.necesidadMobiliarioRepository.save(newNecesidad);
  }

  async update(id: number, updateNecesidadMobiliarioDto: UpdateSolicitudDto, userRole: string): Promise<NecesidadMobiliario> {
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only admin users can update furniture needs');
    }

    const necesidad = await this.findOne(id);

    // If escuelaId is being updated, validate it exists
    if (updateNecesidadMobiliarioDto.escuelaId) {
      await this.escuelaService.findOne(updateNecesidadMobiliarioDto.escuelaId);
    }

    Object.assign(necesidad, updateNecesidadMobiliarioDto);
    return this.necesidadMobiliarioRepository.save(necesidad);
  }

  async remove(id: number, userRole: string): Promise<void> {
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only admin users can delete furniture needs');
    }

    const necesidad = await this.findOne(id);
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

          // Validate that the school exists
          await this.escuelaService.findOne(item.escuelaId);

          const existingRecord = await this.necesidadMobiliarioRepository.findOne({
            where: {
              escuelaId: item.escuelaId,
              fechaReporte: item.fechaReporte,
            },
          });

          if (existingRecord) {
            await this.necesidadMobiliarioRepository.update(existingRecord.idNecesidad, item);
          } else {
            const newRecord = this.necesidadMobiliarioRepository.create(item);
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
          await this.escuelaService.findOne(item.escuelaId);
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
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}