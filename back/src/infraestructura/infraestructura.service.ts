import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InfraestructuraEscolar } from '../entities/infraestructura.entity';
import { CreateInfraestructuraEscolarDto } from './dto/CreateInfraestructura.dto';
import { UpdateInfraestructuraEscolarDto } from './dto/UpdateInfraestructura.dto';
import { EscuelaService } from '../escuelas/escuelas.service';
import { NecesidadMobiliarioService } from '../solicitudes/necesidad-mobiliario.service';
import { UserRankService } from '../user-rank/user-rank.service';

@Injectable()
export class InfraestructuraEscolarService {
  constructor(
    @InjectRepository(InfraestructuraEscolar)
    private infraestructuraRepository: Repository<InfraestructuraEscolar>,
    private escuelaService: EscuelaService,
    private necesidadMobiliarioService: NecesidadMobiliarioService,
    private userRankService: UserRankService,
  ) {}

  async findAll(userId: number): Promise<InfraestructuraEscolar[]> {
    // Get rank-based filter: { escuelaId: X } or { municipioId: Y } or null
    const filter = await this.userRankService.getDataFilterForUser(userId);
    
    // Build where condition - if filter exists, restrict to user's accessible schools/municipios
    let whereCondition = {};
    if (filter) {
      if (filter.escuelaId) {
        whereCondition = { escuelaId: filter.escuelaId };
      } else if (filter.municipioId) {
        // For municipio filter, we need to query schools in that municipio
        // This is handled via the escuela relation
        whereCondition = { escuela: { municipio: { id: filter.municipioId } } };
      }
    }

    return this.infraestructuraRepository.find({
      where: whereCondition,
      relations: ['escuela', 'necesidadMobiliario'],
      order: { idInfraestructura: 'DESC' },
    });
  }

  async findOne(id: number, userId: number): Promise<InfraestructuraEscolar> {
    const filter = await this.userRankService.getDataFilterForUser(userId);
    
    // If user is a Director, they can ONLY fetch infraestructura for their specific school
    if (filter?.escuelaId) {
      const infraestructura = await this.infraestructuraRepository.findOne({
        where: { idInfraestructura: id, escuelaId: filter.escuelaId },
        relations: ['escuela', 'necesidadMobiliario'],
      });

      if (!infraestructura) {
        throw new NotFoundException(`Infraestructura escolar with ID ${id} not found or access denied`);
      }

      return infraestructura;
    }

    // For Coordinador or Administrador, fetch and validate via escuela rank check
    const infraestructura = await this.infraestructuraRepository.findOne({
      where: { idInfraestructura: id },
      relations: ['escuela', 'necesidadMobiliario'],
    });

    if (!infraestructura) {
      throw new NotFoundException(`Infraestructura escolar with ID ${id} not found`);
    }

    // Validate access to the related school
    if (filter?.municipioId) {
      if (infraestructura.escuela.municipioId !== filter.municipioId) {
        throw new ForbiddenException('No tiene permiso para acceder a esta infraestructura');
      }
    }

    return infraestructura;
  }

  async findByEscuela(escuelaId: number, userId: number): Promise<InfraestructuraEscolar[]> {
    // Validate user has access to this school
    await this.escuelaService.findOne(escuelaId, userId);

    return this.infraestructuraRepository.find({
      where: { escuelaId },
      relations: ['escuela', 'necesidadMobiliario'],
      order: { idInfraestructura: 'DESC' },
    });
  }

  async create(createInfraestructuraDto: CreateInfraestructuraEscolarDto, userRole: string, userId: number): Promise<InfraestructuraEscolar> {
    if (!['admin', 'user'].includes(userRole)) {
      throw new ForbiddenException('Only admin and user roles can create school infrastructure records');
    }

    const { escuelaId, idSolicitud, ...rest } = createInfraestructuraDto;

    // Validate user has access to this school (enforces rank-based restrictions)
    await this.escuelaService.findOne(escuelaId, userId);

    // Validate that the necesidad mobiliario exists if provided
    if (idSolicitud) {
      await this.necesidadMobiliarioService.findOne(idSolicitud, userId);
    }

    const newInfraestructura = this.infraestructuraRepository.create(rest);
    newInfraestructura.escuela = { id: escuelaId } as any;
    
    if (idSolicitud) {
      newInfraestructura.necesidadMobiliario = { idNecesidad: idSolicitud } as any;
    }

    return this.infraestructuraRepository.save(newInfraestructura);
  }

