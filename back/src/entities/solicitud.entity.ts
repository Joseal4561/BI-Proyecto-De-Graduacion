import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Escuela } from './escuela.entity';

@Entity('necesidad_mobiliario')
export class NecesidadMobiliario {
  @PrimaryGeneratedColumn({ name: 'id_necesidad' })
  idNecesidad: number;

  @Column({ name: 'escuela_id' })
  escuelaId: number;

  @Column({ type: 'int', default: 0, name: 'necesidad_escritorios' })
  necesidadEscritorios: number;

  @Column({ type: 'int', default: 0, name: 'necesidad_mesas_hexagonales' })
  necesidadMesasHexagonales: number;

  @Column({ type: 'int', default: 0, name: 'necesidad_pizarras' })
  necesidadPizarras: number;

  @Column({ type: 'int', default: 0, name: 'necesidad_catedras' })
  necesidadCatedras: number;

  @Column({ type: 'date', nullable: true, name: 'fecha_reporte' })
  fechaReporte: Date;

  @ManyToOne(() => Escuela)
  @JoinColumn({ name: 'escuela_id' })
  escuela: Escuela;
}