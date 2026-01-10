import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsService } from './analytics.service';
import { Comprobante } from '../ventas/entities/comprobante.entity';
import { Cobro } from '../ventas/entities/cobro.entity';
import { Tercero } from '../ventas/entities/tercero.entity';
import { Producto } from '../inventario/productos/entities/producto.entity';
import { TipoComprobante, EstadoPago, TipoTercero } from '../ventas/enums';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let comprobanteRepository: Repository<Comprobante>;
  let cobroRepository: Repository<Cobro>;
  let terceroRepository: Repository<Tercero>;
  let productoRepository: Repository<Producto>;

  const empresaId = 'empresa-test-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: getRepositoryToken(Comprobante),
          useValue: {
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Cobro),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Tercero),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Producto),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    comprobanteRepository = module.get<Repository<Comprobante>>(
      getRepositoryToken(Comprobante),
    );
    cobroRepository = module.get<Repository<Cobro>>(getRepositoryToken(Cobro));
    terceroRepository = module.get<Repository<Tercero>>(
      getRepositoryToken(Tercero),
    );
    productoRepository = module.get<Repository<Producto>>(
      getRepositoryToken(Producto),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getVentasMensuales', () => {
    it('should return monthly sales data with filled months', async () => {
      // Arrange
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            mes: '2026-01',
            total: '50000.00',
            cantidad: '100',
          },
          {
            mes: '2025-12',
            total: '45000.00',
            cantidad: '90',
          },
        ]),
      };

      jest
        .spyOn(comprobanteRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.getVentasMensuales(empresaId, 12);

      // Assert
      expect(result).toBeDefined();
      expect(result.meses).toHaveLength(12); // 12 meses completos
      expect(result.totalPeriodo).toBeGreaterThanOrEqual(0);
      expect(result.promedioMensual).toBeGreaterThanOrEqual(0);

      // Verificar que los meses con datos tienen valores correctos
      const enero2026 = result.meses.find((m) => m.mes === '2026-01');
      expect(enero2026).toBeDefined();
      expect(enero2026.total).toBe(50000);
      expect(enero2026.cantidad).toBe(100);
      expect(enero2026.promedio).toBe(500); // 50000 / 100

      // Verificar formato de nombres de mes
      expect(enero2026.mesNombre).toContain('Enero');
      expect(enero2026.mesNombre).toContain('2026');
    });

    it('should return all months with zero when no sales data', async () => {
      // Arrange
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      jest
        .spyOn(comprobanteRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.getVentasMensuales(empresaId, 12);

      // Assert
      expect(result.meses).toHaveLength(12);
      expect(result.totalPeriodo).toBe(0);
      expect(result.promedioMensual).toBe(0);

      // Todos los meses deben tener valores en 0
      result.meses.forEach((mes) => {
        expect(mes.total).toBe(0);
        expect(mes.cantidad).toBe(0);
        expect(mes.promedio).toBe(0);
      });
    });

    it('should calculate correct averages per month', async () => {
      // Arrange
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            mes: '2026-01',
            total: '12000.00',
            cantidad: '24', // promedio: 500
          },
        ]),
      };

      jest
        .spyOn(comprobanteRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.getVentasMensuales(empresaId, 6);

      // Assert
      const enero = result.meses.find((m) => m.mes === '2026-01');
      expect(enero.promedio).toBe(500); // 12000 / 24
    });

    it('should handle custom number of months', async () => {
      // Arrange
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      jest
        .spyOn(comprobanteRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.getVentasMensuales(empresaId, 6);

      // Assert
      expect(result.meses).toHaveLength(6);
    });

    it('should round values to 2 decimals', async () => {
      // Arrange
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            mes: '2026-01',
            total: '12345.6789',
            cantidad: '7', // promedio: 1763.66698571...
          },
        ]),
      };

      jest
        .spyOn(comprobanteRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.getVentasMensuales(empresaId, 3);

      // Assert
      const enero = result.meses.find((m) => m.mes === '2026-01');
      expect(enero.total).toBe(12345.68);
      expect(enero.promedio).toBe(1763.67); // Redondeado a 2 decimales
    });
  });

  describe('getComparativaMensual', () => {
    it('should return comparison between current and previous month', async () => {
      // Arrange
      const mockVentasBuilder: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          totalVentas: '50000.00',
          cantidadVentas: '100',
          totalPendiente: '5000.00',
        }),
      };

      const mockCobrosBuilder: any = {
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          totalCobrado: '45000.00',
        }),
      };

      jest
        .spyOn(comprobanteRepository, 'createQueryBuilder')
        .mockReturnValue(mockVentasBuilder);

      jest
        .spyOn(cobroRepository, 'createQueryBuilder')
        .mockReturnValue(mockCobrosBuilder);

      // Act
      const result = await service.getComparativaMensual(empresaId);

      // Assert
      expect(result).toBeDefined();
      expect(result.mesActual).toBeDefined();
      expect(result.mesAnterior).toBeDefined();
      expect(result.variaciones).toBeDefined();

      // Verificar estructura de métricas
      expect(result.mesActual.metricas.totalVentas).toBeDefined();
      expect(result.mesActual.metricas.cantidadVentas).toBeDefined();
      expect(result.mesActual.metricas.ticketPromedio).toBeDefined();
      expect(result.mesActual.metricas.totalCobrado).toBeDefined();
      expect(result.mesActual.metricas.totalPendiente).toBeDefined();

      // Verificar formato de nombres
      expect(result.mesActual.mesNombre).toBeTruthy();
      expect(result.mesAnterior.mesNombre).toBeTruthy();
    });

    it('should calculate variations correctly with positive growth', async () => {
      // Arrange
      let callCount = 0;
      const mockVentasBuilder: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockImplementation(() => {
          callCount++;
          // Primer llamado: mes actual con valores mayores
          if (callCount === 1) {
            return Promise.resolve({
              totalVentas: '55000.00', // +10% vs 50000
              cantidadVentas: '110', // +10% vs 100
              totalPendiente: '5000.00',
            });
          }
          // Segundo llamado: mes anterior
          return Promise.resolve({
            totalVentas: '50000.00',
            cantidadVentas: '100',
            totalPendiente: '4000.00',
          });
        }),
      };

      const mockCobrosBuilder: any = {
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          totalCobrado: '50000.00',
        }),
      };

      jest
        .spyOn(comprobanteRepository, 'createQueryBuilder')
        .mockReturnValue(mockVentasBuilder);

      jest
        .spyOn(cobroRepository, 'createQueryBuilder')
        .mockReturnValue(mockCobrosBuilder);

      // Act
      const result = await service.getComparativaMensual(empresaId);

      // Assert
      expect(result.variaciones.totalVentas).toBe(10); // Crecimiento del 10%
      expect(result.variaciones.cantidadVentas).toBe(10);
    });

    it('should handle division by zero in variations', async () => {
      // Arrange
      let callCount = 0;
      const mockVentasBuilder: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockImplementation(() => {
          callCount++;
          // Primer llamado: mes actual con ventas
          if (callCount === 1) {
            return Promise.resolve({
              totalVentas: '10000.00',
              cantidadVentas: '20',
              totalPendiente: '1000.00',
            });
          }
          // Segundo llamado: mes anterior sin ventas (0)
          return Promise.resolve({
            totalVentas: '0.00',
            cantidadVentas: '0',
            totalPendiente: '0.00',
          });
        }),
      };

      const mockCobrosBuilder: any = {
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          totalCobrado: '9000.00',
        }),
      };

      jest
        .spyOn(comprobanteRepository, 'createQueryBuilder')
        .mockReturnValue(mockVentasBuilder);

      jest
        .spyOn(cobroRepository, 'createQueryBuilder')
        .mockReturnValue(mockCobrosBuilder);

      // Act
      const result = await service.getComparativaMensual(empresaId);

      // Assert
      expect(result.variaciones.totalVentas).toBe(100); // 100% cuando anterior es 0
      expect(result.variaciones.cantidadVentas).toBe(100);
    });

    it('should accept custom month parameter', async () => {
      // Arrange
      const customMes = '2025-06';

      const mockVentasBuilder: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          totalVentas: '30000.00',
          cantidadVentas: '60',
          totalPendiente: '3000.00',
        }),
      };

      const mockCobrosBuilder: any = {
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          totalCobrado: '27000.00',
        }),
      };

      jest
        .spyOn(comprobanteRepository, 'createQueryBuilder')
        .mockReturnValue(mockVentasBuilder);

      jest
        .spyOn(cobroRepository, 'createQueryBuilder')
        .mockReturnValue(mockCobrosBuilder);

      // Act
      const result = await service.getComparativaMensual(empresaId, customMes);

      // Assert
      expect(result.mesActual.mes).toBe('2025-06');
      expect(result.mesAnterior.mes).toBe('2025-05');
      expect(result.mesActual.mesNombre).toContain('Junio');
      expect(result.mesAnterior.mesNombre).toContain('Mayo');
    });
  });

  describe('getCuentasPorCobrar', () => {
    it('should return clients with pending balances', async () => {
      // Arrange
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            clienteId: 'cliente-1',
            clienteNombre: 'Juan Pérez',
            saldoTotal: '5000.00',
            cantidadComprobantes: '3',
            comprobanteMasAntiguo: new Date('2025-11-01'),
          },
          {
            clienteId: 'cliente-2',
            clienteNombre: 'María García',
            saldoTotal: '3500.00',
            cantidadComprobantes: '2',
            comprobanteMasAntiguo: new Date('2025-12-01'),
          },
        ]),
      };

      jest
        .spyOn(terceroRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.getCuentasPorCobrar(empresaId, 10, false);

      // Assert
      expect(result).toBeDefined();
      expect(result.clientesMorosos).toHaveLength(2);
      expect(result.totalGeneral).toBe(8500); // 5000 + 3500
      expect(result.cantidadClientes).toBe(2);
      expect(result.promedioDeuda).toBe(4250); // 8500 / 2

      // Verificar primer cliente
      const primerCliente = result.clientesMorosos[0];
      expect(primerCliente.clienteNombre).toBe('Juan Pérez');
      expect(primerCliente.saldoTotal).toBe(5000);
      expect(primerCliente.cantidadComprobantes).toBe(3);
      expect(primerCliente.diasVencimiento).toBeGreaterThan(0);
    });

    it('should return empty array when no clients with debt', async () => {
      // Arrange
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      jest
        .spyOn(terceroRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.getCuentasPorCobrar(empresaId, 10, false);

      // Assert
      expect(result.clientesMorosos).toHaveLength(0);
      expect(result.totalGeneral).toBe(0);
      expect(result.cantidadClientes).toBe(0);
      expect(result.promedioDeuda).toBe(0);
    });

    it('should respect limit parameter', async () => {
      // Arrange
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            clienteId: 'cliente-1',
            clienteNombre: 'Cliente 1',
            saldoTotal: '1000.00',
            cantidadComprobantes: '1',
            comprobanteMasAntiguo: new Date(),
          },
        ]),
      };

      jest
        .spyOn(terceroRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder);

      // Act
      await service.getCuentasPorCobrar(empresaId, 5, false);

      // Assert
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(5);
    });

    it('should include all clients when incluirTodos is true', async () => {
      // Arrange
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      jest
        .spyOn(terceroRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder);

      // Act
      await service.getCuentasPorCobrar(empresaId, 10, true);

      // Assert
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(undefined);
    });

    it('should calculate days of aging correctly', async () => {
      // Arrange
      const fechaAntigua = new Date();
      fechaAntigua.setDate(fechaAntigua.getDate() - 60); // 60 días atrás

      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            clienteId: 'cliente-1',
            clienteNombre: 'Cliente Moroso',
            saldoTotal: '2000.00',
            cantidadComprobantes: '2',
            comprobanteMasAntiguo: fechaAntigua,
          },
        ]),
      };

      jest
        .spyOn(terceroRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.getCuentasPorCobrar(empresaId, 10, false);

      // Assert
      expect(result.clientesMorosos[0].diasVencimiento).toBeGreaterThanOrEqual(
        59,
      );
      expect(result.clientesMorosos[0].diasVencimiento).toBeLessThanOrEqual(61);
    });
  });

  describe('getStockCritico', () => {
    it('should return products with critical stock', async () => {
      // Arrange
      const mockProductos = [
        {
          id: 'prod-1',
          nombre: 'Producto A',
          codigoBarras: '123456',
          stockActual: 5,
          stockMinimo: 10,
          eliminado: false,
          categoria: {
            id: 'cat-1',
            nombre: 'Categoría A',
          },
        },
        {
          id: 'prod-2',
          nombre: 'Producto B',
          codigoBarras: '789012',
          stockActual: 2,
          stockMinimo: 15,
          eliminado: false,
          categoria: {
            id: 'cat-2',
            nombre: 'Categoría B',
          },
        },
      ];

      const mockQueryBuilder: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockProductos),
      };

      jest
        .spyOn(productoRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.getStockCritico(empresaId, 20, 'deficit');

      // Assert
      expect(result).toBeDefined();
      expect(result.productos).toHaveLength(2);
      expect(result.totalProductosCriticos).toBe(2);
      expect(result.totalDeficit).toBe(18); // (10-5) + (15-2)

      // Verificar primer producto
      const producto1 = result.productos[0];
      expect(producto1.nombre).toBe('Producto A');
      expect(producto1.stockActual).toBe(5);
      expect(producto1.stockMinimo).toBe(10);
      expect(producto1.deficit).toBe(5);
      expect(producto1.categoria).toBeDefined();
      expect(producto1.categoria.nombre).toBe('Categoría A');
    });

    it('should return empty array when no critical stock', async () => {
      // Arrange
      const mockQueryBuilder: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      jest
        .spyOn(productoRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.getStockCritico(empresaId, 20, 'deficit');

      // Assert
      expect(result.productos).toHaveLength(0);
      expect(result.totalProductosCriticos).toBe(0);
      expect(result.totalDeficit).toBe(0);
    });

    it('should order by deficit when ordenarPor is "deficit"', async () => {
      // Arrange
      const mockQueryBuilder: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      jest
        .spyOn(productoRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder);

      // Act
      await service.getStockCritico(empresaId, 20, 'deficit');

      // Assert
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        '(p.stockMinimo - p.stockActual)',
        'DESC',
      );
    });

    it('should order alphabetically when ordenarPor is "alfabetico"', async () => {
      // Arrange
      const mockQueryBuilder: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      jest
        .spyOn(productoRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder);

      // Act
      await service.getStockCritico(empresaId, 20, 'alfabetico');

      // Assert
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('p.nombre', 'ASC');
    });

    it('should respect limit parameter', async () => {
      // Arrange
      const mockQueryBuilder: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      jest
        .spyOn(productoRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder);

      // Act
      await service.getStockCritico(empresaId, 10, 'deficit');

      // Assert
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
    });

    it('should handle products without category', async () => {
      // Arrange
      const mockProductos = [
        {
          id: 'prod-1',
          nombre: 'Producto Sin Categoría',
          codigoBarras: '999999',
          stockActual: 0,
          stockMinimo: 5,
          eliminado: false,
          categoria: null,
        },
      ];

      const mockQueryBuilder: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockProductos),
      };

      jest
        .spyOn(productoRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.getStockCritico(empresaId, 20, 'deficit');

      // Assert
      expect(result.productos).toHaveLength(1);
      expect(result.productos[0].categoria).toBeNull();
    });
  });
});
