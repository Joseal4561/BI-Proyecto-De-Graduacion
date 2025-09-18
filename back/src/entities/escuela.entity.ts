import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TipoEscuela } from './tipo-escuela.entity';
import { Municipio } from './municipio.entity';
import { DatosEducativos } from './datos-educativos.entity';

@Entity('escuelas')
export class Escuela {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  direccion?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono?: string;

  @Column({ type: 'date', nullable: true })
  fecha_Fundacion?: Date;

  @ManyToOne(() => TipoEscuela, (tipo) => tipo.escuelas, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'tipo_id' })
  tipo: TipoEscuela;

  @ManyToOne(() => Municipio, (municipio) => municipio.escuelas, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'municipio_id' })
  municipio: Municipio;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  creadoEn: Date;

  @OneToMany(() => DatosEducativos, datosEducativos => datosEducativos.escuela)
  datosEducativos: DatosEducativos[];
}
