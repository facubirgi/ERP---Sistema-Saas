import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Inject,
  Scope,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import * as bcrypt from 'bcryptjs';
import { Empresa } from './entities/empresa.entity';
import { Usuario, UsuarioRol } from './entities/usuario.entity';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

/**
 * TENANT SERVICE
 *
 * Servicio con Scope.REQUEST para gestión de empresas y usuarios.
 *
 * Nota: Este servicio NO extiende TenantBaseService porque maneja
 * operaciones especiales sin contexto de tenant (registro, login lookup).
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantService {
  constructor(
    @InjectRepository(Empresa)
    private empresaRepository: Repository<Empresa>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @Inject(REQUEST)
    private request: Request,
  ) {}

  /**
   * Obtiene empresaId del request (inyectado por TenantGuard).
   * Solo disponible en endpoints autenticados.
   *
   * @returns UUID de la empresa del usuario autenticado
   * @throws Error si tenantId no existe en el request
   */
  protected get empresaId(): string {
    const tenantId = this.request['tenantId'];

    if (!tenantId) {
      throw new Error(
        'CRITICAL ERROR: tenantId no encontrado en request. ' +
          'Asegúrate de usar @UseGuards(JwtAuthGuard, TenantGuard) en el controller.',
      );
    }

    return tenantId;
  }

  /**
   * Register a new empresa with its owner usuario
   * This is used during tenant registration
   */
  async registerEmpresaWithOwner(
    empresaDto: CreateEmpresaDto,
    usuarioDto: CreateUsuarioDto,
  ): Promise<{ empresa: Empresa; usuario: Usuario }> {
    // Check if empresa email already exists
    const existingEmpresa = await this.empresaRepository.findOne({
      where: { email: empresaDto.email },
    });

    if (existingEmpresa) {
      throw new ConflictException('Email de empresa ya está registrado');
    }

    // Create empresa
    const empresa = this.empresaRepository.create(empresaDto);
    let savedEmpresa: Empresa;
    try {
      savedEmpresa = await this.empresaRepository.save(empresa);
    } catch (error) {
      // Postgres unique constraint violation code: 23505
      if ((error as any)?.code === '23505') {
        throw new ConflictException('Email de empresa ya está registrado');
      }
      throw error;
    }

    try {
      // Hash password
      const passwordHash = await bcrypt.hash(usuarioDto.password, 10);

      // Create owner usuario
      const usuario = this.usuarioRepository.create({
        ...usuarioDto,
        empresaId: savedEmpresa.id,
        passwordHash,
        rol: UsuarioRol.DUENO, // First user is always the owner
      });

      const savedUsuario = await this.usuarioRepository.save(usuario);

      return {
        empresa: savedEmpresa,
        usuario: savedUsuario,
      };
    } catch (error) {
      // Rollback: delete empresa if usuario creation fails
      await this.empresaRepository.delete(savedEmpresa.id);
      if ((error as any)?.code === '23505') {
        throw new ConflictException('Email de usuario ya está registrado');
      }
      throw error;
    }
  }

  /**
   * Create a new usuario for an existing empresa
   */
  async createUsuario(
    usuarioDto: CreateUsuarioDto,
    empresaId: string,
  ): Promise<Usuario> {
    // Verify empresa exists
    const empresa = await this.empresaRepository.findOne({
      where: { id: empresaId },
    });

    if (!empresa) {
      throw new NotFoundException('Empresa no encontrada');
    }

    // Check if email already exists for this empresa
    const existingUsuario = await this.usuarioRepository.findOne({
      where: {
        empresaId,
        email: usuarioDto.email,
      },
    });

    if (existingUsuario) {
      throw new ConflictException('Email ya está registrado en esta empresa');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(usuarioDto.password, 10);

    // Create usuario
    const usuario = this.usuarioRepository.create({
      ...usuarioDto,
      empresaId,
      passwordHash,
    });

    return this.usuarioRepository.save(usuario);
  }

  /**
   * Find usuario by email and empresaId (for authentication)
   */
  async findUsuarioByEmail(
    email: string,
    empresaId: string,
  ): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({
      where: {
        email,
        empresaId,
      },
      relations: ['empresa'],
    });
  }

  /**
   * Find usuario by id (with tenant check)
   */
  async findUsuarioById(
    id: string,
    empresaId: string,
  ): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({
      where: {
        id,
        empresaId, // CRITICAL: Always include tenant check
      },
      relations: ['empresa'],
    });
  }

  /**
   * Find empresa by email (for login lookup)
   */
  async findEmpresaByEmail(email: string): Promise<Empresa | null> {
    return this.empresaRepository.findOne({
      where: { email },
    });
  }

  /**
   * Find empresa by id
   */
  async findEmpresaById(id: string): Promise<Empresa | null> {
    return this.empresaRepository.findOne({
      where: { id },
    });
  }

  /**
   * Verify password
   */
  async verifyPassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Listar todos los usuarios de la empresa
   */
  async listarUsuarios(empresaId: string): Promise<Usuario[]> {
    return this.usuarioRepository.find({
      where: { empresaId },
      order: { createdAt: 'DESC' },
      select: ['id', 'empresaId', 'nombre', 'email', 'rol', 'activo', 'createdAt'],
    });
  }

  /**
   * Actualizar usuario (solo nombre y email)
   */
  async actualizarUsuario(
    id: string,
    dto: UpdateUsuarioDto,
    empresaId: string,
  ): Promise<Usuario> {
    const usuario = await this.findUsuarioById(id, empresaId);

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (dto.email && dto.email !== usuario.email) {
      const existente = await this.usuarioRepository.findOne({
        where: { empresaId, email: dto.email },
      });

      if (existente) {
        throw new ConflictException('El email ya está en uso en esta empresa');
      }
    }

    Object.assign(usuario, dto);
    return this.usuarioRepository.save(usuario);
  }

  /**
   * Cambiar contraseña de un usuario
   */
  async cambiarPassword(
    id: string,
    nuevaPassword: string,
    empresaId: string,
  ): Promise<void> {
    const usuario = await this.findUsuarioById(id, empresaId);

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const passwordHash = await bcrypt.hash(nuevaPassword, 10);
    await this.usuarioRepository.update(id, { passwordHash });
  }

  /**
   * Activar/Desactivar usuario
   */
  async toggleActivoUsuario(
    id: string,
    empresaId: string,
  ): Promise<Usuario> {
    const usuario = await this.findUsuarioById(id, empresaId);

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (usuario.rol === UsuarioRol.DUENO && usuario.activo) {
      const countDuenosActivos = await this.usuarioRepository.count({
        where: {
          empresaId,
          rol: UsuarioRol.DUENO,
          activo: true,
        },
      });

      if (countDuenosActivos <= 1) {
        throw new BadRequestException(
          'No se puede desactivar al único dueño activo de la empresa',
        );
      }
    }

    usuario.activo = !usuario.activo;
    return this.usuarioRepository.save(usuario);
  }

  /**
   * Contar usuarios activos por rol
   */
  async contarUsuariosPorRol(empresaId: string): Promise<{
    totalActivos: number;
    duenos: number;
    empleados: number;
  }> {
    const [duenos, empleados, totalActivos] = await Promise.all([
      this.usuarioRepository.count({
        where: { empresaId, rol: UsuarioRol.DUENO, activo: true },
      }),
      this.usuarioRepository.count({
        where: { empresaId, rol: UsuarioRol.EMPLEADO, activo: true },
      }),
      this.usuarioRepository.count({
        where: { empresaId, activo: true },
      }),
    ]);

    return { totalActivos, duenos, empleados };
  }
}
