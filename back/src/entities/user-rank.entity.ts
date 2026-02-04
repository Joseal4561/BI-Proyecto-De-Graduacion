import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
// Assuming the user entity is named 'User'
import { User } from './user.entity';
import { Escuela } from './escuela.entity';
import { Municipio } from './municipio.entity';

@Entity('user_rank')
export class UserRank {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', unique: true }) // Added unique constraint for one-to-one or one-to-rank per user
  userId: number;

  @Column({
    type: 'enum',
    enum: ['Director', 'Coordinador', 'Administrador'],
    name: 'rankn',
  })
  rank: 'Director' | 'Coordinador' | 'Administrador';

  @Column({ name: 'escuela_id', nullable: true })
  escuelaId: number;

  @Column({ name: 'municipio_id', nullable: true })
  municipioId: number;

  @CreateDateColumn({ name: 'asignado_en' })
  asignadoEn: Date;

  // Relationships (for convenience in querying)
    // One-to-One with User
  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Many-to-One with Escuela (Used for 'Director')
  @ManyToOne(() => Escuela, { nullable: true })
  @JoinColumn({ name: 'escuela_id' })
  escuela: Escuela;

  // Many-to-One with Municipio (Used for 'Coordinador')
  @ManyToOne(() => Municipio, { nullable: true })
  @JoinColumn({ name: 'municipio_id' })
  municipio: Municipio;
}