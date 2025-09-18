import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Escuela } from '../entities/escuela.entity';

@Injectable()
export class EscuelasService {
  constructor(
    @InjectRepository(Escuela)
    private escuelaRepository: Repository<Escuela>,
  ) {}

  async findAll(): Promise<Escuela[]> {
    return this.escuelaRepository.find({
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Escuela | null> {
    return this.escuelaRepository.findOne({
      where: { id },
      relations: ['datosEducativos'],
    });
  }
}