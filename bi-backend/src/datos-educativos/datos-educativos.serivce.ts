import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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
}