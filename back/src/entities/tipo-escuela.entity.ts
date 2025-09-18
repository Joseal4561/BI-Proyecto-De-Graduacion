import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Escuela } from './escuela.entity';

@Entity('tipos_escuelas')
export class TipoEscuela {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  nombre: string;

  @OneToMany(() => Escuela, (escuela) => escuela.tipo)
  escuelas: Escuela[];
}
