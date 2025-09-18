import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Escuela } from './escuela.entity';

@Entity('municipios')
export class Municipio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  nombre: string;

  @OneToMany(() => Escuela, (escuela) => escuela.municipio)
  escuelas: Escuela[];
}
