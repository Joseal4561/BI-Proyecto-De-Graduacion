import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity'; // Adjust to match your actual path

@Entity('predicciones_ia')
export class PrediccionIA {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('json', { name: 'parametros_entrada' })
  parametrosEntrada: any;

  @Column('json', { name: 'resultado_prediccion' })
  resultadoPrediccion: any;

  @Column({ name: 'usuario_id', nullable: true })
  usuarioId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamp' })
  creadoEn: Date;

  @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamp' })
  actualizadoEn: Date;
}