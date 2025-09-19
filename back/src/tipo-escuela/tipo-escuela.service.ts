import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoEscuela } from '../entities/tipo-escuela.entity';
import {CreateTipoEscuelaDto} from './dto/create-tipo-escuela.dto';
import {UpdateTipoEscuelaDto} from './dto/update-tipo-escuela.dto';

@Injectable()
export class TipoEscuelaService {
  constructor(
    @InjectRepository(TipoEscuela)
    private tipoEscuelaRepository: Repository<TipoEscuela>,
  ) {}

  async findAll(): Promise<TipoEscuela[]> {
    return this.tipoEscuelaRepository.find({
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number): Promise<TipoEscuela> {
    const tipoEscuela = await this.tipoEscuelaRepository.findOne({ where: { id } });

    if (!tipoEscuela) {
      throw new NotFoundException(`TipoEscuela with ID ${id} not found`);
    }

    return tipoEscuela;
  }

  async create(createTipoEscuelaDto: CreateTipoEscuelaDto, userRole: string): Promise<TipoEscuela> {
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only admin users can create school types');
    }
    const newTipoEscuela = this.tipoEscuelaRepository.create(createTipoEscuelaDto);
    return this.tipoEscuelaRepository.save(newTipoEscuela);
  }

  async update(id: number, updateTipoEscuelaDto: UpdateTipoEscuelaDto, userRole: string): Promise<TipoEscuela> {
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only admin users can update school types');
    }
    const tipoEscuela = await this.findOne(id);
    Object.assign(tipoEscuela, updateTipoEscuelaDto);
    return this.tipoEscuelaRepository.save(tipoEscuela);
  }

  async remove(id: number, userRole: string): Promise<void> {
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only admin users can delete school types');
    }
    const tipoEscuela = await this.findOne(id);
    await this.tipoEscuelaRepository.remove(tipoEscuela);
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
          if (!item.nombre) {
            errors.push(`Fila ${item.rowIndex}: Nombre es obligatorio`);
            failed++;
            continue;
          }

          const existingRecord = await this.tipoEscuelaRepository.findOne({
            where: { nombre: item.nombre },
          });

          if (existingRecord) {
            await this.tipoEscuelaRepository.update(existingRecord.id, item);
          } else {
            const newRecord = this.tipoEscuelaRepository.create(item);
            await this.tipoEscuelaRepository.save(newRecord);
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
      if (!item.nombre || item.nombre.length > 100) {
        errors.push(`Fila ${item.rowIndex}: Nombre es obligatorio y no debe exceder 100 caracteres`);
      }
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }
}