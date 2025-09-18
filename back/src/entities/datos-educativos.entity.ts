import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Escuela } from './escuela.entity';

@Entity('datos_educativos')
@Unique(['escuelaId', 'anio', 'semestre'])
export class DatosEducativos {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'escuela_id' })
  escuelaId: number;

  @Column({ type: 'year' })
  anio: number;

  @Column({ type: 'enum', enum: ['1', '2'] })
  semestre: '1' | '2';

  @Column({ name: 'cantidad_alumnos' })
  cantidadAlumnos: number;

  @Column({ name: 'numero_inscripciones' })
  numeroInscripciones: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'tasa_desercion' })
  tasaDesercion: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'tasa_promocion' })
  tasaPromocion: number;

  @Column({ nullable: true, name: 'numero_maestros' })
  numeroMaestros: number;

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true, name: 'promedio_calificaciones' })
  promedioCalificaciones: number;

  @Column({ nullable: true, name: 'es_urbana' })
  esUrbana: boolean;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;

  @ManyToOne(() => Escuela, escuela => escuela.datosEducativos)
  @JoinColumn({ name: 'id' })
  escuela: Escuela;
}