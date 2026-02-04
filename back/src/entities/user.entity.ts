// file: user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne } from 'typeorm';
import { UserRank } from './user-rank.entity'; // Import the new entity

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  // KEEPING the original role for UI/Feature authorization
  @Column({ type: 'enum', enum: ['admin', 'user'], default: 'user' })
  role: 'admin' | 'user';

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;

  // ADDING OneToOne relationship to UserRank for data filtering
  @OneToOne(() => UserRank, userRank => userRank.user)
  userRank: UserRank;
}