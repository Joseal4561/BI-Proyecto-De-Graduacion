import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatosEducativos } from '../entities/datos-educativos.entity';
import { CreateDatosEducativosDto, UpdateDatosEducativosDto } from './dto/index';

@Injectable()
export class DatosEducativosService {
  constructor(
    @InjectRepository(DatosEducativos)
    private datosEducativosRepository: Repository<DatosEducativos>,
  ) {}

  async findAll(): Promise<DatosEducativos[]> {
    return this.datosEducativosRepository.find({
      relations: ['escuela'],
      order: { anio: 'DESC', semestre: 'DESC' },
    });
  }

  async findOne(id: number): Promise<DatosEducativos> {
    const datos = await this.datosEducativosRepository.findOne({
      where: { id },
      relations: ['escuela'],
    });
    
    if (!datos) {
      throw new NotFoundException(`DatosEducativos with ID ${id} not found`);
    }
    
    return datos;
  }

  async create(createDatosEducativosDto: CreateDatosEducativosDto, userRole: string): Promise<DatosEducativos> {
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only admin users can create records');
    }

    const datos = this.datosEducativosRepository.create(createDatosEducativosDto);
    return this.datosEducativosRepository.save(datos);
  }

  async update(id: number, updateDatosEducativosDto: UpdateDatosEducativosDto, userRole: string): Promise<DatosEducativos> {
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only admin users can update records');
    }

    const datos = await this.findOne(id);
    Object.assign(datos, updateDatosEducativosDto);
    return this.datosEducativosRepository.save(datos);
  }

  async remove(id: number, userRole: string): Promise<void> {
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only admin users can delete records');
    }

    const datos = await this.findOne(id);
    await this.datosEducativosRepository.remove(datos);
  }

  async findByEscuela(escuelaId: number): Promise<DatosEducativos[]> {
    return this.datosEducativosRepository.find({
      where: { escuelaId },
      relations: ['escuela'],
      order: { anio: 'DESC', semestre: 'DESC' },
    });
  }

  async findByYear(anio: number): Promise<DatosEducativos[]> {
    return this.datosEducativosRepository.find({
      where: { anio },
      relations: ['escuela'],
      order: { semestre: 'DESC' },
    });
  }
   async bulkInsert(data: any[]): Promise<{ imported: number; failed: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;
    let failed = 0;

    // Process data in batches to avoid overwhelming the database
    const batchSize = 100;
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      for (const item of batch) {
        try {
          // Validate required fields
          if (!item.escuelaId || !item.anio || !item.semestre) {
            errors.push(`Fila ${item.rowIndex}: Faltan campos obligatorios (escuela, año, semestre)`);
            failed++;
            continue;
          }

          // Check for existing record (based on unique constraint)
          const existingRecord = await this.datosEducativosRepository.findOne({
            where: {
              escuelaId: item.escuelaId,
              anio: item.anio,
              semestre: item.semestre,
            },
          });

          if (existingRecord) {
            // Update existing record
            await this.datosEducativosRepository.update(existingRecord.id, {
              cantidadAlumnos: item.cantidadAlumnos,
              numeroInscripciones: item.numeroInscripciones,
              tasaDesercion: item.tasaDesercion,
              tasaPromocion: item.tasaPromocion,
              numeroMaestros: item.numeroMaestros,
              promedioCalificaciones: item.promedioCalificaciones,
              esUrbana: item.esUrbana,
            });
          } else {
            // Create new record
            const newRecord = this.datosEducativosRepository.create({
              escuelaId: item.escuelaId,
              anio: item.anio,
              semestre: item.semestre,
              cantidadAlumnos: item.cantidadAlumnos,
              numeroInscripciones: item.numeroInscripciones,
              tasaDesercion: item.tasaDesercion,
              tasaPromocion: item.tasaPromocion,
              numeroMaestros: item.numeroMaestros,
              promedioCalificaciones: item.promedioCalificaciones,
              esUrbana: item.esUrbana,
            });

            await this.datosEducativosRepository.save(newRecord);
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
      // Validate escuela exists
      if (!item.escuelaId) {
        errors.push(`Fila ${item.rowIndex}: Escuela no encontrada`);
      }

      // Validate year range
      if (!item.anio || item.anio < 2000 || item.anio > 2100) {
        errors.push(`Fila ${item.rowIndex}: Año debe estar entre 2000 y 2100`);
      }

      // Validate semester
      if (!['1', '2'].includes(String(item.semestre))) {
        errors.push(`Fila ${item.rowIndex}: Semestre debe ser 1 o 2`);
      }

      // Validate numeric fields
      if (item.cantidadAlumnos < 0) {
        errors.push(`Fila ${item.rowIndex}: Cantidad de alumnos no puede ser negativa`);
      }

      if (item.numeroInscripciones < 0) {
        errors.push(`Fila ${item.rowIndex}: Número de inscripciones no puede ser negativo`);
      }

      if (item.tasaDesercion < 0 || item.tasaDesercion > 100) {
        errors.push(`Fila ${item.rowIndex}: Tasa de deserción debe estar entre 0 y 100`);
      }

      if (item.tasaPromocion && (item.tasaPromocion < 0 || item.tasaPromocion > 100)) {
        errors.push(`Fila ${item.rowIndex}: Tasa de promoción debe estar entre 0 y 100`);
      }

      if (item.promedioCalificaciones && (item.promedioCalificaciones < 0 || item.promedioCalificaciones > 100)) {
        errors.push(`Fila ${item.rowIndex}: Promedio de calificaciones debe estar entre 0 y 100`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}



 
