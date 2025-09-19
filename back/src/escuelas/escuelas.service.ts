import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Escuela } from '../entities/escuela.entity';
import { CreateEscuelaDto } from './dto/create-escuela.dto';
import { UpdateEscuelaDto } from './dto/update-escuela.dto';
import { MunicipioService } from '../municipios/municipio.service';
import { TipoEscuelaService } from '../tipo-escuela/tipo-escuela.service';

@Injectable()
export class EscuelaService {
  constructor(
    @InjectRepository(Escuela)
    private escuelaRepository: Repository<Escuela>,
    private municipioService: MunicipioService,
    private tipoEscuelaService: TipoEscuelaService,
  ) {}

  async findAll(): Promise<Escuela[]> {
    return this.escuelaRepository.find({
      relations: ['municipio', 'tipo'],
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Escuela> {
    const escuela = await this.escuelaRepository.findOne({
      where: { id },
      relations: ['municipio', 'tipo'],
    });

    if (!escuela) {
      throw new NotFoundException(`Escuela with ID ${id} not found`);
    }

    return escuela;
  }

  async create(createEscuelaDto: CreateEscuelaDto, userRole: string): Promise<Escuela> {
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only admin users can create schools');
    }
        const { municipioId, tipoId, ...rest } = createEscuelaDto;

    const newEscuela = this.escuelaRepository.create(rest);
    

    newEscuela.municipio = { id: municipioId } as any;
    newEscuela.tipo = { id: tipoId } as any;

    return this.escuelaRepository.save(newEscuela);
  }

  async update(id: number, updateEscuelaDto: UpdateEscuelaDto, userRole: string): Promise<Escuela> {
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only admin users can update schools');
    }
    const escuela = await this.findOne(id);
    Object.assign(escuela, updateEscuelaDto);
    return this.escuelaRepository.save(escuela);
  }

  async remove(id: number, userRole: string): Promise<void> {
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only admin users can delete schools');
    }
    const escuela = await this.findOne(id);
    await this.escuelaRepository.remove(escuela);
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
          if (!item.nombre || !item.municipioId || !item.tipoId) {
            errors.push(`Fila ${item.rowIndex}: Faltan campos obligatorios (nombre, municipioId, tipoId)`);
            failed++;
            continue;
          }

          const existingRecord = await this.escuelaRepository.findOne({
            where: {
              nombre: item.nombre,
              municipio: { id: item.municipioId },
              tipo: { id: item.tipoId }
            },
          });

          if (existingRecord) {
            await this.escuelaRepository.update(existingRecord.id, item);
          } else {
            const newRecord = this.escuelaRepository.create(item);
            await this.escuelaRepository.save(newRecord);
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
      if (!item.nombre || item.nombre.length > 255) {
        errors.push(`Fila ${item.rowIndex}: Nombre es obligatorio y no debe exceder 255 caracteres`);
      }

      if (item.direccion && item.direccion.length > 255) {
        errors.push(`Fila ${item.rowIndex}: Dirección no debe exceder 255 caracteres`);
      }
      
      try {
        if (item.municipioId) {
          await this.municipioService.findOne(item.municipioId);
        } else {
          errors.push(`Fila ${item.rowIndex}: municipioId es obligatorio`);
        }
      } catch (error) {
        errors.push(`Fila ${item.rowIndex}: ${error.message}`);
      }
      
      try {
        if (item.tipoId) {
          await this.tipoEscuelaService.findOne(item.tipoId);
        } else {
          errors.push(`Fila ${item.rowIndex}: tipoId es obligatorio`);
        }
      } catch (error) {
        errors.push(`Fila ${item.rowIndex}: ${error.message}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}