  async update(id: number, updateInfraestructuraDto: UpdateInfraestructuraEscolarDto, userRole: string, userId: number): Promise<InfraestructuraEscolar> {
    if (!['admin', 'user'].includes(userRole)) {
      throw new ForbiddenException('Only admin and user roles can update school infrastructure records');
    }

    const infraestructura = await this.findOne(id, userId);

    // If escuelaId is being updated, validate user has access to the new school
    if (updateInfraestructuraDto.escuelaId) {
      await this.escuelaService.findOne(updateInfraestructuraDto.escuelaId, userId);
    }

    // If idSolicitud is being updated, validate it exists and user can access it
    if (updateInfraestructuraDto.idSolicitud) {
      await this.necesidadMobiliarioService.findOne(updateInfraestructuraDto.idSolicitud, userId);
    }

    Object.assign(infraestructura, updateInfraestructuraDto);
    return this.infraestructuraRepository.save(infraestructura);
  }

  async remove(id: number, userRole: string, userId: number): Promise<void> {
    if (!['admin', 'user'].includes(userRole)) {
      throw new ForbiddenException('Only admin and user roles can delete school infrastructure records');
    }

    const infraestructura = await this.findOne(id, userId);
    await this.infraestructuraRepository.remove(infraestructura);
  }

  async bulkInsert(data: any[]): Promise<{ imported: number; failed: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;
    let failed = 0;

    const batchSize = 50; // Smaller batch size due to large record size
    
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

          // Validate necesidad mobiliario if provided
          if (item.idSolicitud) {
            try {
              await this.necesidadMobiliarioService.findOne(item.idSolicitud, 1);
            } catch (error) {
              errors.push(`Fila ${item.rowIndex}: Solicitud de mobiliario no encontrada (ID: ${item.idSolicitud})`);
              failed++;
              continue;
            }
          }

          // Check if record exists for this school
          const existingRecord = await this.infraestructuraRepository.findOne({
            where: { escuelaId: item.escuelaId },
          });

          if (existingRecord) {
            await this.infraestructuraRepository.update(existingRecord.idInfraestructura, item);
          } else {
            const newRecord = this.infraestructuraRepository.create(item);
            await this.infraestructuraRepository.save(newRecord);
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
      // Validate escuelaId
      try {
        if (item.escuelaId) {
          await this.escuelaService.findOne(item.escuelaId, 1);
        } else {
          errors.push(`Fila ${item.rowIndex}: escuelaId es obligatorio`);
        }
      } catch (error) {
        errors.push(`Fila ${item.rowIndex}: ${error.message}`);
      }

      // Validate numeric fields are valid numbers
      const numericFields = [
        'totalAulasFormales', 'sanitariosLavables', 'sanitariosLetrinas',
        'hueAMunKmAsfalto', 'hueAMunKmTerraceria', 'munAComKmAsfalto',
        'munAComKmTerraceria', 'comACenKmAsfalto', 'munACenKmTerraceria',
        'munACenKmVereda', 'noEscritorios', 'noMesasHexagonales',
        'noPizarras', 'noCatedras'
      ];
      
      numericFields.forEach(field => {
        if (item[field] !== undefined && item[field] !== null && isNaN(item[field])) {
          errors.push(`Fila ${item.rowIndex}: ${field} debe ser un número válido`);
        }
      });

      // Validate enum fields
      if (item.modalidad && !['Monolingüe', 'Bilingüe'].includes(item.modalidad)) {
        errors.push(`Fila ${item.rowIndex}: modalidad debe ser 'Monolingüe' o 'Bilingüe'`);
      }

      if (item.area && !['Urbana', 'Rural'].includes(item.area)) {
        errors.push(`Fila ${item.rowIndex}: area debe ser 'Urbana' o 'Rural'`);
      }

      if (item.condicionEdificio && !['Bueno', 'Malo'].includes(item.condicionEdificio)) {
        errors.push(`Fila ${item.rowIndex}: condicionEdificio debe ser 'Bueno' o 'Malo'`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}