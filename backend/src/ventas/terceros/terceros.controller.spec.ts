import { Test, TestingModule } from '@nestjs/testing';
import { TercerosController } from './terceros.controller';
import { TercerosService } from './terceros.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CrearTerceroDto,
  ActualizarTerceroDto,
  TerceroResponseDto,
  ListarTercerosQueryDto,
  SaldoTerceroResponseDto,
} from './dto';
import { TipoTercero } from '../enums';

/**
 * TEST SUITE: TercerosController
 *
 * Tests for the Terceros controller endpoints.
 * Validates that the controller correctly delegates to the service
 * and passes the empresaId from the authenticated user.
 *
 * Coverage:
 * - POST /terceros (crear)
 * - GET /terceros (listar)
 * - GET /terceros/:id (obtenerPorId)
 * - PATCH /terceros/:id (actualizar)
 * - DELETE /terceros/:id (eliminar)
 * - GET /terceros/:id/saldo (getSaldo)
 */
describe('TercerosController', () => {
  let controller: TercerosController;
  let service: TercerosService;

  // Mock data
  const mockEmpresaId = 'empresa-uuid-123';
  const mockTerceroId = 'tercero-uuid-456';

  const mockRequest = {
    user: {
      empresaId: mockEmpresaId,
      tenantId: mockEmpresaId,
    },
    tenantId: mockEmpresaId,
  };

  const mockTerceroResponse: TerceroResponseDto = {
    id: mockTerceroId,
    nombre: 'Juan Pérez',
    direccion: 'Av. Siempre Viva 742',
    tipo: TipoTercero.CLIENTE,
    saldoActual: 0,
    createdAt: new Date('2025-11-21T10:00:00Z'),
    updatedAt: new Date('2025-11-21T10:00:00Z'),
  };

  const mockSaldoResponse: SaldoTerceroResponseDto = {
    clienteNombre: 'Juan Pérez',
    saldoTotal: 150.5,
    estado: 'DEUDOR',
  };

  // Mock service
  const mockTercerosService = {
    crear: jest.fn(),
    listar: jest.fn(),
    obtenerPorId: jest.fn(),
    actualizar: jest.fn(),
    eliminar: jest.fn(),
    getSaldo: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TercerosController],
      providers: [
        {
          provide: TercerosService,
          useValue: mockTercerosService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<TercerosController>(TercerosController);
    service = module.get<TercerosService>(TercerosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /terceros - crear', () => {
    it('should create a new tercero', async () => {
      // Arrange
      const dto: CrearTerceroDto = {
        nombre: 'Juan Pérez',
        direccion: 'Av. Siempre Viva 742',
        tipo: TipoTercero.CLIENTE,
      };

      mockTercerosService.crear.mockResolvedValue(mockTerceroResponse);

      // Act
      const result = await controller.crear(dto, mockRequest);

      // Assert
      expect(service.crear).toHaveBeenCalledWith(dto, mockEmpresaId);
      expect(service.crear).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockTerceroResponse);
    });

    it('should create a tercero without optional direccion', async () => {
      // Arrange
      const dto: CrearTerceroDto = {
        nombre: 'María López',
        tipo: TipoTercero.PROVEEDOR,
      };

      const responseWithoutDireccion = {
        ...mockTerceroResponse,
        nombre: 'María López',
        direccion: null,
        tipo: TipoTercero.PROVEEDOR,
      };

      mockTercerosService.crear.mockResolvedValue(responseWithoutDireccion);

      // Act
      const result = await controller.crear(dto, mockRequest);

      // Assert
      expect(service.crear).toHaveBeenCalledWith(dto, mockEmpresaId);
      expect(result).toEqual(responseWithoutDireccion);
    });

    it('should extract empresaId from req.user', async () => {
      // Arrange
      const dto: CrearTerceroDto = {
        nombre: 'Test Tercero',
        tipo: TipoTercero.CLIENTE,
      };

      mockTercerosService.crear.mockResolvedValue(mockTerceroResponse);

      // Act
      await controller.crear(dto, mockRequest);

      // Assert
      const [[, empresaId]] = mockTercerosService.crear.mock.calls;
      expect(empresaId).toBe(mockEmpresaId);
    });
  });

  describe('GET /terceros - listar', () => {
    it('should return all terceros without filters', async () => {
      // Arrange
      const query: ListarTercerosQueryDto = {};
      const mockTerceros = [mockTerceroResponse];

      mockTercerosService.listar.mockResolvedValue(mockTerceros);

      // Act
      const result = await controller.listar(query, mockRequest);

      // Assert
      expect(service.listar).toHaveBeenCalledWith(query, mockEmpresaId);
      expect(service.listar).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockTerceros);
    });

    it('should return terceros filtered by tipo', async () => {
      // Arrange
      const query: ListarTercerosQueryDto = {
        tipo: TipoTercero.CLIENTE,
      };
      const mockTerceros = [mockTerceroResponse];

      mockTercerosService.listar.mockResolvedValue(mockTerceros);

      // Act
      const result = await controller.listar(query, mockRequest);

      // Assert
      expect(service.listar).toHaveBeenCalledWith(query, mockEmpresaId);
      expect(result).toEqual(mockTerceros);
    });

    it('should return terceros filtered by busqueda', async () => {
      // Arrange
      const query: ListarTercerosQueryDto = {
        busqueda: 'Juan',
      };
      const mockTerceros = [mockTerceroResponse];

      mockTercerosService.listar.mockResolvedValue(mockTerceros);

      // Act
      const result = await controller.listar(query, mockRequest);

      // Assert
      expect(service.listar).toHaveBeenCalledWith(query, mockEmpresaId);
      expect(result).toEqual(mockTerceros);
    });

    it('should return terceros filtered by tipo and busqueda', async () => {
      // Arrange
      const query: ListarTercerosQueryDto = {
        tipo: TipoTercero.CLIENTE,
        busqueda: 'Pérez',
      };
      const mockTerceros = [mockTerceroResponse];

      mockTercerosService.listar.mockResolvedValue(mockTerceros);

      // Act
      const result = await controller.listar(query, mockRequest);

      // Assert
      expect(service.listar).toHaveBeenCalledWith(query, mockEmpresaId);
      expect(result).toEqual(mockTerceros);
    });

    it('should return empty array when no terceros match filters', async () => {
      // Arrange
      const query: ListarTercerosQueryDto = {
        busqueda: 'NoExiste',
      };

      mockTercerosService.listar.mockResolvedValue([]);

      // Act
      const result = await controller.listar(query, mockRequest);

      // Assert
      expect(service.listar).toHaveBeenCalledWith(query, mockEmpresaId);
      expect(result).toEqual([]);
    });

    it('should extract empresaId from req.user', async () => {
      // Arrange
      const query: ListarTercerosQueryDto = {};
      mockTercerosService.listar.mockResolvedValue([]);

      // Act
      await controller.listar(query, mockRequest);

      // Assert
      const [[, empresaId]] = mockTercerosService.listar.mock.calls;
      expect(empresaId).toBe(mockEmpresaId);
    });
  });

  describe('GET /terceros/:id - obtenerPorId', () => {
    it('should return a tercero by id', async () => {
      // Arrange
      mockTercerosService.obtenerPorId.mockResolvedValue(mockTerceroResponse);

      // Act
      const result = await controller.obtenerPorId(mockTerceroId, mockRequest);

      // Assert
      expect(service.obtenerPorId).toHaveBeenCalledWith(
        mockTerceroId,
        mockEmpresaId,
      );
      expect(service.obtenerPorId).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockTerceroResponse);
    });

    it('should pass the correct id parameter', async () => {
      // Arrange
      const customId = 'custom-tercero-id-789';
      mockTercerosService.obtenerPorId.mockResolvedValue(mockTerceroResponse);

      // Act
      await controller.obtenerPorId(customId, mockRequest);

      // Assert
      const [[id]] = mockTercerosService.obtenerPorId.mock.calls;
      expect(id).toBe(customId);
    });

    it('should extract empresaId from req.user', async () => {
      // Arrange
      mockTercerosService.obtenerPorId.mockResolvedValue(mockTerceroResponse);

      // Act
      await controller.obtenerPorId(mockTerceroId, mockRequest);

      // Assert
      const [[, empresaId]] = mockTercerosService.obtenerPorId.mock.calls;
      expect(empresaId).toBe(mockEmpresaId);
    });
  });

  describe('PATCH /terceros/:id - actualizar', () => {
    it('should update a tercero with all fields', async () => {
      // Arrange
      const dto: ActualizarTerceroDto = {
        nombre: 'Juan Pérez Actualizado',
        direccion: 'Calle Nueva 123',
        tipo: TipoTercero.PROVEEDOR,
      };

      const updatedResponse = {
        ...mockTerceroResponse,
        ...dto,
      };

      mockTercerosService.actualizar.mockResolvedValue(updatedResponse);

      // Act
      const result = await controller.actualizar(
        mockTerceroId,
        dto,
        mockRequest,
      );

      // Assert
      expect(service.actualizar).toHaveBeenCalledWith(
        mockTerceroId,
        dto,
        mockEmpresaId,
      );
      expect(service.actualizar).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedResponse);
    });

    it('should update a tercero with only nombre', async () => {
      // Arrange
      const dto: ActualizarTerceroDto = {
        nombre: 'Nombre Actualizado',
      };

      const updatedResponse = {
        ...mockTerceroResponse,
        nombre: dto.nombre,
      };

      mockTercerosService.actualizar.mockResolvedValue(updatedResponse);

      // Act
      const result = await controller.actualizar(
        mockTerceroId,
        dto,
        mockRequest,
      );

      // Assert
      expect(service.actualizar).toHaveBeenCalledWith(
        mockTerceroId,
        dto,
        mockEmpresaId,
      );
      expect(result).toEqual(updatedResponse);
    });

    it('should update a tercero with only direccion', async () => {
      // Arrange
      const dto: ActualizarTerceroDto = {
        direccion: 'Nueva Dirección',
      };

      const updatedResponse = {
        ...mockTerceroResponse,
        direccion: dto.direccion,
      };

      mockTercerosService.actualizar.mockResolvedValue(updatedResponse);

      // Act
      const result = await controller.actualizar(
        mockTerceroId,
        dto,
        mockRequest,
      );

      // Assert
      expect(service.actualizar).toHaveBeenCalledWith(
        mockTerceroId,
        dto,
        mockEmpresaId,
      );
      expect(result).toEqual(updatedResponse);
    });

    it('should update a tercero with only tipo', async () => {
      // Arrange
      const dto: ActualizarTerceroDto = {
        tipo: TipoTercero.PROVEEDOR,
      };

      const updatedResponse = {
        ...mockTerceroResponse,
        tipo: dto.tipo,
      };

      mockTercerosService.actualizar.mockResolvedValue(updatedResponse);

      // Act
      const result = await controller.actualizar(
        mockTerceroId,
        dto,
        mockRequest,
      );

      // Assert
      expect(service.actualizar).toHaveBeenCalledWith(
        mockTerceroId,
        dto,
        mockEmpresaId,
      );
      expect(result).toEqual(updatedResponse);
    });

    it('should pass the correct id parameter', async () => {
      // Arrange
      const customId = 'custom-id-999';
      const dto: ActualizarTerceroDto = {
        nombre: 'Test',
      };

      mockTercerosService.actualizar.mockResolvedValue(mockTerceroResponse);

      // Act
      await controller.actualizar(customId, dto, mockRequest);

      // Assert
      const [[id]] = mockTercerosService.actualizar.mock.calls;
      expect(id).toBe(customId);
    });

    it('should extract empresaId from req.user', async () => {
      // Arrange
      const dto: ActualizarTerceroDto = {
        nombre: 'Test',
      };

      mockTercerosService.actualizar.mockResolvedValue(mockTerceroResponse);

      // Act
      await controller.actualizar(mockTerceroId, dto, mockRequest);

      // Assert
      const [[, , empresaId]] = mockTercerosService.actualizar.mock.calls;
      expect(empresaId).toBe(mockEmpresaId);
    });
  });

  describe('DELETE /terceros/:id - eliminar', () => {
    it('should delete a tercero', async () => {
      // Arrange
      mockTercerosService.eliminar.mockResolvedValue(undefined);

      // Act
      const result = await controller.eliminar(mockTerceroId, mockRequest);

      // Assert
      expect(service.eliminar).toHaveBeenCalledWith(
        mockTerceroId,
        mockEmpresaId,
      );
      expect(service.eliminar).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });

    it('should pass the correct id parameter', async () => {
      // Arrange
      const customId = 'to-delete-id-111';
      mockTercerosService.eliminar.mockResolvedValue(undefined);

      // Act
      await controller.eliminar(customId, mockRequest);

      // Assert
      const [[id]] = mockTercerosService.eliminar.mock.calls;
      expect(id).toBe(customId);
    });

    it('should extract empresaId from req.user', async () => {
      // Arrange
      mockTercerosService.eliminar.mockResolvedValue(undefined);

      // Act
      await controller.eliminar(mockTerceroId, mockRequest);

      // Assert
      const [[, empresaId]] = mockTercerosService.eliminar.mock.calls;
      expect(empresaId).toBe(mockEmpresaId);
    });

    it('should return void', async () => {
      // Arrange
      mockTercerosService.eliminar.mockResolvedValue(undefined);

      // Act
      const result = await controller.eliminar(mockTerceroId, mockRequest);

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('GET /terceros/:id/saldo - getSaldo', () => {
    it('should return saldo of a tercero', async () => {
      // Arrange
      mockTercerosService.getSaldo.mockResolvedValue(mockSaldoResponse);

      // Act
      const result = await controller.getSaldo(mockTerceroId, mockRequest);

      // Assert
      expect(service.getSaldo).toHaveBeenCalledWith(
        mockTerceroId,
        mockEmpresaId,
      );
      expect(service.getSaldo).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSaldoResponse);
    });

    it('should return saldo with DEUDOR status', async () => {
      // Arrange
      const deudorResponse: SaldoTerceroResponseDto = {
        clienteNombre: 'Cliente Deudor',
        saldoTotal: 500.0,
        estado: 'DEUDOR',
      };

      mockTercerosService.getSaldo.mockResolvedValue(deudorResponse);

      // Act
      const result = await controller.getSaldo(mockTerceroId, mockRequest);

      // Assert
      expect(result.estado).toBe('DEUDOR');
      expect(result.saldoTotal).toBe(500.0);
    });

    it('should return saldo with AL_DIA status', async () => {
      // Arrange
      const alDiaResponse: SaldoTerceroResponseDto = {
        clienteNombre: 'Cliente Al Día',
        saldoTotal: 0,
        estado: 'AL_DIA',
      };

      mockTercerosService.getSaldo.mockResolvedValue(alDiaResponse);

      // Act
      const result = await controller.getSaldo(mockTerceroId, mockRequest);

      // Assert
      expect(result.estado).toBe('AL_DIA');
      expect(result.saldoTotal).toBe(0);
    });

    it('should pass the correct id parameter', async () => {
      // Arrange
      const customId = 'saldo-check-id-222';
      mockTercerosService.getSaldo.mockResolvedValue(mockSaldoResponse);

      // Act
      await controller.getSaldo(customId, mockRequest);

      // Assert
      const [[id]] = mockTercerosService.getSaldo.mock.calls;
      expect(id).toBe(customId);
    });

    it('should extract empresaId from req.user', async () => {
      // Arrange
      mockTercerosService.getSaldo.mockResolvedValue(mockSaldoResponse);

      // Act
      await controller.getSaldo(mockTerceroId, mockRequest);

      // Assert
      const [[, empresaId]] = mockTercerosService.getSaldo.mock.calls;
      expect(empresaId).toBe(mockEmpresaId);
    });
  });

  describe('Integration - Request User Context', () => {
    it('should handle different empresaId values', async () => {
      // Arrange
      const differentEmpresaId = 'different-empresa-999';
      const requestWithDifferentEmpresa = {
        user: { empresaId: differentEmpresaId },
      };
      const query: ListarTercerosQueryDto = {};

      mockTercerosService.listar.mockResolvedValue([]);

      // Act
      await controller.listar(query, requestWithDifferentEmpresa);

      // Assert
      const [[, empresaId]] = mockTercerosService.listar.mock.calls;
      expect(empresaId).toBe(differentEmpresaId);
    });

    it('should consistently extract empresaId across all endpoints', async () => {
      // Arrange
      const dto: CrearTerceroDto = {
        nombre: 'Test',
        tipo: TipoTercero.CLIENTE,
      };
      const updateDto: ActualizarTerceroDto = { nombre: 'Updated' };
      const query: ListarTercerosQueryDto = {};

      mockTercerosService.crear.mockResolvedValue(mockTerceroResponse);
      mockTercerosService.listar.mockResolvedValue([]);
      mockTercerosService.obtenerPorId.mockResolvedValue(mockTerceroResponse);
      mockTercerosService.actualizar.mockResolvedValue(mockTerceroResponse);
      mockTercerosService.eliminar.mockResolvedValue(undefined);
      mockTercerosService.getSaldo.mockResolvedValue(mockSaldoResponse);

      // Act
      await controller.crear(dto, mockRequest);
      await controller.listar(query, mockRequest);
      await controller.obtenerPorId(mockTerceroId, mockRequest);
      await controller.actualizar(mockTerceroId, updateDto, mockRequest);
      await controller.eliminar(mockTerceroId, mockRequest);
      await controller.getSaldo(mockTerceroId, mockRequest);

      // Assert - All calls should have the same empresaId
      expect(mockTercerosService.crear.mock.calls[0][1]).toBe(mockEmpresaId);
      expect(mockTercerosService.listar.mock.calls[0][1]).toBe(mockEmpresaId);
      expect(mockTercerosService.obtenerPorId.mock.calls[0][1]).toBe(
        mockEmpresaId,
      );
      expect(mockTercerosService.actualizar.mock.calls[0][2]).toBe(
        mockEmpresaId,
      );
      expect(mockTercerosService.eliminar.mock.calls[0][1]).toBe(mockEmpresaId);
      expect(mockTercerosService.getSaldo.mock.calls[0][1]).toBe(mockEmpresaId);
    });
  });
});
