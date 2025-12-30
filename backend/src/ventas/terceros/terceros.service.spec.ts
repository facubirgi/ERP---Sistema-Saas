import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { TercerosService } from './terceros.service';
import { Tercero } from '../entities/tercero.entity';
import { TipoTercero } from '../enums';
import {
  CrearTerceroDto,
  ActualizarTerceroDto,
  ListarTercerosQueryDto,
} from './dto';

describe('TercerosService', () => {
  let service: TercerosService;
  let repository: Repository<Tercero>;

  const mockEmpresaId = 'empresa-123';
  const mockTerceroId = 'tercero-456';

  const mockTercero: Tercero = {
    id: mockTerceroId,
    nombre: 'Juan Perez',
    direccion: 'Calle 123',
    tipo: TipoTercero.CLIENTE,
    saldoActual: 0,
    empresaId: mockEmpresaId,
    eliminado: false,
    deletedAt: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    empresa: null,
    comprobantes: [],
  };

  const mockRepositoryMethods = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TercerosService,
        {
          provide: getRepositoryToken(Tercero),
          useValue: mockRepositoryMethods,
        },
      ],
    }).compile();

    service = module.get<TercerosService>(TercerosService);
    repository = module.get<Repository<Tercero>>(getRepositoryToken(Tercero));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('crear', () => {
    it('should create a new cliente successfully', async () => {
      // Arrange
      const dto: CrearTerceroDto = {
        nombre: 'Juan Perez',
        direccion: 'Calle 123',
        tipo: TipoTercero.CLIENTE,
      };

      const createdTercero = { ...mockTercero };

      mockRepositoryMethods.create.mockReturnValue(createdTercero);
      mockRepositoryMethods.save.mockResolvedValue(createdTercero);

      // Act
      const result = await service.crear(dto, mockEmpresaId);

      // Assert
      expect(mockRepositoryMethods.create).toHaveBeenCalledWith({
        nombre: dto.nombre,
        direccion: dto.direccion,
        tipo: dto.tipo,
        empresaId: mockEmpresaId,
        saldoActual: 0,
        eliminado: false,
        deletedAt: null,
      });
      expect(mockRepositoryMethods.save).toHaveBeenCalledWith(createdTercero);
      expect(result).toEqual({
        id: mockTerceroId,
        nombre: 'Juan Perez',
        direccion: 'Calle 123',
        tipo: TipoTercero.CLIENTE,
        saldoActual: 0,
        createdAt: mockTercero.createdAt,
        updatedAt: mockTercero.updatedAt,
      });
    });

    it('should create a new proveedor successfully', async () => {
      // Arrange
      const dto: CrearTerceroDto = {
        nombre: 'Proveedor XYZ',
        direccion: 'Av Principal 456',
        tipo: TipoTercero.PROVEEDOR,
      };

      const createdProveedor = {
        ...mockTercero,
        nombre: dto.nombre,
        direccion: dto.direccion,
        tipo: TipoTercero.PROVEEDOR,
      };

      mockRepositoryMethods.create.mockReturnValue(createdProveedor);
      mockRepositoryMethods.save.mockResolvedValue(createdProveedor);

      // Act
      const result = await service.crear(dto, mockEmpresaId);

      // Assert
      expect(result.tipo).toBe(TipoTercero.PROVEEDOR);
      expect(result.nombre).toBe('Proveedor XYZ');
    });

    it('should create tercero with null direccion when not provided', async () => {
      // Arrange
      const dto: CrearTerceroDto = {
        nombre: 'Cliente Sin Direccion',
        tipo: TipoTercero.CLIENTE,
      };

      const createdTercero = {
        ...mockTercero,
        nombre: dto.nombre,
        direccion: null,
      };

      mockRepositoryMethods.create.mockReturnValue(createdTercero);
      mockRepositoryMethods.save.mockResolvedValue(createdTercero);

      // Act
      const result = await service.crear(dto, mockEmpresaId);

      // Assert
      expect(mockRepositoryMethods.create).toHaveBeenCalledWith(
        expect.objectContaining({
          direccion: null,
        }),
      );
      expect(result.direccion).toBeNull();
    });

    it('should initialize saldoActual to 0', async () => {
      // Arrange
      const dto: CrearTerceroDto = {
        nombre: 'Test Cliente',
        tipo: TipoTercero.CLIENTE,
      };

      mockRepositoryMethods.create.mockReturnValue(mockTercero);
      mockRepositoryMethods.save.mockResolvedValue(mockTercero);

      // Act
      const result = await service.crear(dto, mockEmpresaId);

      // Assert
      expect(mockRepositoryMethods.create).toHaveBeenCalledWith(
        expect.objectContaining({
          saldoActual: 0,
        }),
      );
      expect(result.saldoActual).toBe(0);
    });

    it('should set eliminado to false by default', async () => {
      // Arrange
      const dto: CrearTerceroDto = {
        nombre: 'Test Cliente',
        tipo: TipoTercero.CLIENTE,
      };

      mockRepositoryMethods.create.mockReturnValue(mockTercero);
      mockRepositoryMethods.save.mockResolvedValue(mockTercero);

      // Act
      await service.crear(dto, mockEmpresaId);

      // Assert
      expect(mockRepositoryMethods.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eliminado: false,
          deletedAt: null,
        }),
      );
    });
  });

  describe('listar', () => {
    it('should list all terceros without filters', async () => {
      // Arrange
      const query: ListarTercerosQueryDto = {};
      const mockTerceros = [
        mockTercero,
        {
          ...mockTercero,
          id: 'tercero-789',
          nombre: 'Maria Lopez',
        },
      ];

      mockRepositoryMethods.find.mockResolvedValue(mockTerceros);

      // Act
      const result = await service.listar(query, mockEmpresaId);

      // Assert
      expect(mockRepositoryMethods.find).toHaveBeenCalledWith({
        where: {
          empresaId: mockEmpresaId,
          eliminado: false,
        },
        order: { nombre: 'ASC' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].nombre).toBe('Juan Perez');
      expect(result[1].nombre).toBe('Maria Lopez');
    });

    it('should filter terceros by tipo CLIENTE', async () => {
      // Arrange
      const query: ListarTercerosQueryDto = {
        tipo: TipoTercero.CLIENTE,
      };

      const mockClientes = [mockTercero];
      mockRepositoryMethods.find.mockResolvedValue(mockClientes);

      // Act
      const result = await service.listar(query, mockEmpresaId);

      // Assert
      expect(mockRepositoryMethods.find).toHaveBeenCalledWith({
        where: {
          empresaId: mockEmpresaId,
          eliminado: false,
          tipo: TipoTercero.CLIENTE,
        },
        order: { nombre: 'ASC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].tipo).toBe(TipoTercero.CLIENTE);
    });

    it('should filter terceros by tipo PROVEEDOR', async () => {
      // Arrange
      const query: ListarTercerosQueryDto = {
        tipo: TipoTercero.PROVEEDOR,
      };

      const mockProveedores = [
        {
          ...mockTercero,
          tipo: TipoTercero.PROVEEDOR,
        },
      ];
      mockRepositoryMethods.find.mockResolvedValue(mockProveedores);

      // Act
      const result = await service.listar(query, mockEmpresaId);

      // Assert
      expect(mockRepositoryMethods.find).toHaveBeenCalledWith({
        where: {
          empresaId: mockEmpresaId,
          eliminado: false,
          tipo: TipoTercero.PROVEEDOR,
        },
        order: { nombre: 'ASC' },
      });
      expect(result[0].tipo).toBe(TipoTercero.PROVEEDOR);
    });

    it('should filter terceros by busqueda (search term)', async () => {
      // Arrange
      const query: ListarTercerosQueryDto = {
        busqueda: 'Juan',
      };

      mockRepositoryMethods.find.mockResolvedValue([mockTercero]);

      // Act
      const result = await service.listar(query, mockEmpresaId);

      // Assert
      expect(mockRepositoryMethods.find).toHaveBeenCalledWith({
        where: {
          empresaId: mockEmpresaId,
          eliminado: false,
          nombre: Like('%Juan%'),
        },
        order: { nombre: 'ASC' },
      });
      expect(result).toHaveLength(1);
    });

    it('should filter terceros by tipo and busqueda combined', async () => {
      // Arrange
      const query: ListarTercerosQueryDto = {
        tipo: TipoTercero.CLIENTE,
        busqueda: 'Perez',
      };

      mockRepositoryMethods.find.mockResolvedValue([mockTercero]);

      // Act
      const result = await service.listar(query, mockEmpresaId);

      // Assert
      expect(mockRepositoryMethods.find).toHaveBeenCalledWith({
        where: {
          empresaId: mockEmpresaId,
          eliminado: false,
          tipo: TipoTercero.CLIENTE,
          nombre: Like('%Perez%'),
        },
        order: { nombre: 'ASC' },
      });
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no terceros match filters', async () => {
      // Arrange
      const query: ListarTercerosQueryDto = {
        busqueda: 'NonExistent',
      };

      mockRepositoryMethods.find.mockResolvedValue([]);

      // Act
      const result = await service.listar(query, mockEmpresaId);

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should only return non-deleted terceros', async () => {
      // Arrange
      const query: ListarTercerosQueryDto = {};
      mockRepositoryMethods.find.mockResolvedValue([mockTercero]);

      // Act
      await service.listar(query, mockEmpresaId);

      // Assert
      expect(mockRepositoryMethods.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            eliminado: false,
          }),
        }),
      );
    });
  });

  describe('obtenerPorId', () => {
    it('should return tercero by id successfully', async () => {
      // Arrange
      mockRepositoryMethods.findOne.mockResolvedValue(mockTercero);

      // Act
      const result = await service.obtenerPorId(mockTerceroId, mockEmpresaId);

      // Assert
      expect(mockRepositoryMethods.findOne).toHaveBeenCalledWith({
        where: {
          id: mockTerceroId,
          empresaId: mockEmpresaId,
          eliminado: false,
        },
      });
      expect(result).toEqual({
        id: mockTerceroId,
        nombre: 'Juan Perez',
        direccion: 'Calle 123',
        tipo: TipoTercero.CLIENTE,
        saldoActual: 0,
        createdAt: mockTercero.createdAt,
        updatedAt: mockTercero.updatedAt,
      });
    });

    it('should throw NotFoundException when tercero does not exist', async () => {
      // Arrange
      mockRepositoryMethods.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.obtenerPorId('non-existent-id', mockEmpresaId),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.obtenerPorId('non-existent-id', mockEmpresaId),
      ).rejects.toThrow('Tercero non-existent-id no encontrado');
    });

    it('should throw NotFoundException when tercero belongs to different empresa', async () => {
      // Arrange
      mockRepositoryMethods.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.obtenerPorId(mockTerceroId, 'different-empresa-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not return deleted terceros', async () => {
      // Arrange
      mockRepositoryMethods.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.obtenerPorId(mockTerceroId, mockEmpresaId),
      ).rejects.toThrow(NotFoundException);

      expect(mockRepositoryMethods.findOne).toHaveBeenCalledWith({
        where: expect.objectContaining({
          eliminado: false,
        }),
      });
    });
  });

  describe('actualizar', () => {
    it('should update tercero nombre successfully', async () => {
      // Arrange
      const dto: ActualizarTerceroDto = {
        nombre: 'Juan Perez Updated',
      };

      const updatedTercero = {
        ...mockTercero,
        nombre: dto.nombre,
      };

      mockRepositoryMethods.findOne.mockResolvedValue(mockTercero);
      mockRepositoryMethods.save.mockResolvedValue(updatedTercero);

      // Act
      const result = await service.actualizar(
        mockTerceroId,
        dto,
        mockEmpresaId,
      );

      // Assert
      expect(mockRepositoryMethods.findOne).toHaveBeenCalledWith({
        where: {
          id: mockTerceroId,
          empresaId: mockEmpresaId,
          eliminado: false,
        },
      });
      expect(result.nombre).toBe('Juan Perez Updated');
    });

    it('should update tercero direccion successfully', async () => {
      // Arrange
      const dto: ActualizarTerceroDto = {
        direccion: 'Nueva Direccion 789',
      };

      const updatedTercero = {
        ...mockTercero,
        direccion: dto.direccion,
      };

      mockRepositoryMethods.findOne.mockResolvedValue(mockTercero);
      mockRepositoryMethods.save.mockResolvedValue(updatedTercero);

      // Act
      const result = await service.actualizar(
        mockTerceroId,
        dto,
        mockEmpresaId,
      );

      // Assert
      expect(result.direccion).toBe('Nueva Direccion 789');
    });

    it('should update tercero tipo successfully', async () => {
      // Arrange
      const dto: ActualizarTerceroDto = {
        tipo: TipoTercero.PROVEEDOR,
      };

      const updatedTercero = {
        ...mockTercero,
        tipo: TipoTercero.PROVEEDOR,
      };

      mockRepositoryMethods.findOne.mockResolvedValue(mockTercero);
      mockRepositoryMethods.save.mockResolvedValue(updatedTercero);

      // Act
      const result = await service.actualizar(
        mockTerceroId,
        dto,
        mockEmpresaId,
      );

      // Assert
      expect(result.tipo).toBe(TipoTercero.PROVEEDOR);
    });

    it('should update multiple fields at once', async () => {
      // Arrange
      const dto: ActualizarTerceroDto = {
        nombre: 'Updated Name',
        direccion: 'Updated Address',
        tipo: TipoTercero.PROVEEDOR,
      };

      const updatedTercero = {
        ...mockTercero,
        ...dto,
      };

      mockRepositoryMethods.findOne.mockResolvedValue(mockTercero);
      mockRepositoryMethods.save.mockResolvedValue(updatedTercero);

      // Act
      const result = await service.actualizar(
        mockTerceroId,
        dto,
        mockEmpresaId,
      );

      // Assert
      expect(result.nombre).toBe('Updated Name');
      expect(result.direccion).toBe('Updated Address');
      expect(result.tipo).toBe(TipoTercero.PROVEEDOR);
    });

    it('should set direccion to null when empty string provided', async () => {
      // Arrange
      const dto: ActualizarTerceroDto = {
        direccion: '',
      };

      const updatedTercero = {
        ...mockTercero,
        direccion: null,
      };

      mockRepositoryMethods.findOne.mockResolvedValue(mockTercero);
      mockRepositoryMethods.save.mockResolvedValue(updatedTercero);

      // Act
      const result = await service.actualizar(
        mockTerceroId,
        dto,
        mockEmpresaId,
      );

      // Assert
      expect(result.direccion).toBeNull();
    });

    it('should only update provided fields (partial update)', async () => {
      // Arrange
      const dto: ActualizarTerceroDto = {
        nombre: 'Only Name Updated',
      };

      const terceroBeforeUpdate = { ...mockTercero };
      const updatedTercero = {
        ...mockTercero,
        nombre: dto.nombre,
      };

      mockRepositoryMethods.findOne.mockResolvedValue(terceroBeforeUpdate);
      mockRepositoryMethods.save.mockResolvedValue(updatedTercero);

      // Act
      const result = await service.actualizar(
        mockTerceroId,
        dto,
        mockEmpresaId,
      );

      // Assert
      expect(result.nombre).toBe('Only Name Updated');
      expect(result.direccion).toBe(mockTercero.direccion);
      expect(result.tipo).toBe(mockTercero.tipo);
    });

    it('should throw NotFoundException when tercero does not exist', async () => {
      // Arrange
      const dto: ActualizarTerceroDto = {
        nombre: 'Updated Name',
      };

      mockRepositoryMethods.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.actualizar('non-existent-id', dto, mockEmpresaId),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.actualizar('non-existent-id', dto, mockEmpresaId),
      ).rejects.toThrow('Tercero non-existent-id no encontrado');
    });

    it('should throw NotFoundException when tercero belongs to different empresa', async () => {
      // Arrange
      const dto: ActualizarTerceroDto = {
        nombre: 'Updated Name',
      };

      mockRepositoryMethods.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.actualizar(mockTerceroId, dto, 'different-empresa-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not update deleted terceros', async () => {
      // Arrange
      const dto: ActualizarTerceroDto = {
        nombre: 'Updated Name',
      };

      mockRepositoryMethods.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.actualizar(mockTerceroId, dto, mockEmpresaId),
      ).rejects.toThrow(NotFoundException);

      expect(mockRepositoryMethods.findOne).toHaveBeenCalledWith({
        where: expect.objectContaining({
          eliminado: false,
        }),
      });
    });
  });

  describe('eliminar', () => {
    it('should soft delete tercero with zero balance successfully', async () => {
      // Arrange
      const terceroConSaldoCero = {
        ...mockTercero,
        saldoActual: 0,
      };

      mockRepositoryMethods.findOne.mockResolvedValue(terceroConSaldoCero);
      mockRepositoryMethods.save.mockResolvedValue({
        ...terceroConSaldoCero,
        eliminado: true,
        deletedAt: new Date(),
      });

      // Act
      await service.eliminar(mockTerceroId, mockEmpresaId);

      // Assert
      expect(mockRepositoryMethods.findOne).toHaveBeenCalledWith({
        where: {
          id: mockTerceroId,
          empresaId: mockEmpresaId,
          eliminado: false,
        },
      });
      expect(mockRepositoryMethods.save).toHaveBeenCalledWith(
        expect.objectContaining({
          eliminado: true,
          deletedAt: expect.any(Date),
        }),
      );
    });

    it('should throw ConflictException when tercero has positive balance', async () => {
      // Arrange
      const terceroConSaldo = {
        ...mockTercero,
        saldoActual: 150.5,
      };

      mockRepositoryMethods.findOne.mockResolvedValue(terceroConSaldo);

      // Act & Assert
      await expect(
        service.eliminar(mockTerceroId, mockEmpresaId),
      ).rejects.toThrow(ConflictException);

      await expect(
        service.eliminar(mockTerceroId, mockEmpresaId),
      ).rejects.toThrow(
        'No se puede eliminar el tercero. Tiene un saldo pendiente de $150.50',
      );

      expect(mockRepositoryMethods.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when tercero has negative balance', async () => {
      // Arrange
      const terceroConSaldoNegativo = {
        ...mockTercero,
        saldoActual: -75.25,
      };

      mockRepositoryMethods.findOne.mockResolvedValue(terceroConSaldoNegativo);

      // Act & Assert
      await expect(
        service.eliminar(mockTerceroId, mockEmpresaId),
      ).rejects.toThrow(ConflictException);

      await expect(
        service.eliminar(mockTerceroId, mockEmpresaId),
      ).rejects.toThrow(
        'No se puede eliminar el tercero. Tiene un saldo pendiente de $-75.25',
      );
    });

    it('should throw NotFoundException when tercero does not exist', async () => {
      // Arrange
      mockRepositoryMethods.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.eliminar('non-existent-id', mockEmpresaId),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.eliminar('non-existent-id', mockEmpresaId),
      ).rejects.toThrow('Tercero non-existent-id no encontrado');
    });

    it('should throw NotFoundException when tercero belongs to different empresa', async () => {
      // Arrange
      mockRepositoryMethods.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.eliminar(mockTerceroId, 'different-empresa-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not delete already deleted terceros', async () => {
      // Arrange
      mockRepositoryMethods.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.eliminar(mockTerceroId, mockEmpresaId),
      ).rejects.toThrow(NotFoundException);

      expect(mockRepositoryMethods.findOne).toHaveBeenCalledWith({
        where: expect.objectContaining({
          eliminado: false,
        }),
      });
    });

    it('should set both eliminado and deletedAt fields', async () => {
      // Arrange
      const terceroConSaldoCero = {
        ...mockTercero,
        saldoActual: 0,
      };

      mockRepositoryMethods.findOne.mockResolvedValue(terceroConSaldoCero);
      mockRepositoryMethods.save.mockResolvedValue({
        ...terceroConSaldoCero,
        eliminado: true,
        deletedAt: new Date(),
      });

      // Act
      await service.eliminar(mockTerceroId, mockEmpresaId);

      // Assert
      const savedTercero = mockRepositoryMethods.save.mock.calls[0][0];
      expect(savedTercero.eliminado).toBe(true);
      expect(savedTercero.deletedAt).toBeInstanceOf(Date);
    });

    it('should handle decimal balance with proper formatting in error message', async () => {
      // Arrange
      const terceroConSaldo = {
        ...mockTercero,
        saldoActual: 1000.99,
      };

      mockRepositoryMethods.findOne.mockResolvedValue(terceroConSaldo);

      // Act & Assert
      await expect(
        service.eliminar(mockTerceroId, mockEmpresaId),
      ).rejects.toThrow(
        'No se puede eliminar el tercero. Tiene un saldo pendiente de $1000.99',
      );
    });
  });

  describe('getSaldo', () => {
    it('should return saldo with DEUDOR status when balance is positive', async () => {
      // Arrange
      const terceroConDeuda: Tercero = {
        id: mockTerceroId,
        nombre: 'Juan Perez',
        direccion: 'Calle 123',
        tipo: TipoTercero.CLIENTE,
        saldoActual: 500.75,
        empresaId: mockEmpresaId,
        eliminado: false,
        deletedAt: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        empresa: null,
        comprobantes: [],
      };

      mockRepositoryMethods.findOne.mockResolvedValue(terceroConDeuda);

      // Act
      const result = await service.getSaldo(mockTerceroId, mockEmpresaId);

      // Assert
      expect(mockRepositoryMethods.findOne).toHaveBeenCalledWith({
        where: {
          id: mockTerceroId,
          empresaId: mockEmpresaId,
          eliminado: false,
        },
      });
      expect(result).toEqual({
        clienteNombre: 'Juan Perez',
        saldoTotal: 500.75,
        estado: 'DEUDOR',
      });
    });

    it('should return saldo with AL_DIA status when balance is zero', async () => {
      // Arrange
      const terceroAlDia: Tercero = {
        id: mockTerceroId,
        nombre: 'Juan Perez',
        direccion: 'Calle 123',
        tipo: TipoTercero.CLIENTE,
        saldoActual: 0,
        empresaId: mockEmpresaId,
        eliminado: false,
        deletedAt: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        empresa: null,
        comprobantes: [],
      };

      mockRepositoryMethods.findOne.mockResolvedValue(terceroAlDia);

      // Act
      const result = await service.getSaldo(mockTerceroId, mockEmpresaId);

      // Assert
      expect(result).toEqual({
        clienteNombre: 'Juan Perez',
        saldoTotal: 0,
        estado: 'AL_DIA',
      });
    });

    it('should return saldo with AL_DIA status when balance is negative', async () => {
      // Arrange
      const terceroConSaldoAFavor: Tercero = {
        id: mockTerceroId,
        nombre: 'Juan Perez',
        direccion: 'Calle 123',
        tipo: TipoTercero.CLIENTE,
        saldoActual: -250.5,
        empresaId: mockEmpresaId,
        eliminado: false,
        deletedAt: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        empresa: null,
        comprobantes: [],
      };

      mockRepositoryMethods.findOne.mockResolvedValue(terceroConSaldoAFavor);

      // Act
      const result = await service.getSaldo(mockTerceroId, mockEmpresaId);

      // Assert
      expect(result).toEqual({
        clienteNombre: 'Juan Perez',
        saldoTotal: -250.5,
        estado: 'AL_DIA',
      });
    });

    it('should throw NotFoundException when tercero does not exist', async () => {
      // Arrange
      mockRepositoryMethods.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getSaldo('non-existent-id', mockEmpresaId),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.getSaldo('non-existent-id', mockEmpresaId),
      ).rejects.toThrow('Tercero non-existent-id no encontrado');
    });

    it('should throw NotFoundException when tercero belongs to different empresa', async () => {
      // Arrange
      mockRepositoryMethods.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getSaldo(mockTerceroId, 'different-empresa-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not return saldo for deleted terceros', async () => {
      // Arrange
      mockRepositoryMethods.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getSaldo(mockTerceroId, mockEmpresaId),
      ).rejects.toThrow(NotFoundException);

      expect(mockRepositoryMethods.findOne).toHaveBeenCalledWith({
        where: expect.objectContaining({
          eliminado: false,
        }),
      });
    });

    it('should return correct nombre in clienteNombre field', async () => {
      // Arrange
      const terceroConNombreEspecifico: Tercero = {
        id: mockTerceroId,
        nombre: 'Empresa ABC S.A.',
        direccion: 'Calle 123',
        tipo: TipoTercero.CLIENTE,
        saldoActual: 100,
        empresaId: mockEmpresaId,
        eliminado: false,
        deletedAt: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        empresa: null,
        comprobantes: [],
      };

      mockRepositoryMethods.findOne.mockResolvedValue(
        terceroConNombreEspecifico,
      );

      // Act
      const result = await service.getSaldo(mockTerceroId, mockEmpresaId);

      // Assert
      expect(result.clienteNombre).toBe('Empresa ABC S.A.');
    });

    it('should handle very small positive balance as DEUDOR', async () => {
      // Arrange
      const terceroConDeudaMinima: Tercero = {
        id: mockTerceroId,
        nombre: 'Juan Perez',
        direccion: 'Calle 123',
        tipo: TipoTercero.CLIENTE,
        saldoActual: 0.01,
        empresaId: mockEmpresaId,
        eliminado: false,
        deletedAt: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        empresa: null,
        comprobantes: [],
      };

      mockRepositoryMethods.findOne.mockResolvedValue(terceroConDeudaMinima);

      // Act
      const result = await service.getSaldo(mockTerceroId, mockEmpresaId);

      // Assert
      expect(result.estado).toBe('DEUDOR');
      expect(result.saldoTotal).toBe(0.01);
    });

    it('should work for both CLIENTE and PROVEEDOR types', async () => {
      // Arrange
      const proveedor: Tercero = {
        id: mockTerceroId,
        nombre: 'Juan Perez',
        direccion: 'Calle 123',
        tipo: TipoTercero.PROVEEDOR,
        saldoActual: 1000,
        empresaId: mockEmpresaId,
        eliminado: false,
        deletedAt: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        empresa: null,
        comprobantes: [],
      };

      mockRepositoryMethods.findOne.mockResolvedValue(proveedor);

      // Act
      const result = await service.getSaldo(mockTerceroId, mockEmpresaId);

      // Assert
      expect(result).toEqual({
        clienteNombre: 'Juan Perez',
        saldoTotal: 1000,
        estado: 'DEUDOR',
      });
    });
  });

  describe('edge cases and additional scenarios', () => {
    it('should handle undefined empresaId gracefully in crear', async () => {
      // Arrange
      const dto: CrearTerceroDto = {
        nombre: 'Test',
        tipo: TipoTercero.CLIENTE,
      };

      mockRepositoryMethods.create.mockReturnValue(mockTercero);
      mockRepositoryMethods.save.mockResolvedValue(mockTercero);

      // Act
      await service.crear(dto, undefined as any);

      // Assert
      expect(mockRepositoryMethods.create).toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: undefined,
        }),
      );
    });

    it('should handle empty string in busqueda filter (treated as no filter)', async () => {
      // Arrange
      const query: ListarTercerosQueryDto = {
        busqueda: '',
      };

      mockRepositoryMethods.find.mockResolvedValue([]);

      // Act
      await service.listar(query, mockEmpresaId);

      // Assert
      // Empty string is falsy, so it shouldn't add the nombre filter
      expect(mockRepositoryMethods.find).toHaveBeenCalledWith({
        where: {
          empresaId: mockEmpresaId,
          eliminado: false,
        },
        order: { nombre: 'ASC' },
      });

      // Verify that nombre filter was NOT added for empty string
      const callArgs = mockRepositoryMethods.find.mock.calls[0][0];
      expect(callArgs.where.nombre).toBeUndefined();
    });

    it('should preserve existing fields when updating with empty dto', async () => {
      // Arrange
      const dto: ActualizarTerceroDto = {};

      const originalTercero = { ...mockTercero };
      mockRepositoryMethods.findOne.mockResolvedValue(originalTercero);
      mockRepositoryMethods.save.mockResolvedValue(originalTercero);

      // Act
      const result = await service.actualizar(
        mockTerceroId,
        dto,
        mockEmpresaId,
      );

      // Assert
      expect(result.nombre).toBe(mockTercero.nombre);
      expect(result.direccion).toBe(mockTercero.direccion);
      expect(result.tipo).toBe(mockTercero.tipo);
    });

    it('should handle repository errors in crear', async () => {
      // Arrange
      const dto: CrearTerceroDto = {
        nombre: 'Test',
        tipo: TipoTercero.CLIENTE,
      };

      mockRepositoryMethods.create.mockReturnValue(mockTercero);
      mockRepositoryMethods.save.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.crear(dto, mockEmpresaId)).rejects.toThrow(
        'Database error',
      );
    });

    it('should handle repository errors in listar', async () => {
      // Arrange
      const query: ListarTercerosQueryDto = {};
      mockRepositoryMethods.find.mockRejectedValue(
        new Error('Database connection lost'),
      );

      // Act & Assert
      await expect(service.listar(query, mockEmpresaId)).rejects.toThrow(
        'Database connection lost',
      );
    });

    it('should return response without empresa and comprobantes relations', async () => {
      // Arrange
      const terceroWithRelations = {
        ...mockTercero,
        empresa: { id: 'empresa-123', nombre: 'Empresa Test' },
        comprobantes: [{ id: 'comp-1' }, { id: 'comp-2' }],
      };

      mockRepositoryMethods.findOne.mockResolvedValue(terceroWithRelations);

      // Act
      const result = await service.obtenerPorId(mockTerceroId, mockEmpresaId);

      // Assert
      expect(result).not.toHaveProperty('empresa');
      expect(result).not.toHaveProperty('comprobantes');
      expect(result).not.toHaveProperty('eliminado');
      expect(result).not.toHaveProperty('deletedAt');
      expect(result).not.toHaveProperty('empresaId');
    });
  });
});
