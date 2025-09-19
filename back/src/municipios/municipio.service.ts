import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Municipio } from '../entities/municipio.entity';
import {CreateMunicipioDto} from './dto/create-municipio.dto';
import {UpdateMunicipioDto} from './dto/update-municipio.dto';


@Injectable()
export class MunicipioService {
  constructor(
    @InjectRepository(Municipio)
    private municipioRepository: Repository<Municipio>,
  ) {}

  async findAll(): Promise<Municipio[]> {
    return this.municipioRepository.find({
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Municipio> {
    const municipio = await this.municipioRepository.findOne({ where: { id } });

    if (!municipio) {
      throw new NotFoundException(`Municipio with ID ${id} not found`);
    }

    return municipio;
  }

  async create(createMunicipioDto: CreateMunicipioDto, userRole: string): Promise<Municipio> {
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only admin users can create municipalities');
    }
    const newMunicipio = this.municipioRepository.create(createMunicipioDto);
    return this.municipioRepository.save(newMunicipio);
  }

  async update(id: number, updateMunicipioDto: UpdateMunicipioDto, userRole: string): Promise<Municipio> {
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only admin users can update municipalities');
    }
    const municipio = await this.findOne(id);
    Object.assign(municipio, updateMunicipioDto);
    return this.municipioRepository.save(municipio);
  }

  async remove(id: number, userRole: string): Promise<void> {
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only admin users can delete municipalities');
    }
    const municipio = await this.findOne(id);
    await this.municipioRepository.remove(municipio);
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

          const existingRecord = await this.municipioRepository.findOne({
            where: { nombre: item.nombre },
          });

          if (existingRecord) {
            await this.municipioRepository.update(existingRecord.id, item);
          } else {
            const newRecord = this.municipioRepository.create(item);
            await this.municipioRepository.save(newRecord);
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