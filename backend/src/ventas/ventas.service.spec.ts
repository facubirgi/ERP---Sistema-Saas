import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner, EntityManager } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { VentasService } from './ventas.service';
import { Tercero } from './entities/tercero.entity';
import { Comprobante } from './entities/comprobante.entity';
import { ComprobanteDetalle } from './entities/comprobante-detalle.entity';
import { Cobro } from './entities/cobro.entity';
import { Producto } from '../inventario/productos/entities/producto.entity';
import { TipoTercero, TipoComprobante, EstadoPago, MetodoPago } from './enums';
import {
  CrearVentaDto,
  RegistrarCobroDto,
  ActualizarCobroDto,
  ActualizarComprobanteDto,
  ListarVentasQueryDto,
} from './dto';
import { CajaService } from '../caja/caja.service';

describe('VentasService', () => {
  let service: VentasService;
  let terceroRepository: Repository<Tercero>;
  let comprobanteRepository: Repository<Comprobante>;
  let comprobanteDetalleRepository: Repository<ComprobanteDetalle>;
  let cobroRepository: Repository<Cobro>;
  let productoRepository: Repository<Producto>;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;
  let manager: EntityManager;

  const empresaId = 'empresa-123';

  // Mock Data
  const mockCliente: Tercero = {
    id: 'cliente-123',
    nombre: 'Juan Perez',
    identificacion: '12345678',
    email: 'juan@example.com',
    telefono: '1234567890',
    tipo: TipoTercero.CLIENTE,
    saldoActual: 0,
    empresaId,
    eliminado: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    comprobantes: [],
  };

  const mockProducto: Producto = {
    id: 'producto-123',
    codigo: 'PROD-001',
    nombre: 'Producto Test',
    descripcion: 'Descripcion test',
    stockActual: 100,
    stockMinimo: 10,
    precioVenta: 50,
    empresaId,
    eliminado: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    compras: [],
    comprobanteDetalles: [],
  };

  const mockComprobante: Comprobante = {
    id: 'comprobante-123',
    tipo: TipoComprobante.VENTA,
    total: 100,
    saldoPendiente: 50,
    estadoPago: EstadoPago.PARCIAL,
    terceroId: 'cliente-123',
    empresaId,
    eliminado: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    tercero: mockCliente,
    detalles: [],
    cobros: [],
  };

  const mockCobro: Cobro = {
    id: 'cobro-123',
    monto: 50,
    fecha: new Date(),
    metodo: MetodoPago.EFECTIVO,
    comprobanteId: 'comprobante-123',
    empresaId,
    createdAt: new Date(),
    updatedAt: new Date(),
    comprobante: mockComprobante,
  };

  beforeEach(async () => {
    // Mock QueryRunner
    const mockQueryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        getRepository: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
      },
    };

    queryRunner = mockQueryRunner as unknown as QueryRunner;
    manager = mockQueryRunner.manager as unknown as EntityManager;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VentasService,
        {
          provide: getRepositoryToken(Tercero),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            increment: jest.fn(),
            decrement: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Comprobante),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ComprobanteDetalle),
          useValue: {
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Cobro),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Producto),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(queryRunner),
          },
        },
        {
          provide: CajaService,
          useValue: {
            registrarMovimiento: jest.fn().mockResolvedValue(undefined),
            obtenerSesionActiva: jest
              .fn()
              .mockResolvedValue({ id: 'sesion-123' }),
          },
        },
      ],
    }).compile();

    service = module.get<VentasService>(VentasService);
    terceroRepository = module.get<Repository<Tercero>>(
      getRepositoryToken(Tercero),
    );
    comprobanteRepository = module.get<Repository<Comprobante>>(
      getRepositoryToken(Comprobante),
    );
    comprobanteDetalleRepository = module.get<Repository<ComprobanteDetalle>>(
      getRepositoryToken(ComprobanteDetalle),
    );
    cobroRepository = module.get<Repository<Cobro>>(getRepositoryToken(Cobro));
    productoRepository = module.get<Repository<Producto>>(
      getRepositoryToken(Producto),
    );
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('crearVenta', () => {
    const crearVentaDto: CrearVentaDto = {
      clienteId: 'cliente-123',
      items: [
        {
          productoId: 'producto-123',
          cantidad: 2,
          precioUnitario: 50,
        },
      ],
      montoPagado: 100,
      metodoPago: MetodoPago.EFECTIVO,
    };

    it('should create a sale with full payment successfully', async () => {
      // Arrange
      const mockComprobanteCreado = {
        ...mockComprobante,
        id: 'new-comprobante',
        total: 100,
        saldoPendiente: 0,
        estadoPago: EstadoPago.PAGADO,
      };

      const mockCobroCreado = {
        ...mockCobro,
        id: 'new-cobro',
        monto: 100,
      };

      // Setup mocks for QueryRunner
      const mockTerceroRepo = {
        findOne: jest.fn().mockResolvedValue(mockCliente),
        increment: jest.fn().mockResolvedValue(undefined),
      };

      const mockComprobanteRepo = {
        create: jest.fn().mockReturnValue(mockComprobanteCreado),
        save: jest.fn().mockResolvedValue(mockComprobanteCreado),
      };

      const mockCobroRepo = {
        create: jest.fn().mockReturnValue(mockCobroCreado),
        save: jest.fn().mockResolvedValue(mockCobroCreado),
      };

      (manager.getRepository as jest.Mock).mockImplementation((entity) => {
        if (entity === Tercero) return mockTerceroRepo;
        if (entity === Comprobante) return mockComprobanteRepo;
        if (entity === Cobro) return mockCobroRepo;
      });

      (manager.findOne as jest.Mock).mockResolvedValue({
        ...mockProducto,
        stockActual: 100,
      });

      (manager.create as jest.Mock).mockImplementation((entity, data) => data);
      (manager.save as jest.Mock).mockImplementation((entity, data) =>
        Promise.resolve(data),
      );

      // Act
      const result = await service.crearVenta(crearVentaDto, empresaId);

      // Assert
      expect(result).toBeDefined();
      expect(result.comprobante.total).toBe(100);
      expect(result.comprobante.saldoPendiente).toBe(0);
      expect(result.comprobante.estadoPago).toBe(EstadoPago.PAGADO);
      expect(result.cobro).toBeDefined();
      expect(result.cobro.monto).toBe(100);
      expect(result.mensaje).toContain('Pago completo');
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should create a sale with partial payment successfully', async () => {
      // Arrange
      const dtoPartial: CrearVentaDto = {
        ...crearVentaDto,
        montoPagado: 50,
      };

      const mockComprobanteCreado = {
        ...mockComprobante,
        id: 'new-comprobante',
        total: 100,
        saldoPendiente: 50,
        estadoPago: EstadoPago.PARCIAL,
      };

      const mockCobroCreado = {
        ...mockCobro,
        id: 'new-cobro',
        monto: 50,
      };

      // Setup mocks
      const mockTerceroRepo = {
        findOne: jest.fn().mockResolvedValue(mockCliente),
        increment: jest.fn().mockResolvedValue(undefined),
      };

      const mockComprobanteRepo = {
        create: jest.fn().mockReturnValue(mockComprobanteCreado),
        save: jest.fn().mockResolvedValue(mockComprobanteCreado),
      };

      const mockCobroRepo = {
        create: jest.fn().mockReturnValue(mockCobroCreado),
        save: jest.fn().mockResolvedValue(mockCobroCreado),
      };

      (manager.getRepository as jest.Mock).mockImplementation((entity) => {
        if (entity === Tercero) return mockTerceroRepo;
        if (entity === Comprobante) return mockComprobanteRepo;
        if (entity === Cobro) return mockCobroRepo;
      });

      (manager.findOne as jest.Mock).mockResolvedValue({
        ...mockProducto,
        stockActual: 100,
      });

      (manager.create as jest.Mock).mockImplementation((entity, data) => data);
      (manager.save as jest.Mock).mockImplementation((entity, data) =>
        Promise.resolve(data),
      );

      // Act
      const result = await service.crearVenta(dtoPartial, empresaId);

      // Assert
      expect(result.comprobante.saldoPendiente).toBe(50);
      expect(result.comprobante.estadoPago).toBe(EstadoPago.PARCIAL);
      expect(result.mensaje).toContain('Saldo pendiente: $50.00');
      expect(mockTerceroRepo.increment).toHaveBeenCalledWith(
        { id: 'cliente-123' },
        'saldoActual',
        50,
      );
    });

    it('should create a sale with no payment (pending)', async () => {
      // Arrange
      const dtoPending: CrearVentaDto = {
        ...crearVentaDto,
        montoPagado: 0,
        metodoPago: undefined,
      };

      const mockComprobanteCreado = {
        ...mockComprobante,
        id: 'new-comprobante',
        total: 100,
        saldoPendiente: 100,
        estadoPago: EstadoPago.PENDIENTE,
      };

      // Setup mocks
      const mockTerceroRepo = {
        findOne: jest.fn().mockResolvedValue(mockCliente),
        increment: jest.fn().mockResolvedValue(undefined),
      };

      const mockComprobanteRepo = {
        create: jest.fn().mockReturnValue(mockComprobanteCreado),
        save: jest.fn().mockResolvedValue(mockComprobanteCreado),
      };

      const mockCobroRepo = {
        create: jest.fn(),
        save: jest.fn(),
      };

      (manager.getRepository as jest.Mock).mockImplementation((entity) => {
        if (entity === Tercero) return mockTerceroRepo;
        if (entity === Comprobante) return mockComprobanteRepo;
        if (entity === Cobro) return mockCobroRepo;
      });

      (manager.findOne as jest.Mock).mockResolvedValue({
        ...mockProducto,
        stockActual: 100,
      });

      (manager.create as jest.Mock).mockImplementation((entity, data) => data);
      (manager.save as jest.Mock).mockImplementation((entity, data) =>
        Promise.resolve(data),
      );

      // Act
      const result = await service.crearVenta(dtoPending, empresaId);

      // Assert
      expect(result.comprobante.saldoPendiente).toBe(100);
      expect(result.comprobante.estadoPago).toBe(EstadoPago.PENDIENTE);
      expect(result.cobro).toBeNull();
      expect(mockCobroRepo.create).not.toHaveBeenCalled();
      expect(mockTerceroRepo.increment).toHaveBeenCalledWith(
        { id: 'cliente-123' },
        'saldoActual',
        100,
      );
    });

    it('should throw BadRequestException for anonymous sale without full payment', async () => {
      // Arrange
      const dtoAnonymous: CrearVentaDto = {
        clienteId: undefined,
        items: [
          {
            productoId: 'producto-123',
            cantidad: 2,
            precioUnitario: 50,
          },
        ],
        montoPagado: 50, // Partial payment
        metodoPago: MetodoPago.EFECTIVO,
      };

      // Act & Assert
      await expect(service.crearVenta(dtoAnonymous, empresaId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.crearVenta(dtoAnonymous, empresaId)).rejects.toThrow(
        'No se permite deuda en ventas anónimas. El monto pagado debe ser igual al total.',
      );
    });

    it('should allow anonymous sale with full payment', async () => {
      // Arrange
      const dtoAnonymous: CrearVentaDto = {
        clienteId: undefined,
        items: [
          {
            productoId: 'producto-123',
            cantidad: 2,
            precioUnitario: 50,
          },
        ],
        montoPagado: 100,
        metodoPago: MetodoPago.EFECTIVO,
      };

      const mockComprobanteCreado = {
        ...mockComprobante,
        id: 'new-comprobante',
        terceroId: null,
        total: 100,
        saldoPendiente: 0,
        estadoPago: EstadoPago.PAGADO,
      };

      const mockCobroCreado = {
        ...mockCobro,
        id: 'new-cobro',
        monto: 100,
      };

      // Setup mocks
      const mockTerceroRepo = {
        findOne: jest.fn(),
        increment: jest.fn(),
      };

      const mockComprobanteRepo = {
        create: jest.fn().mockReturnValue(mockComprobanteCreado),
        save: jest.fn().mockResolvedValue(mockComprobanteCreado),
      };

      const mockCobroRepo = {
        create: jest.fn().mockReturnValue(mockCobroCreado),
        save: jest.fn().mockResolvedValue(mockCobroCreado),
      };

      (manager.getRepository as jest.Mock).mockImplementation((entity) => {
        if (entity === Tercero) return mockTerceroRepo;
        if (entity === Comprobante) return mockComprobanteRepo;
        if (entity === Cobro) return mockCobroRepo;
      });

      (manager.findOne as jest.Mock).mockResolvedValue({
        ...mockProducto,
        stockActual: 100,
      });

      (manager.create as jest.Mock).mockImplementation((entity, data) => data);
      (manager.save as jest.Mock).mockImplementation((entity, data) =>
        Promise.resolve(data),
      );

      // Act
      const result = await service.crearVenta(dtoAnonymous, empresaId);

      // Assert
      expect(result.comprobante.estadoPago).toBe(EstadoPago.PAGADO);
      expect(mockTerceroRepo.findOne).not.toHaveBeenCalled();
      expect(mockTerceroRepo.increment).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if client does not exist', async () => {
      // Arrange
      const mockTerceroRepo = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      (manager.getRepository as jest.Mock).mockImplementation((entity) => {
        if (entity === Tercero) return mockTerceroRepo;
      });

      // Act & Assert
      await expect(
        service.crearVenta(crearVentaDto, empresaId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.crearVenta(crearVentaDto, empresaId),
      ).rejects.toThrow('Cliente no encontrado');
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should throw NotFoundException if product does not exist', async () => {
      // Arrange
      const mockTerceroRepo = {
        findOne: jest.fn().mockResolvedValue(mockCliente),
      };

      const mockComprobanteRepo = {
        create: jest.fn().mockReturnValue(mockComprobante),
        save: jest.fn().mockResolvedValue(mockComprobante),
      };

      (manager.getRepository as jest.Mock).mockImplementation((entity) => {
        if (entity === Tercero) return mockTerceroRepo;
        if (entity === Comprobante) return mockComprobanteRepo;
      });

      (manager.findOne as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.crearVenta(crearVentaDto, empresaId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.crearVenta(crearVentaDto, empresaId),
      ).rejects.toThrow('Producto producto-123 no encontrado');
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if insufficient stock', async () => {
      // Arrange
      const mockTerceroRepo = {
        findOne: jest.fn().mockResolvedValue(mockCliente),
      };

      const mockComprobanteRepo = {
        create: jest.fn().mockReturnValue(mockComprobante),
        save: jest.fn().mockResolvedValue(mockComprobante),
      };

      (manager.getRepository as jest.Mock).mockImplementation((entity) => {
        if (entity === Tercero) return mockTerceroRepo;
        if (entity === Comprobante) return mockComprobanteRepo;
      });

      (manager.findOne as jest.Mock).mockResolvedValue({
        ...mockProducto,
        stockActual: 1, // Insufficient stock
      });

      // Act & Assert
      await expect(
        service.crearVenta(crearVentaDto, empresaId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.crearVenta(crearVentaDto, empresaId),
      ).rejects.toThrow('Stock insuficiente para el producto');
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if payment method is missing when montoPagado > 0', async () => {
      // Arrange
      const dtoNoMetodo: CrearVentaDto = {
        ...crearVentaDto,
        metodoPago: undefined,
      };

      const mockTerceroRepo = {
        findOne: jest.fn().mockResolvedValue(mockCliente),
      };

      const mockComprobanteRepo = {
        create: jest.fn().mockReturnValue(mockComprobante),
        save: jest.fn().mockResolvedValue(mockComprobante),
      };

      (manager.getRepository as jest.Mock).mockImplementation((entity) => {
        if (entity === Tercero) return mockTerceroRepo;
        if (entity === Comprobante) return mockComprobanteRepo;
      });

      (manager.findOne as jest.Mock).mockResolvedValue({
        ...mockProducto,
        stockActual: 100,
      });

      (manager.create as jest.Mock).mockImplementation((entity, data) => data);
      (manager.save as jest.Mock).mockImplementation((entity, data) =>
        Promise.resolve(data),
      );

      // Act & Assert
      await expect(service.crearVenta(dtoNoMetodo, empresaId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.crearVenta(dtoNoMetodo, empresaId)).rejects.toThrow(
        'Debe especificar el método de pago',
      );
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should decrement product stock correctly', async () => {
      // Arrange
      const dtoMultipleItems: CrearVentaDto = {
        clienteId: 'cliente-123',
        items: [
          {
            productoId: 'producto-123',
            cantidad: 5,
            precioUnitario: 50,
          },
        ],
        montoPagado: 250,
        metodoPago: MetodoPago.EFECTIVO,
      };

      const productoConStock = {
        ...mockProducto,
        stockActual: 100,
      };

      const mockTerceroRepo = {
        findOne: jest.fn().mockResolvedValue(mockCliente),
      };

      const mockComprobanteRepo = {
        create: jest.fn().mockReturnValue(mockComprobante),
        save: jest.fn().mockResolvedValue(mockComprobante),
      };

      const mockCobroRepo = {
        create: jest.fn().mockReturnValue(mockCobro),
        save: jest.fn().mockResolvedValue(mockCobro),
      };

      (manager.getRepository as jest.Mock).mockImplementation((entity) => {
        if (entity === Tercero) return mockTerceroRepo;
        if (entity === Comprobante) return mockComprobanteRepo;
        if (entity === Cobro) return mockCobroRepo;
      });

      (manager.findOne as jest.Mock).mockResolvedValue(productoConStock);
      (manager.create as jest.Mock).mockImplementation((entity, data) => data);

      const mockSave = jest.fn().mockImplementation((entity, data) => {
        if (entity === Producto) {
          expect(data.stockActual).toBe(95); // 100 - 5
        }
        return Promise.resolve(data);
      });

      (manager.save as jest.Mock) = mockSave;

      // Act
      await service.crearVenta(dtoMultipleItems, empresaId);

      // Assert
      expect(mockSave).toHaveBeenCalledWith(
        Producto,
        expect.objectContaining({
          stockActual: 95,
        }),
      );
    });

    it('should rollback transaction on error', async () => {
      // Arrange
      const mockTerceroRepo = {
        findOne: jest.fn().mockResolvedValue(mockCliente),
      };

      const mockComprobanteRepo = {
        create: jest.fn().mockReturnValue(mockComprobante),
        save: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      (manager.getRepository as jest.Mock).mockImplementation((entity) => {
        if (entity === Tercero) return mockTerceroRepo;
        if (entity === Comprobante) return mockComprobanteRepo;
      });

      // Act & Assert
      await expect(
        service.crearVenta(crearVentaDto, empresaId),
      ).rejects.toThrow('Database error');
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('registrarNuevoCobro', () => {
    const registrarCobroDto: RegistrarCobroDto = {
      comprobanteId: 'comprobante-123',
      monto: 50,
      metodoPago: MetodoPago.EFECTIVO,
    };

    it('should register a new payment successfully', async () => {
      // Arrange
      const mockComprobantePendiente = {
        ...mockComprobante,
        saldoPendiente: 100,
        estadoPago: EstadoPago.PENDIENTE,
      };

      jest
        .spyOn(comprobanteRepository, 'findOne')
        .mockResolvedValue(mockComprobantePendiente);

      const mockCobroRepo = {
        create: jest.fn().mockReturnValue(mockCobro),
        save: jest.fn().mockResolvedValue(mockCobro),
      };

      const mockComprobanteRepo = {
        save: jest.fn().mockResolvedValue({
          ...mockComprobantePendiente,
          saldoPendiente: 50,
          estadoPago: EstadoPago.PARCIAL,
        }),
      };

      const mockTerceroRepo = {
        decrement: jest.fn().mockResolvedValue(undefined),
      };

      (manager.getRepository as jest.Mock).mockImplementation((entity) => {
        if (entity === Cobro) return mockCobroRepo;
        if (entity === Comprobante) return mockComprobanteRepo;
        if (entity === Tercero) return mockTerceroRepo;
      });

      // Act
      const result = await service.registrarNuevoCobro(
        registrarCobroDto,
        empresaId,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.cobro.monto).toBe(50);
      expect(result.comprobante.saldoPendiente).toBe(50);
      expect(result.comprobante.estadoPago).toBe(EstadoPago.PARCIAL);
      expect(result.mensaje).toContain('Saldo pendiente: $50.00');
      expect(mockTerceroRepo.decrement).toHaveBeenCalledWith(
        { id: 'cliente-123' },
        'saldoActual',
        50,
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should complete payment when full balance is paid', async () => {
      // Arrange
      const dtoFullPayment: RegistrarCobroDto = {
        comprobanteId: 'comprobante-123',
        monto: 50,
        metodoPago: MetodoPago.EFECTIVO,
      };

      const mockComprobantePendiente = {
        ...mockComprobante,
        saldoPendiente: 50,
        estadoPago: EstadoPago.PARCIAL,
      };

      jest
        .spyOn(comprobanteRepository, 'findOne')
        .mockResolvedValue(mockComprobantePendiente);

      const mockCobroRepo = {
        create: jest.fn().mockReturnValue(mockCobro),
        save: jest.fn().mockResolvedValue(mockCobro),
      };

      const mockComprobanteRepo = {
        save: jest.fn().mockResolvedValue({
          ...mockComprobantePendiente,
          saldoPendiente: 0,
          estadoPago: EstadoPago.PAGADO,
        }),
      };

      const mockTerceroRepo = {
        decrement: jest.fn().mockResolvedValue(undefined),
      };

      (manager.getRepository as jest.Mock).mockImplementation((entity) => {
        if (entity === Cobro) return mockCobroRepo;
        if (entity === Comprobante) return mockComprobanteRepo;
        if (entity === Tercero) return mockTerceroRepo;
      });

      // Act
      const result = await service.registrarNuevoCobro(
        dtoFullPayment,
        empresaId,
      );

      // Assert
      expect(result.comprobante.saldoPendiente).toBe(0);
      expect(result.comprobante.estadoPago).toBe(EstadoPago.PAGADO);
      expect(result.mensaje).toContain('Comprobante pagado completamente');
    });

    it('should throw NotFoundException if comprobante does not exist', async () => {
      // Arrange
      jest.spyOn(comprobanteRepository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.registrarNuevoCobro(registrarCobroDto, empresaId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.registrarNuevoCobro(registrarCobroDto, empresaId),
      ).rejects.toThrow('Comprobante no encontrado');
    });

    it('should throw BadRequestException if comprobante is already paid', async () => {
      // Arrange
      const mockComprobantePagado = {
        ...mockComprobante,
        saldoPendiente: 0,
        estadoPago: EstadoPago.PAGADO,
      };

      jest
        .spyOn(comprobanteRepository, 'findOne')
        .mockResolvedValue(mockComprobantePagado);

      // Act & Assert
      await expect(
        service.registrarNuevoCobro(registrarCobroDto, empresaId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.registrarNuevoCobro(registrarCobroDto, empresaId),
      ).rejects.toThrow('El comprobante ya está completamente pagado');
    });

    it('should throw BadRequestException if payment exceeds pending balance', async () => {
      // Arrange
      const dtoExceso: RegistrarCobroDto = {
        comprobanteId: 'comprobante-123',
        monto: 150, // Excede el saldo pendiente
        metodoPago: MetodoPago.EFECTIVO,
      };

      const mockComprobantePendiente = {
        ...mockComprobante,
        saldoPendiente: 50,
        estadoPago: EstadoPago.PARCIAL,
      };

      jest
        .spyOn(comprobanteRepository, 'findOne')
        .mockResolvedValue(mockComprobantePendiente);

      // Act & Assert
      await expect(
        service.registrarNuevoCobro(dtoExceso, empresaId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.registrarNuevoCobro(dtoExceso, empresaId),
      ).rejects.toThrow(
        'El monto ($150.00) excede el saldo pendiente ($50.00)',
      );
    });

    it('should not update tercero balance if no tercero is linked', async () => {
      // Arrange
      const mockComprobanteAnonymous = {
        ...mockComprobante,
        terceroId: null,
        tercero: null,
        saldoPendiente: 50,
        estadoPago: EstadoPago.PARCIAL,
      };

      jest
        .spyOn(comprobanteRepository, 'findOne')
        .mockResolvedValue(mockComprobanteAnonymous);

      const mockCobroRepo = {
        create: jest.fn().mockReturnValue(mockCobro),
        save: jest.fn().mockResolvedValue(mockCobro),
      };

      const mockComprobanteRepo = {
        save: jest.fn().mockResolvedValue({
          ...mockComprobanteAnonymous,
          saldoPendiente: 0,
          estadoPago: EstadoPago.PAGADO,
        }),
      };

      const mockTerceroRepo = {
        decrement: jest.fn(),
      };

      (manager.getRepository as jest.Mock).mockImplementation((entity) => {
        if (entity === Cobro) return mockCobroRepo;
        if (entity === Comprobante) return mockComprobanteRepo;
        if (entity === Tercero) return mockTerceroRepo;
      });

      // Act
      await service.registrarNuevoCobro(registrarCobroDto, empresaId);

      // Assert
      expect(mockTerceroRepo.decrement).not.toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      // Arrange
      jest
        .spyOn(comprobanteRepository, 'findOne')
        .mockResolvedValue(mockComprobante);

      const mockCobroRepo = {
        create: jest.fn().mockReturnValue(mockCobro),
        save: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      (manager.getRepository as jest.Mock).mockImplementation((entity) => {
        if (entity === Cobro) return mockCobroRepo;
      });

      // Act & Assert
      await expect(
        service.registrarNuevoCobro(registrarCobroDto, empresaId),
      ).rejects.toThrow('Database error');
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('actualizarCobro', () => {
    const cobroId = 'cobro-123';

    it('should update payment method successfully', async () => {
      // Arrange
      const dto: ActualizarCobroDto = {
        metodoPago: MetodoPago.TARJETA,
      };

      const mockCobroWithComprobante = {
        ...mockCobro,
        comprobante: mockComprobante,
      };

      jest
        .spyOn(cobroRepository, 'findOne')
        .mockResolvedValue(mockCobroWithComprobante);
      jest.spyOn(cobroRepository, 'save').mockResolvedValue({
        ...mockCobroWithComprobante,
        metodo: MetodoPago.TARJETA,
      });

      // Act
      const result = await service.actualizarCobro(cobroId, dto, empresaId);

      // Assert
      expect(result).toBeDefined();
      expect(result.cobro.metodo).toBe(MetodoPago.TARJETA);
      expect(result.mensaje).toBe('Cobro actualizado exitosamente');
    });

    it('should update payment date successfully', async () => {
      // Arrange
      const newDate = '2024-01-15';
      const dto: ActualizarCobroDto = {
        fecha: newDate,
      };

      const mockCobroWithComprobante = {
        ...mockCobro,
        comprobante: mockComprobante,
      };

      jest
        .spyOn(cobroRepository, 'findOne')
        .mockResolvedValue(mockCobroWithComprobante);
      jest.spyOn(cobroRepository, 'save').mockResolvedValue({
        ...mockCobroWithComprobante,
        fecha: new Date(newDate),
      });

      // Act
      const result = await service.actualizarCobro(cobroId, dto, empresaId);

      // Assert
      expect(result).toBeDefined();
      expect(result.mensaje).toBe('Cobro actualizado exitosamente');
    });

    it('should update both payment method and date', async () => {
      // Arrange
      const newDate = '2024-01-15';
      const dto: ActualizarCobroDto = {
        metodoPago: MetodoPago.QR,
        fecha: newDate,
      };

      const mockCobroWithComprobante = {
        ...mockCobro,
        comprobante: mockComprobante,
      };

      jest
        .spyOn(cobroRepository, 'findOne')
        .mockResolvedValue(mockCobroWithComprobante);
      jest.spyOn(cobroRepository, 'save').mockResolvedValue({
        ...mockCobroWithComprobante,
        metodo: MetodoPago.QR,
        fecha: new Date(newDate),
      });

      // Act
      const result = await service.actualizarCobro(cobroId, dto, empresaId);

      // Assert
      expect(result.cobro.metodo).toBe(MetodoPago.QR);
    });

    it('should return unchanged cobro if no changes provided', async () => {
      // Arrange
      const dto: ActualizarCobroDto = {};

      const mockCobroWithComprobante = {
        ...mockCobro,
        comprobante: mockComprobante,
      };

      jest
        .spyOn(cobroRepository, 'findOne')
        .mockResolvedValue(mockCobroWithComprobante);

      // Act
      const result = await service.actualizarCobro(cobroId, dto, empresaId);

      // Assert
      expect(result.mensaje).toBe('Cobro sin cambios');
      expect(cobroRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if cobro does not exist', async () => {
      // Arrange
      const dto: ActualizarCobroDto = {
        metodoPago: MetodoPago.TARJETA,
      };

      jest.spyOn(cobroRepository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.actualizarCobro(cobroId, dto, empresaId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.actualizarCobro(cobroId, dto, empresaId),
      ).rejects.toThrow(`Cobro ${cobroId} no encontrado`);
    });
  });

  describe('getDetalleVenta', () => {
    const comprobanteId = 'comprobante-123';

    it('should return sale details with client', async () => {
      // Arrange
      const mockComprobanteCompleto = {
        ...mockComprobante,
        tercero: mockCliente,
        detalles: [
          {
            productoId: 'producto-123',
            nombreProducto: 'Producto Test',
            cantidad: 2,
            precioUnitario: 50,
            subtotal: 100,
          },
        ],
        cobros: [mockCobro],
        createdAt: new Date('2024-01-01'),
      };

      jest
        .spyOn(comprobanteRepository, 'findOne')
        .mockResolvedValue(mockComprobanteCompleto);

      // Act
      const result = await service.getDetalleVenta(comprobanteId, empresaId);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(comprobanteId);
      expect(result.tercero).toBeDefined();
      expect(result.tercero.id).toBe('cliente-123');
      expect(result.detalles).toHaveLength(1);
      expect(result.cobros).toHaveLength(1);
    });

    it('should return sale details without client (anonymous)', async () => {
      // Arrange
      const mockComprobanteAnonymous = {
        ...mockComprobante,
        terceroId: null,
        tercero: null,
        detalles: [
          {
            productoId: 'producto-123',
            nombreProducto: 'Producto Test',
            cantidad: 1,
            precioUnitario: 50,
            subtotal: 50,
          },
        ],
        cobros: [mockCobro],
        createdAt: new Date('2024-01-01'),
      };

      jest
        .spyOn(comprobanteRepository, 'findOne')
        .mockResolvedValue(mockComprobanteAnonymous);

      // Act
      const result = await service.getDetalleVenta(comprobanteId, empresaId);

      // Assert
      expect(result).toBeDefined();
      expect(result.tercero).toBeUndefined();
    });

    it('should throw NotFoundException if comprobante does not exist', async () => {
      // Arrange
      jest.spyOn(comprobanteRepository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getDetalleVenta(comprobanteId, empresaId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getDetalleVenta(comprobanteId, empresaId),
      ).rejects.toThrow(`Comprobante ${comprobanteId} no encontrado`);
    });
  });

  describe('getDeudasCliente', () => {
    const clienteId = 'cliente-123';

    it('should return client debts successfully', async () => {
      // Arrange
      jest.spyOn(terceroRepository, 'findOne').mockResolvedValue(mockCliente);

      const mockComprobantesConDeuda = [
        {
          id: 'comprobante-1',
          createdAt: new Date('2024-01-01'),
          total: 100,
          saldoPendiente: 50,
          estadoPago: EstadoPago.PARCIAL,
        },
        {
          id: 'comprobante-2',
          createdAt: new Date('2024-01-02'),
          total: 200,
          saldoPendiente: 200,
          estadoPago: EstadoPago.PENDIENTE,
        },
      ];

      jest
        .spyOn(comprobanteRepository, 'find')
        .mockResolvedValue(mockComprobantesConDeuda as any);

      // Act
      const result = await service.getDeudasCliente(clienteId, empresaId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].saldoPendiente).toBe(50);
      expect(result[1].saldoPendiente).toBe(200);
    });

    it('should return empty array if client has no debts', async () => {
      // Arrange
      jest.spyOn(terceroRepository, 'findOne').mockResolvedValue(mockCliente);
      jest.spyOn(comprobanteRepository, 'find').mockResolvedValue([]);

      // Act
      const result = await service.getDeudasCliente(clienteId, empresaId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should throw NotFoundException if client does not exist', async () => {
      // Arrange
      jest.spyOn(terceroRepository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getDeudasCliente(clienteId, empresaId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getDeudasCliente(clienteId, empresaId),
      ).rejects.toThrow(`Cliente ${clienteId} no encontrado`);
    });
  });

  describe('actualizarComprobante', () => {
    const comprobanteId = 'comprobante-123';

    it('should update comprobante with new tercero', async () => {
      // Arrange
      const dto: ActualizarComprobanteDto = {
        terceroId: 'cliente-nuevo',
      };

      const mockComprobantePagado = {
        ...mockComprobante,
        saldoPendiente: 0,
        estadoPago: EstadoPago.PAGADO,
      };

      const mockNuevoCliente = {
        ...mockCliente,
        id: 'cliente-nuevo',
        nombre: 'Cliente Nuevo',
      };

      jest
        .spyOn(comprobanteRepository, 'findOne')
        .mockResolvedValue(mockComprobantePagado);
      jest
        .spyOn(terceroRepository, 'findOne')
        .mockResolvedValue(mockNuevoCliente);
      jest.spyOn(comprobanteRepository, 'save').mockResolvedValue({
        ...mockComprobantePagado,
        terceroId: 'cliente-nuevo',
      });

      // Mock getDetalleVenta
      jest.spyOn(service, 'getDetalleVenta').mockResolvedValue({
        id: comprobanteId,
        tipo: TipoComprobante.VENTA,
        total: 100,
        saldoPendiente: 0,
        estadoPago: EstadoPago.PAGADO,
        tercero: {
          id: 'cliente-nuevo',
          nombre: 'Cliente Nuevo',
        },
        detalles: [],
        cobros: [],
        createdAt: new Date(),
      });

      // Act
      const result = await service.actualizarComprobante(
        comprobanteId,
        dto,
        empresaId,
      );

      // Assert
      expect(result).toBeDefined();
      expect(comprobanteRepository.save).toHaveBeenCalled();
    });

    it('should remove tercero from comprobante', async () => {
      // Arrange
      const dto: ActualizarComprobanteDto = {
        terceroId: null,
      };

      const mockComprobantePagado = {
        ...mockComprobante,
        saldoPendiente: 0,
        estadoPago: EstadoPago.PAGADO,
      };

      jest
        .spyOn(comprobanteRepository, 'findOne')
        .mockResolvedValue(mockComprobantePagado);
      jest
        .spyOn(comprobanteRepository, 'save')
        .mockResolvedValue({ ...mockComprobantePagado, terceroId: null });

      jest.spyOn(service, 'getDetalleVenta').mockResolvedValue({
        id: comprobanteId,
        tipo: TipoComprobante.VENTA,
        total: 100,
        saldoPendiente: 0,
        estadoPago: EstadoPago.PAGADO,
        tercero: undefined,
        detalles: [],
        cobros: [],
        createdAt: new Date(),
      });

      // Act
      const result = await service.actualizarComprobante(
        comprobanteId,
        dto,
        empresaId,
      );

      // Assert
      expect(result).toBeDefined();
      expect(comprobanteRepository.save).toHaveBeenCalled();
    });

    it('should return unchanged comprobante if no changes provided', async () => {
      // Arrange
      const dto: ActualizarComprobanteDto = {};

      jest
        .spyOn(comprobanteRepository, 'findOne')
        .mockResolvedValue(mockComprobante);

      jest.spyOn(service, 'getDetalleVenta').mockResolvedValue({
        id: comprobanteId,
        tipo: TipoComprobante.VENTA,
        total: 100,
        saldoPendiente: 50,
        estadoPago: EstadoPago.PARCIAL,
        tercero: {
          id: 'cliente-123',
          nombre: 'Juan Perez',
        },
        detalles: [],
        cobros: [],
        createdAt: new Date(),
      });

      // Act
      const result = await service.actualizarComprobante(
        comprobanteId,
        dto,
        empresaId,
      );

      // Assert
      expect(result).toBeDefined();
      expect(comprobanteRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if comprobante does not exist', async () => {
      // Arrange
      const dto: ActualizarComprobanteDto = {
        terceroId: 'cliente-nuevo',
      };

      jest.spyOn(comprobanteRepository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.actualizarComprobante(comprobanteId, dto, empresaId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.actualizarComprobante(comprobanteId, dto, empresaId),
      ).rejects.toThrow(`Comprobante ${comprobanteId} no encontrado`);
    });

    it('should throw BadRequestException if comprobante has pending balance', async () => {
      // Arrange
      const dto: ActualizarComprobanteDto = {
        terceroId: 'cliente-nuevo',
      };

      const mockComprobanteConDeuda = {
        ...mockComprobante,
        saldoPendiente: 50,
        estadoPago: EstadoPago.PARCIAL,
      };

      jest
        .spyOn(comprobanteRepository, 'findOne')
        .mockResolvedValue(mockComprobanteConDeuda);

      // Act & Assert
      await expect(
        service.actualizarComprobante(comprobanteId, dto, empresaId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.actualizarComprobante(comprobanteId, dto, empresaId),
      ).rejects.toThrow(
        'No se puede cambiar el cliente de un comprobante con saldo pendiente',
      );
    });

    it('should throw NotFoundException if new tercero does not exist', async () => {
      // Arrange
      const dto: ActualizarComprobanteDto = {
        terceroId: 'cliente-inexistente',
      };

      const mockComprobantePagado = {
        ...mockComprobante,
        saldoPendiente: 0,
        estadoPago: EstadoPago.PAGADO,
      };

      jest
        .spyOn(comprobanteRepository, 'findOne')
        .mockResolvedValue(mockComprobantePagado);
      jest.spyOn(terceroRepository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.actualizarComprobante(comprobanteId, dto, empresaId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.actualizarComprobante(comprobanteId, dto, empresaId),
      ).rejects.toThrow(`Cliente cliente-inexistente no encontrado`);
    });
  });

  describe('listarVentas', () => {
    it('should list all sales without filters', async () => {
      // Arrange
      const query: ListarVentasQueryDto = {};

      const mockVentas = [
        {
          ...mockComprobante,
          createdAt: new Date('2024-01-02'),
        },
        {
          ...mockComprobante,
          id: 'comprobante-2',
          createdAt: new Date('2024-01-01'),
        },
      ];

      jest.spyOn(comprobanteRepository, 'find').mockResolvedValue(mockVentas);

      // Act
      const result = await service.listarVentas(query, empresaId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('comprobante-123');
      expect(result[1].id).toBe('comprobante-2');
    });

    it('should filter sales by estadoPago', async () => {
      // Arrange
      const query: ListarVentasQueryDto = {
        estadoPago: EstadoPago.PENDIENTE,
      };

      const mockVentas = [
        {
          ...mockComprobante,
          estadoPago: EstadoPago.PENDIENTE,
        },
      ];

      jest.spyOn(comprobanteRepository, 'find').mockResolvedValue(mockVentas);

      // Act
      const result = await service.listarVentas(query, empresaId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].estadoPago).toBe(EstadoPago.PENDIENTE);
    });

    it('should filter sales by clienteId', async () => {
      // Arrange
      const query: ListarVentasQueryDto = {
        clienteId: 'cliente-123',
      };

      const mockVentas = [
        {
          ...mockComprobante,
          terceroId: 'cliente-123',
        },
      ];

      jest.spyOn(comprobanteRepository, 'find').mockResolvedValue(mockVentas);

      // Act
      const result = await service.listarVentas(query, empresaId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].tercero.id).toBe('cliente-123');
    });

    it('should filter sales by date range', async () => {
      // Arrange
      const query: ListarVentasQueryDto = {
        fechaDesde: '2024-01-01',
        fechaHasta: '2024-01-31',
      };

      const mockVentas = [
        {
          ...mockComprobante,
          createdAt: new Date('2024-01-15'),
        },
      ];

      jest.spyOn(comprobanteRepository, 'find').mockResolvedValue(mockVentas);

      // Act
      const result = await service.listarVentas(query, empresaId);

      // Assert
      expect(result).toHaveLength(1);
      expect(comprobanteRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.anything(),
          }),
        }),
      );
    });

    it('should filter sales from fechaDesde only', async () => {
      // Arrange
      const query: ListarVentasQueryDto = {
        fechaDesde: '2024-01-01',
      };

      const mockVentas = [
        {
          ...mockComprobante,
          createdAt: new Date('2024-01-15'),
        },
      ];

      jest.spyOn(comprobanteRepository, 'find').mockResolvedValue(mockVentas);

      // Act
      const result = await service.listarVentas(query, empresaId);

      // Assert
      expect(result).toHaveLength(1);
    });

    it('should filter sales until fechaHasta only', async () => {
      // Arrange
      const query: ListarVentasQueryDto = {
        fechaHasta: '2024-01-31',
      };

      const mockVentas = [
        {
          ...mockComprobante,
          createdAt: new Date('2024-01-15'),
        },
      ];

      jest.spyOn(comprobanteRepository, 'find').mockResolvedValue(mockVentas);

      // Act
      const result = await service.listarVentas(query, empresaId);

      // Assert
      expect(result).toHaveLength(1);
    });

    it('should return empty array if no sales found', async () => {
      // Arrange
      const query: ListarVentasQueryDto = {
        estadoPago: EstadoPago.PAGADO,
      };

      jest.spyOn(comprobanteRepository, 'find').mockResolvedValue([]);

      // Act
      const result = await service.listarVentas(query, empresaId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should apply multiple filters combined', async () => {
      // Arrange
      const query: ListarVentasQueryDto = {
        estadoPago: EstadoPago.PARCIAL,
        clienteId: 'cliente-123',
        fechaDesde: '2024-01-01',
        fechaHasta: '2024-01-31',
      };

      const mockVentas = [
        {
          ...mockComprobante,
          estadoPago: EstadoPago.PARCIAL,
          terceroId: 'cliente-123',
          createdAt: new Date('2024-01-15'),
        },
      ];

      jest.spyOn(comprobanteRepository, 'find').mockResolvedValue(mockVentas);

      // Act
      const result = await service.listarVentas(query, empresaId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].estadoPago).toBe(EstadoPago.PARCIAL);
      expect(result[0].tercero.id).toBe('cliente-123');
    });
  });
});
