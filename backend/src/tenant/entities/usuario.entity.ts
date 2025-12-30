import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Empresa } from './empresa.entity';

export enum UsuarioRol {
  DUENO = 'DUEÑO',
  EMPLEADO = 'EMPLEADO',
}

@Entity('usuario')
@Index(['empresaId', 'email'], { unique: true })
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'empresa_id' })
  @Index()
  empresaId: string;

  @ManyToOne(() => Empresa, (empresa) => empresa.usuarios, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  @Exclude() // SECURITY: Never expose password hash in API responses
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UsuarioRol,
    default: UsuarioRol.EMPLEADO,
  })
  rol: UsuarioRol;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
