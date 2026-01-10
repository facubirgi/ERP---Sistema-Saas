import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import {
  VentasMensualesResponseDto,
  ComparativaMensualResponseDto,
  CuentasPorCobrarResponseDto,
  StockCriticoResponseDto,
} from './dto';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: AnalyticsService;

  const mockRequest = {
    user: {
      empresaId: 'empresa-test-123',
      userId: 'user-test-123',
      email: 'test@example.com',
    },
  } as any;

  const mockVentasMensualesResponse: VentasMensualesResponseDto = {
    meses: [
      {
        mes: '2026-01',
        mesNombre: 'Enero 2026',
        total: 50000,
        cantidad: 100,
        promedio: 500,
      },
    ],
    totalPeriodo: 50000,
    promedioMensual: 50000,
  };

  const mockComparativaResponse: ComparativaMensualResponseDto = {
    mesActual: {
      mes: '2026-01',
      mesNombre: 'Enero 2026',
      metricas: {
        totalVentas: 50000,
        cantidadVentas: 100,
        ticketPromedio: 500,
        totalCobrado: 45000,
        totalPendiente: 5000,
      },
    },
    mesAnterior: {
      mes: '2025-12',
      mesNombre: 'Diciembre 2025',
      metricas: {
        totalVentas: 45000,
        cantidadVentas: 90,
        ticketPromedio: 500,
        totalCobrado: 40000,
        totalPendiente: 5000,
      },
    },
    variaciones: {
      totalVentas: 11.11,
      cantidadVentas: 11.11,
      ticketPromedio: 0,
      totalCobrado: 12.5,
    },
  };

  const mockCuentasPorCobrarResponse: CuentasPorCobrarResponseDto = {
    totalGeneral: 15000,
    cantidadClientes: 5,
    clientesMorosos: [
      {
        clienteId: 'cliente-1',
        clienteNombre: 'Juan Pérez',
        saldoTotal: 5000,
        cantidadComprobantes: 2,
        comprobanteMasAntiguo: new Date().toISOString(),
        diasVencimiento: 30,
      },
    ],
    promedioDeuda: 3000,
  };

  const mockStockCriticoResponse: StockCriticoResponseDto = {
    productos: [
      {
        id: 'prod-1',
        nombre: 'Producto A',
        codigoBarras: '123456',
        stockActual: 5,
        stockMinimo: 10,
        deficit: 5,
        categoria: {
          id: 'cat-1',
          nombre: 'Categoría A',
        },
      },
    ],
    totalProductosCriticos: 1,
    totalDeficit: 5,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: {
            getVentasMensuales: jest.fn(),
            getComparativaMensual: jest.fn(),
            getCuentasPorCobrar: jest.fn(),
            getStockCritico: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    service = module.get<AnalyticsService>(AnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getVentasMensuales', () => {
    it('should return monthly sales data with default months', async () => {
      // Arrange
      jest
        .spyOn(service, 'getVentasMensuales')
        .mockResolvedValue(mockVentasMensualesResponse);

      // Act
      const result = await controller.getVentasMensuales(mockRequest);

      // Assert
      expect(result).toEqual(mockVentasMensualesResponse);
      expect(service.getVentasMensuales).toHaveBeenCalledWith(
        'empresa-test-123',
        12,
      );
    });

    it('should return monthly sales data with custom months', async () => {
      // Arrange
      jest
        .spyOn(service, 'getVentasMensuales')
        .mockResolvedValue(mockVentasMensualesResponse);

      // Act
      const result = await controller.getVentasMensuales(mockRequest, 6);

      // Assert
      expect(result).toEqual(mockVentasMensualesResponse);
      expect(service.getVentasMensuales).toHaveBeenCalledWith(
        'empresa-test-123',
        6,
      );
    });

    it('should use default value when 0 is passed (0 is falsy)', async () => {
      // Arrange
      jest
        .spyOn(service, 'getVentasMensuales')
        .mockResolvedValue(mockVentasMensualesResponse);

      // Act
      await controller.getVentasMensuales(mockRequest, 0);

      // Assert - 0 is falsy, so meses || 12 evaluates to 12
      expect(service.getVentasMensuales).toHaveBeenCalledWith(
        'empresa-test-123',
        12,
      );
    });

    it('should validate months parameter - reject greater than 24', async () => {
      // Act & Assert
      await expect(
        controller.getVentasMensuales(mockRequest, 25),
      ).rejects.toThrow(BadRequestException);

      await expect(
        controller.getVentasMensuales(mockRequest, 25),
      ).rejects.toThrow('La cantidad de meses debe estar entre 1 y 24');
    });

    it('should accept valid months values (1-24)', async () => {
      // Arrange
      jest
        .spyOn(service, 'getVentasMensuales')
        .mockResolvedValue(mockVentasMensualesResponse);

      // Act & Assert
      await expect(
        controller.getVentasMensuales(mockRequest, 1),
      ).resolves.toBeDefined();

      await expect(
        controller.getVentasMensuales(mockRequest, 12),
      ).resolves.toBeDefined();

      await expect(
        controller.getVentasMensuales(mockRequest, 24),
      ).resolves.toBeDefined();
    });
  });

  describe('getComparativaMensual', () => {
    it('should return comparison data without month parameter', async () => {
      // Arrange
      jest
        .spyOn(service, 'getComparativaMensual')
        .mockResolvedValue(mockComparativaResponse);

      // Act
      const result = await controller.getComparativaMensual(mockRequest);

      // Assert
      expect(result).toEqual(mockComparativaResponse);
      expect(service.getComparativaMensual).toHaveBeenCalledWith(
        'empresa-test-123',
        undefined,
      );
    });

    it('should return comparison data with valid month parameter', async () => {
      // Arrange
      jest
        .spyOn(service, 'getComparativaMensual')
        .mockResolvedValue(mockComparativaResponse);

      // Act
      const result = await controller.getComparativaMensual(
        mockRequest,
        '2025-06',
      );

      // Assert
      expect(result).toEqual(mockComparativaResponse);
      expect(service.getComparativaMensual).toHaveBeenCalledWith(
        'empresa-test-123',
        '2025-06',
      );
    });

    it('should validate month format - reject invalid format', async () => {
      // Act & Assert
      await expect(
        controller.getComparativaMensual(mockRequest, '2025-6'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        controller.getComparativaMensual(mockRequest, '2025-6'),
      ).rejects.toThrow('Formato de mes inválido. Use YYYY-MM (ej: 2026-01)');

      await expect(
        controller.getComparativaMensual(mockRequest, '25-06'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        controller.getComparativaMensual(mockRequest, 'invalid'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate month format - reject invalid month number', async () => {
      // Act & Assert
      await expect(
        controller.getComparativaMensual(mockRequest, '2025-13'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        controller.getComparativaMensual(mockRequest, '2025-00'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept valid month formats', async () => {
      // Arrange
      jest
        .spyOn(service, 'getComparativaMensual')
        .mockResolvedValue(mockComparativaResponse);

      // Act & Assert
      await expect(
        controller.getComparativaMensual(mockRequest, '2025-01'),
      ).resolves.toBeDefined();

      await expect(
        controller.getComparativaMensual(mockRequest, '2025-06'),
      ).resolves.toBeDefined();

      await expect(
        controller.getComparativaMensual(mockRequest, '2025-12'),
      ).resolves.toBeDefined();
    });
  });

  describe('getCuentasPorCobrar', () => {
    it('should return accounts receivable with default parameters', async () => {
      // Arrange
      jest
        .spyOn(service, 'getCuentasPorCobrar')
        .mockResolvedValue(mockCuentasPorCobrarResponse);

      // Act
      const result = await controller.getCuentasPorCobrar(mockRequest);

      // Assert
      expect(result).toEqual(mockCuentasPorCobrarResponse);
      expect(service.getCuentasPorCobrar).toHaveBeenCalledWith(
        'empresa-test-123',
        10,
        false,
      );
    });

    it('should return accounts receivable with custom limit', async () => {
      // Arrange
      jest
        .spyOn(service, 'getCuentasPorCobrar')
        .mockResolvedValue(mockCuentasPorCobrarResponse);

      // Act
      const result = await controller.getCuentasPorCobrar(
        mockRequest,
        20,
        undefined,
      );

      // Assert
      expect(result).toEqual(mockCuentasPorCobrarResponse);
      expect(service.getCuentasPorCobrar).toHaveBeenCalledWith(
        'empresa-test-123',
        20,
        false,
      );
    });

    it('should return all accounts when incluirTodos is true', async () => {
      // Arrange
      jest
        .spyOn(service, 'getCuentasPorCobrar')
        .mockResolvedValue(mockCuentasPorCobrarResponse);

      // Act
      const result = await controller.getCuentasPorCobrar(
        mockRequest,
        10,
        'true',
      );

      // Assert
      expect(result).toEqual(mockCuentasPorCobrarResponse);
      expect(service.getCuentasPorCobrar).toHaveBeenCalledWith(
        'empresa-test-123',
        10,
        true,
      );
    });

    it('should treat incluirTodos as false when not "true"', async () => {
      // Arrange
      jest
        .spyOn(service, 'getCuentasPorCobrar')
        .mockResolvedValue(mockCuentasPorCobrarResponse);

      // Act
      await controller.getCuentasPorCobrar(mockRequest, 10, 'false');
      await controller.getCuentasPorCobrar(mockRequest, 10, 'anything');

      // Assert
      expect(service.getCuentasPorCobrar).toHaveBeenCalledWith(
        'empresa-test-123',
        10,
        false,
      );
    });

    it('should use default value when 0 is passed (0 is falsy)', async () => {
      // Arrange
      jest
        .spyOn(service, 'getCuentasPorCobrar')
        .mockResolvedValue(mockCuentasPorCobrarResponse);

      // Act
      await controller.getCuentasPorCobrar(mockRequest, 0);

      // Assert - 0 is falsy, so limit || 10 evaluates to 10
      expect(service.getCuentasPorCobrar).toHaveBeenCalledWith(
        'empresa-test-123',
        10,
        false,
      );
    });

    it('should validate limit parameter - reject greater than 100', async () => {
      // Act & Assert
      await expect(
        controller.getCuentasPorCobrar(mockRequest, 101),
      ).rejects.toThrow(BadRequestException);

      await expect(
        controller.getCuentasPorCobrar(mockRequest, 101),
      ).rejects.toThrow('El límite debe estar entre 1 y 100');
    });

    it('should accept valid limit values (1-100)', async () => {
      // Arrange
      jest
        .spyOn(service, 'getCuentasPorCobrar')
        .mockResolvedValue(mockCuentasPorCobrarResponse);

      // Act & Assert
      await expect(
        controller.getCuentasPorCobrar(mockRequest, 1),
      ).resolves.toBeDefined();

      await expect(
        controller.getCuentasPorCobrar(mockRequest, 50),
      ).resolves.toBeDefined();

      await expect(
        controller.getCuentasPorCobrar(mockRequest, 100),
      ).resolves.toBeDefined();
    });
  });

  describe('getStockCritico', () => {
    it('should return critical stock with default parameters', async () => {
      // Arrange
      jest
        .spyOn(service, 'getStockCritico')
        .mockResolvedValue(mockStockCriticoResponse);

      // Act
      const result = await controller.getStockCritico(mockRequest);

      // Assert
      expect(result).toEqual(mockStockCriticoResponse);
      expect(service.getStockCritico).toHaveBeenCalledWith(
        'empresa-test-123',
        20,
        'deficit',
      );
    });

    it('should return critical stock with custom limit', async () => {
      // Arrange
      jest
        .spyOn(service, 'getStockCritico')
        .mockResolvedValue(mockStockCriticoResponse);

      // Act
      const result = await controller.getStockCritico(
        mockRequest,
        50,
        undefined,
      );

      // Assert
      expect(result).toEqual(mockStockCriticoResponse);
      expect(service.getStockCritico).toHaveBeenCalledWith(
        'empresa-test-123',
        50,
        'deficit',
      );
    });

    it('should return critical stock ordered alphabetically', async () => {
      // Arrange
      jest
        .spyOn(service, 'getStockCritico')
        .mockResolvedValue(mockStockCriticoResponse);

      // Act
      const result = await controller.getStockCritico(
        mockRequest,
        20,
        'alfabetico',
      );

      // Assert
      expect(result).toEqual(mockStockCriticoResponse);
      expect(service.getStockCritico).toHaveBeenCalledWith(
        'empresa-test-123',
        20,
        'alfabetico',
      );
    });

    it('should default to deficit ordering for invalid ordenarPor', async () => {
      // Arrange
      jest
        .spyOn(service, 'getStockCritico')
        .mockResolvedValue(mockStockCriticoResponse);

      // Act
      const result = await controller.getStockCritico(
        mockRequest,
        20,
        'invalid' as any,
      );

      // Assert
      expect(result).toEqual(mockStockCriticoResponse);
      expect(service.getStockCritico).toHaveBeenCalledWith(
        'empresa-test-123',
        20,
        'deficit',
      );
    });

    it('should use default value when 0 is passed (0 is falsy)', async () => {
      // Arrange
      jest
        .spyOn(service, 'getStockCritico')
        .mockResolvedValue(mockStockCriticoResponse);

      // Act
      await controller.getStockCritico(mockRequest, 0);

      // Assert - 0 is falsy, so limit || 20 evaluates to 20
      expect(service.getStockCritico).toHaveBeenCalledWith(
        'empresa-test-123',
        20,
        'deficit',
      );
    });

    it('should validate limit parameter - reject greater than 100', async () => {
      // Act & Assert
      await expect(
        controller.getStockCritico(mockRequest, 101),
      ).rejects.toThrow(BadRequestException);

      await expect(
        controller.getStockCritico(mockRequest, 101),
      ).rejects.toThrow('El límite debe estar entre 1 y 100');
    });

    it('should accept valid limit values (1-100)', async () => {
      // Arrange
      jest
        .spyOn(service, 'getStockCritico')
        .mockResolvedValue(mockStockCriticoResponse);

      // Act & Assert
      await expect(
        controller.getStockCritico(mockRequest, 1),
      ).resolves.toBeDefined();

      await expect(
        controller.getStockCritico(mockRequest, 50),
      ).resolves.toBeDefined();

      await expect(
        controller.getStockCritico(mockRequest, 100),
      ).resolves.toBeDefined();
    });
  });

  describe('empresaId extraction', () => {
    it('should extract empresaId from request.user in all endpoints', async () => {
      // Arrange
      const customRequest = {
        user: {
          empresaId: 'custom-empresa-456',
          userId: 'user-456',
          email: 'custom@example.com',
        },
      } as any;

      jest
        .spyOn(service, 'getVentasMensuales')
        .mockResolvedValue(mockVentasMensualesResponse);
      jest
        .spyOn(service, 'getComparativaMensual')
        .mockResolvedValue(mockComparativaResponse);
      jest
        .spyOn(service, 'getCuentasPorCobrar')
        .mockResolvedValue(mockCuentasPorCobrarResponse);
      jest
        .spyOn(service, 'getStockCritico')
        .mockResolvedValue(mockStockCriticoResponse);

      // Act
      await controller.getVentasMensuales(customRequest);
      await controller.getComparativaMensual(customRequest);
      await controller.getCuentasPorCobrar(customRequest);
      await controller.getStockCritico(customRequest);

      // Assert
      expect(service.getVentasMensuales).toHaveBeenCalledWith(
        'custom-empresa-456',
        expect.any(Number),
      );
      expect(service.getComparativaMensual).toHaveBeenCalledWith(
        'custom-empresa-456',
        undefined,
      );
      expect(service.getCuentasPorCobrar).toHaveBeenCalledWith(
        'custom-empresa-456',
        expect.any(Number),
        expect.any(Boolean),
      );
      expect(service.getStockCritico).toHaveBeenCalledWith(
        'custom-empresa-456',
        expect.any(Number),
        expect.any(String),
      );
    });
  });
});
