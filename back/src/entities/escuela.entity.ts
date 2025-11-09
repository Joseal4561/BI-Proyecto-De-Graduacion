import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Municipio } from './municipio.entity';
import { TipoEscuela } from './tipo-escuela.entity';
import { DatosEducativos } from './datos-educativos.entity';
import { InfraestructuraEscolar } from './infraestructura.entity';
import { NecesidadMobiliario } from './solicitud.entity';

@Entity('escuelas')
export class Escuela {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 30, nullable: true, name: 'codigo_udi' })
  codigoUdi: string;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  direccion: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono: string;

  @Column({ type: 'date', nullable: true, name: 'fecha_fundacion' })
  fechaFundacion: Date;

  @Column({ name: 'tipo_id' })
  tipoId: number;

  @Column({ name: 'municipio_id' })
  municipioId: number;

  @Column({ type: 'enum', enum: ['monolingüe', 'bilingüe'], nullable: true })
  modalidad: 'monolingüe' | 'bilingüe';

  @Column({ type: 'varchar', length: 30, nullable: true })
  jornada: string;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;

  @ManyToOne(() => TipoEscuela)
  @JoinColumn({ name: 'tipo_id' })
  tipo: TipoEscuela;

  @ManyToOne(() => Municipio)
  @JoinColumn({ name: 'municipio_id' })
  municipio: Municipio;

  @OneToMany(() => DatosEducativos, datosEducativos => datosEducativos.escuela)
  datosEducativos: DatosEducativos[];

  @OneToMany(() => InfraestructuraEscolar, infraestructuraescolar => infraestructuraescolar.escuela)
  infraestructuraescolar: InfraestructuraEscolar[];

  @OneToMany(() => NecesidadMobiliario, necesidadMobiliario => necesidadMobiliario.escuela)
  necesidadMobiliario: NecesidadMobiliario[];
}