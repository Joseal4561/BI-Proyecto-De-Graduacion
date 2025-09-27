import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrediccionIA } from 'src/entities/ai.entity';
import { SavePrediccionDto } from './dto/create-prediccion.dto';

@Injectable()
export class PrediccionesIaService {
  constructor(
    @InjectRepository(PrediccionIA)
    private prediccionesRepository: Repository<PrediccionIA>,
  ) {}

  async create(savePrediccionDto: SavePrediccionDto): Promise<PrediccionIA> {
    const prediccion = this.prediccionesRepository.create(savePrediccionDto);
    return this.prediccionesRepository.save(prediccion);
  }

  async findAll(): Promise<PrediccionIA[]> {
    return this.prediccionesRepository.find({
      order: { creadoEn: 'DESC' },
      relations: ['usuario']
    });
  }

  async findOne(id: number): Promise<PrediccionIA> {
    const prediccion = await this.prediccionesRepository.findOne({
      where: { id },
      relations: ['usuario']
    });
    
    if (!prediccion) {
      throw new NotFoundException(`Predicción con ID ${id} no encontrada`);
    }
    
    return prediccion;
  }

  async remove(id: number): Promise<void> {
    const result = await this.prediccionesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Predicción con ID ${id} no encontrada`);
    }
  }
}