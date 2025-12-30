import { Test, TestingModule } from '@nestjs/testing';
import { VentasController } from './ventas.controller';
import { VentasService } from './ventas.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CrearVentaDto,
  ActualizarComprobanteDto,
  RegistrarCobroDto,
  ActualizarCobroDto,
  VentaResponseDto,
  CobroResponseDto,
  DetalleVentaResponseDto,
  DeudaClienteDto,
  ListarVentasQueryDto,
  VentaListItemDto,
} from './dto';

/**
 * UNIT TESTS: VentasController
 *
 * Pruebas unitarias completas para el controlador de ventas y cobros.
 * Se mockea completamente el VentasService y el JwtAuthGuard.
 *
 * Cobertura:
 * - POST /ventas (crearVenta)
 * - GET /ventas (listarVentas)
 * - POST /ventas/cobros (registrarCobro)
 * - PATCH /ventas/cobros/:id (actualizarCobro)
 * - PATCH /ventas/:id (actualizarComprobante)
 * - GET /ventas/deudas/:clienteId (getDeudasCliente)
 * - GET /ventas/:id (getDetalleVenta)
 *
 * Cada test valida:
 * - Extracción correcta de empresaId desde req.user
 * - Llamada al método del servicio con parámetros correctos
 * - Retorno de la respuesta del servicio
 */
describe('VentasController', () => {
  let controller: VentasController;
  let service: VentasService;

  // Mock del Request object con user.empresaId
  const mockRequest = {
    user: {
      empresaId: 'empresa-123',
      userId: 'user-456',
      tenantId: 'empresa-123',
    },
    tenantId: 'empresa-123',
  };

  // Mock data - Ventas
  const mockVentaResponse: VentaResponseDto = {
    comprobante: {
      id: 'comp-1',
      numero: 'V-001',
      fecha: new Date('2025-01-15'),
      total: 1000,
      saldoPendiente: 500,
      estadoPago: 'PARCIAL',
    },
    cobro: {
      id: 'cobro-1',
      monto: 500,
      metodoPago: 'EFECTIVO',
      fecha: new Date('2025-01-15'),
    },
    mensaje: 'Venta registrada con pago parcial',
  };

  const mockVentaListItem: VentaListItemDto = {
    id: 'comp-1',
    numero: 'V-001',
    fecha: new Date('2025-01-15'),
    clienteNombre: 'Juan Pérez',
    total: 1000,
    saldoPendiente: 500,
    estadoPago: 'PARCIAL',
  };

  const mockDetalleVenta: DetalleVentaResponseDto = {
    comprobante: {
      id: 'comp-1',
      numero: 'V-001',
      fecha: new Date('2025-01-15'),
      total: 1000,
      saldoPendiente: 500,
      estadoPago: 'PARCIAL',
    },
    cliente: {
      id: 'cliente-1',
      nombre: 'Juan Pérez',
      documento: '12345678',
      email: 'juan@example.com',
    },
    items: [
      {
        id: 'item-1',
        productoNombre: 'Producto A',
        cantidad: 2,
        precioUnitario: 500,
        subtotal: 1000,
      },
    ],
    cobros: [
      {
        id: 'cobro-1',
        monto: 500,
        metodoPago: 'EFECTIVO',
        fecha: new Date('2025-01-15'),
      },
    ],
  };

  // Mock data - Cobros
  const mockCobroResponse: CobroResponseDto = {
    cobro: {
      id: 'cobro-2',
      monto: 300,
      metodoPago: 'TARJETA',
      fecha: new Date('2025-01-16'),
    },
    comprobante: {
      id: 'comp-1',
      numero: 'V-001',
      saldoPendiente: 200,
      estadoPago: 'PARCIAL',
    },
    mensaje: 'Cobro registrado exitosamente',
  };

  // Mock data - Deudas
  const mockDeudaCliente: DeudaClienteDto = {
    comprobanteId: 'comp-1',
    numero: 'V-001',
    fecha: new Date('2025-01-15'),
    total: 1000,
    saldoPendiente: 500,
    estadoPago: 'PARCIAL',
  };

  // Mock VentasService
  const mockVentasService = {
    crearVenta: jest.fn(),
    listarVentas: jest.fn(),
    registrarNuevoCobro: jest.fn(),
    actualizarCobro: jest.fn(),
    actualizarComprobante: jest.fn(),
    getDeudasCliente: jest.fn(),
    getDetalleVenta: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VentasController],
      providers: [
        {
          provide: VentasService,
          useValue: mockVentasService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<VentasController>(VentasController);
    service = module.get<VentasService>(VentasService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /ventas (crearVenta)', () => {
    const crearVentaDto: CrearVentaDto = {
      clienteId: 'cliente-1',
      items: [
        {
          productoId: 'prod-1',
          cantidad: 2,
          precioUnitario: 500,
        },
      ],
      montoPagado: 500,
      metodoPago: 'EFECTIVO',
      fecha: new Date('2025-01-15'),
    };

    it('should create a venta and extract empresaId from req.user', async () => {
      // Arrange
      mockVentasService.crearVenta.mockResolvedValue(mockVentaResponse);

      // Act
      const result = await controller.crearVenta(crearVentaDto, mockRequest);

      // Assert
      expect(service.crearVenta).toHaveBeenCalledWith(
        crearVentaDto,
        'empresa-123',
      );
      expect(service.crearVenta).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockVentaResponse);
    });

    it('should return venta response with comprobante and cobro', async () => {
      // Arrange
      mockVentasService.crearVenta.mockResolvedValue(mockVentaResponse);

      // Act
      const result = await controller.crearVenta(crearVentaDto, mockRequest);

      // Assert
      expect(result).toHaveProperty('comprobante');
      expect(result).toHaveProperty('cobro');
      expect(result).toHaveProperty('mensaje');
      expect(result.comprobante.id).toBe('comp-1');
      expect(result.cobro.monto).toBe(500);
    });

    it('should handle venta creation with anonymous client', async () => {
      // Arrange
      const anonymousVentaDto = {
        ...crearVentaDto,
        clienteId: null,
        montoPagado: 1000, // Full payment for anonymous
      };
      const anonymousResponse = {
        ...mockVentaResponse,
        comprobante: {
          ...mockVentaResponse.comprobante,
          saldoPendiente: 0,
          estadoPago: 'PAGADO',
        },
        mensaje: 'Venta anónima registrada',
      };
      mockVentasService.crearVenta.mockResolvedValue(anonymousResponse);

      // Act
      const result = await controller.crearVenta(
        anonymousVentaDto,
        mockRequest,
      );

      // Assert
      expect(service.crearVenta).toHaveBeenCalledWith(
        anonymousVentaDto,
        'empresa-123',
      );
      expect(result.comprobante.estadoPago).toBe('PAGADO');
      expect(result.comprobante.saldoPendiente).toBe(0);
    });

    it('should pass correct empresaId from different user', async () => {
      // Arrange
      const differentUserRequest = {
        user: {
          empresaId: 'empresa-999',
          userId: 'user-999',
        },
      };
      mockVentasService.crearVenta.mockResolvedValue(mockVentaResponse);

      // Act
      await controller.crearVenta(crearVentaDto, differentUserRequest);

      // Assert
      expect(service.crearVenta).toHaveBeenCalledWith(
        crearVentaDto,
        'empresa-999',
      );
    });
  });

  describe('GET /ventas (listarVentas)', () => {
    const queryDto: ListarVentasQueryDto = {
      estadoPago: 'PARCIAL',
      clienteId: 'cliente-1',
      fechaDesde: '2025-01-01',
      fechaHasta: '2025-01-31',
    };

    it('should list ventas with filters and extract empresaId from req.user', async () => {
      // Arrange
      mockVentasService.listarVentas.mockResolvedValue([mockVentaListItem]);

      // Act
      const result = await controller.listarVentas(queryDto, mockRequest);

      // Assert
      expect(service.listarVentas).toHaveBeenCalledWith(
        queryDto,
        'empresa-123',
      );
      expect(service.listarVentas).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockVentaListItem]);
    });

    it('should return array of venta list items', async () => {
      // Arrange
      const multipleVentas = [
        mockVentaListItem,
        { ...mockVentaListItem, id: 'comp-2', numero: 'V-002' },
        { ...mockVentaListItem, id: 'comp-3', numero: 'V-003' },
      ];
      mockVentasService.listarVentas.mockResolvedValue(multipleVentas);

      // Act
      const result = await controller.listarVentas(queryDto, mockRequest);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('numero');
      expect(result[0]).toHaveProperty('estadoPago');
      expect(result[1].numero).toBe('V-002');
    });

    it('should list ventas without filters', async () => {
      // Arrange
      const emptyQuery: ListarVentasQueryDto = {};
      mockVentasService.listarVentas.mockResolvedValue([mockVentaListItem]);

      // Act
      const result = await controller.listarVentas(emptyQuery, mockRequest);

      // Assert
      expect(service.listarVentas).toHaveBeenCalledWith(
        emptyQuery,
        'empresa-123',
      );
      expect(result).toEqual([mockVentaListItem]);
    });

    it('should return empty array when no ventas found', async () => {
      // Arrange
      mockVentasService.listarVentas.mockResolvedValue([]);

      // Act
      const result = await controller.listarVentas(queryDto, mockRequest);

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should filter by estadoPago only', async () => {
      // Arrange
      const estadoQuery: ListarVentasQueryDto = { estadoPago: 'PENDIENTE' };
      mockVentasService.listarVentas.mockResolvedValue([mockVentaListItem]);

      // Act
      await controller.listarVentas(estadoQuery, mockRequest);

      // Assert
      expect(service.listarVentas).toHaveBeenCalledWith(
        estadoQuery,
        'empresa-123',
      );
    });

    it('should filter by date range only', async () => {
      // Arrange
      const dateQuery: ListarVentasQueryDto = {
        fechaDesde: '2025-01-01',
        fechaHasta: '2025-01-31',
      };
      mockVentasService.listarVentas.mockResolvedValue([mockVentaListItem]);

      // Act
      await controller.listarVentas(dateQuery, mockRequest);

      // Assert
      expect(service.listarVentas).toHaveBeenCalledWith(
        dateQuery,
        'empresa-123',
      );
    });
  });

  describe('POST /ventas/cobros (registrarCobro)', () => {
    const registrarCobroDto: RegistrarCobroDto = {
      comprobanteId: 'comp-1',
      monto: 300,
      metodoPago: 'TARJETA',
      fecha: new Date('2025-01-16'),
    };

    it('should register cobro and extract empresaId from req.user', async () => {
      // Arrange
      mockVentasService.registrarNuevoCobro.mockResolvedValue(
        mockCobroResponse,
      );

      // Act
      const result = await controller.registrarCobro(
        registrarCobroDto,
        mockRequest,
      );

      // Assert
      expect(service.registrarNuevoCobro).toHaveBeenCalledWith(
        registrarCobroDto,
        'empresa-123',
      );
      expect(service.registrarNuevoCobro).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCobroResponse);
    });

    it('should return cobro response with updated comprobante estado', async () => {
      // Arrange
      mockVentasService.registrarNuevoCobro.mockResolvedValue(
        mockCobroResponse,
      );

      // Act
      const result = await controller.registrarCobro(
        registrarCobroDto,
        mockRequest,
      );

      // Assert
      expect(result).toHaveProperty('cobro');
      expect(result).toHaveProperty('comprobante');
      expect(result).toHaveProperty('mensaje');
      expect(result.cobro.monto).toBe(300);
      expect(result.comprobante.saldoPendiente).toBe(200);
    });

    it('should handle final payment that completes venta', async () => {
      // Arrange
      const finalPaymentDto = {
        ...registrarCobroDto,
        monto: 500,
      };
      const finalPaymentResponse = {
        ...mockCobroResponse,
        comprobante: {
          ...mockCobroResponse.comprobante,
          saldoPendiente: 0,
          estadoPago: 'PAGADO',
        },
        mensaje: 'Venta completamente pagada',
      };
      mockVentasService.registrarNuevoCobro.mockResolvedValue(
        finalPaymentResponse,
      );

      // Act
      const result = await controller.registrarCobro(
        finalPaymentDto,
        mockRequest,
      );

      // Assert
      expect(result.comprobante.estadoPago).toBe('PAGADO');
      expect(result.comprobante.saldoPendiente).toBe(0);
      expect(result.mensaje).toContain('completamente pagada');
    });

    it('should handle cobro with different payment method', async () => {
      // Arrange
      const transferDto = {
        ...registrarCobroDto,
        metodoPago: 'TRANSFERENCIA' as any,
      };
      mockVentasService.registrarNuevoCobro.mockResolvedValue(
        mockCobroResponse,
      );

      // Act
      await controller.registrarCobro(transferDto, mockRequest);

      // Assert
      expect(service.registrarNuevoCobro).toHaveBeenCalledWith(
        transferDto,
        'empresa-123',
      );
    });
  });

  describe('PATCH /ventas/cobros/:id (actualizarCobro)', () => {
    const cobroId = 'cobro-1';
    const actualizarCobroDto: ActualizarCobroDto = {
      metodoPago: 'TRANSFERENCIA',
      fecha: new Date('2025-01-17'),
    };

    it('should update cobro and extract empresaId from req.user', async () => {
      // Arrange
      const updatedCobro = {
        ...mockCobroResponse,
        cobro: {
          ...mockCobroResponse.cobro,
          metodoPago: 'TRANSFERENCIA',
          fecha: new Date('2025-01-17'),
        },
      };
      mockVentasService.actualizarCobro.mockResolvedValue(updatedCobro);

      // Act
      const result = await controller.actualizarCobro(
        cobroId,
        actualizarCobroDto,
        mockRequest,
      );

      // Assert
      expect(service.actualizarCobro).toHaveBeenCalledWith(
        cobroId,
        actualizarCobroDto,
        'empresa-123',
      );
      expect(service.actualizarCobro).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedCobro);
    });

    it('should update only metodoPago', async () => {
      // Arrange
      const metodoPagoOnlyDto: ActualizarCobroDto = {
        metodoPago: 'EFECTIVO',
      };
      mockVentasService.actualizarCobro.mockResolvedValue(mockCobroResponse);

      // Act
      await controller.actualizarCobro(cobroId, metodoPagoOnlyDto, mockRequest);

      // Assert
      expect(service.actualizarCobro).toHaveBeenCalledWith(
        cobroId,
        metodoPagoOnlyDto,
        'empresa-123',
      );
    });

    it('should update only fecha', async () => {
      // Arrange
      const fechaOnlyDto: ActualizarCobroDto = {
        fecha: new Date('2025-01-20'),
      };
      mockVentasService.actualizarCobro.mockResolvedValue(mockCobroResponse);

      // Act
      await controller.actualizarCobro(cobroId, fechaOnlyDto, mockRequest);

      // Assert
      expect(service.actualizarCobro).toHaveBeenCalledWith(
        cobroId,
        fechaOnlyDto,
        'empresa-123',
      );
    });

    it('should pass correct cobroId as string parameter', async () => {
      // Arrange
      const numericCobroId = '123456';
      mockVentasService.actualizarCobro.mockResolvedValue(mockCobroResponse);

      // Act
      await controller.actualizarCobro(
        numericCobroId,
        actualizarCobroDto,
        mockRequest,
      );

      // Assert
      expect(service.actualizarCobro).toHaveBeenCalledWith(
        '123456',
        actualizarCobroDto,
        'empresa-123',
      );
    });
  });

  describe('PATCH /ventas/:id (actualizarComprobante)', () => {
    const comprobanteId = 'comp-1';
    const actualizarComprobanteDto: ActualizarComprobanteDto = {
      terceroId: 'cliente-2',
    };

    it('should update comprobante and extract empresaId from req.user', async () => {
      // Arrange
      mockVentasService.actualizarComprobante.mockResolvedValue(
        mockDetalleVenta,
      );

      // Act
      const result = await controller.actualizarComprobante(
        comprobanteId,
        actualizarComprobanteDto,
        mockRequest,
      );

      // Assert
      expect(service.actualizarComprobante).toHaveBeenCalledWith(
        comprobanteId,
        actualizarComprobanteDto,
        'empresa-123',
      );
      expect(service.actualizarComprobante).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockDetalleVenta);
    });

    it('should return detalle venta with updated cliente', async () => {
      // Arrange
      const updatedDetalle = {
        ...mockDetalleVenta,
        cliente: {
          id: 'cliente-2',
          nombre: 'María García',
          documento: '87654321',
          email: 'maria@example.com',
        },
      };
      mockVentasService.actualizarComprobante.mockResolvedValue(updatedDetalle);

      // Act
      const result = await controller.actualizarComprobante(
        comprobanteId,
        actualizarComprobanteDto,
        mockRequest,
      );

      // Assert
      expect(result.cliente.id).toBe('cliente-2');
      expect(result.cliente.nombre).toBe('María García');
    });

    it('should handle conversion to anonymous venta (terceroId = null)', async () => {
      // Arrange
      const anonymousDto: ActualizarComprobanteDto = {
        terceroId: null,
      };
      const anonymousDetalle = {
        ...mockDetalleVenta,
        cliente: null,
      };
      mockVentasService.actualizarComprobante.mockResolvedValue(
        anonymousDetalle,
      );

      // Act
      const result = await controller.actualizarComprobante(
        comprobanteId,
        anonymousDto,
        mockRequest,
      );

      // Assert
      expect(service.actualizarComprobante).toHaveBeenCalledWith(
        comprobanteId,
        anonymousDto,
        'empresa-123',
      );
      expect(result.cliente).toBeNull();
    });

    it('should pass correct comprobanteId as string parameter', async () => {
      // Arrange
      const uuidComprobanteId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      mockVentasService.actualizarComprobante.mockResolvedValue(
        mockDetalleVenta,
      );

      // Act
      await controller.actualizarComprobante(
        uuidComprobanteId,
        actualizarComprobanteDto,
        mockRequest,
      );

      // Assert
      expect(service.actualizarComprobante).toHaveBeenCalledWith(
        uuidComprobanteId,
        actualizarComprobanteDto,
        'empresa-123',
      );
    });
  });

  describe('GET /ventas/deudas/:clienteId (getDeudasCliente)', () => {
    const clienteId = 'cliente-1';

    it('should get deudas cliente and extract empresaId from req.user', async () => {
      // Arrange
      mockVentasService.getDeudasCliente.mockResolvedValue([mockDeudaCliente]);

      // Act
      const result = await controller.getDeudasCliente(clienteId, mockRequest);

      // Assert
      expect(service.getDeudasCliente).toHaveBeenCalledWith(
        clienteId,
        'empresa-123',
      );
      expect(service.getDeudasCliente).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockDeudaCliente]);
    });

    it('should return array of deuda cliente items', async () => {
      // Arrange
      const multipleDeudas: DeudaClienteDto[] = [
        mockDeudaCliente,
        {
          ...mockDeudaCliente,
          comprobanteId: 'comp-2',
          numero: 'V-002',
          saldoPendiente: 1000,
        },
        {
          ...mockDeudaCliente,
          comprobanteId: 'comp-3',
          numero: 'V-003',
          saldoPendiente: 250,
        },
      ];
      mockVentasService.getDeudasCliente.mockResolvedValue(multipleDeudas);

      // Act
      const result = await controller.getDeudasCliente(clienteId, mockRequest);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('comprobanteId');
      expect(result[0]).toHaveProperty('saldoPendiente');
      expect(result[1].saldoPendiente).toBe(1000);
    });

    it('should return empty array when cliente has no deudas', async () => {
      // Arrange
      mockVentasService.getDeudasCliente.mockResolvedValue([]);

      // Act
      const result = await controller.getDeudasCliente(clienteId, mockRequest);

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle different clienteId formats', async () => {
      // Arrange
      const uuidClienteId = 'f1e2d3c4-b5a6-7890-1234-567890abcdef';
      mockVentasService.getDeudasCliente.mockResolvedValue([mockDeudaCliente]);

      // Act
      await controller.getDeudasCliente(uuidClienteId, mockRequest);

      // Assert
      expect(service.getDeudasCliente).toHaveBeenCalledWith(
        uuidClienteId,
        'empresa-123',
      );
    });

    it('should return only ventas with saldo pendiente', async () => {
      // Arrange
      const deudasPendientes: DeudaClienteDto[] = [
        { ...mockDeudaCliente, estadoPago: 'PENDIENTE', saldoPendiente: 1000 },
        { ...mockDeudaCliente, estadoPago: 'PARCIAL', saldoPendiente: 500 },
      ];
      mockVentasService.getDeudasCliente.mockResolvedValue(deudasPendientes);

      // Act
      const result = await controller.getDeudasCliente(clienteId, mockRequest);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every((d) => d.saldoPendiente > 0)).toBe(true);
    });
  });

  describe('GET /ventas/:id (getDetalleVenta)', () => {
    const ventaId = 'comp-1';

    it('should get detalle venta and extract empresaId from req.user', async () => {
      // Arrange
      mockVentasService.getDetalleVenta.mockResolvedValue(mockDetalleVenta);

      // Act
      const result = await controller.getDetalleVenta(ventaId, mockRequest);

      // Assert
      expect(service.getDetalleVenta).toHaveBeenCalledWith(
        ventaId,
        'empresa-123',
      );
      expect(service.getDetalleVenta).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockDetalleVenta);
    });

    it('should return complete venta details with all properties', async () => {
      // Arrange
      mockVentasService.getDetalleVenta.mockResolvedValue(mockDetalleVenta);

      // Act
      const result = await controller.getDetalleVenta(ventaId, mockRequest);

      // Assert
      expect(result).toHaveProperty('comprobante');
      expect(result).toHaveProperty('cliente');
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('cobros');
      expect(result.comprobante.id).toBe('comp-1');
      expect(result.cliente.nombre).toBe('Juan Pérez');
      expect(result.items).toHaveLength(1);
      expect(result.cobros).toHaveLength(1);
    });

    it('should return venta with multiple items', async () => {
      // Arrange
      const detalleConMultiplesItems = {
        ...mockDetalleVenta,
        items: [
          {
            id: 'item-1',
            productoNombre: 'Producto A',
            cantidad: 2,
            precioUnitario: 500,
            subtotal: 1000,
          },
          {
            id: 'item-2',
            productoNombre: 'Producto B',
            cantidad: 1,
            precioUnitario: 300,
            subtotal: 300,
          },
          {
            id: 'item-3',
            productoNombre: 'Producto C',
            cantidad: 5,
            precioUnitario: 100,
            subtotal: 500,
          },
        ],
      };
      mockVentasService.getDetalleVenta.mockResolvedValue(
        detalleConMultiplesItems,
      );

      // Act
      const result = await controller.getDetalleVenta(ventaId, mockRequest);

      // Assert
      expect(result.items).toHaveLength(3);
      expect(result.items[0].productoNombre).toBe('Producto A');
      expect(result.items[1].productoNombre).toBe('Producto B');
      expect(result.items[2].productoNombre).toBe('Producto C');
    });

    it('should return venta with multiple cobros history', async () => {
      // Arrange
      const detalleConMultiplesCobros = {
        ...mockDetalleVenta,
        cobros: [
          {
            id: 'cobro-1',
            monto: 300,
            metodoPago: 'EFECTIVO',
            fecha: new Date('2025-01-15'),
          },
          {
            id: 'cobro-2',
            monto: 200,
            metodoPago: 'TARJETA',
            fecha: new Date('2025-01-16'),
          },
          {
            id: 'cobro-3',
            monto: 500,
            metodoPago: 'TRANSFERENCIA',
            fecha: new Date('2025-01-17'),
          },
        ],
      };
      mockVentasService.getDetalleVenta.mockResolvedValue(
        detalleConMultiplesCobros,
      );

      // Act
      const result = await controller.getDetalleVenta(ventaId, mockRequest);

      // Assert
      expect(result.cobros).toHaveLength(3);
      expect(result.cobros[0].metodoPago).toBe('EFECTIVO');
      expect(result.cobros[1].metodoPago).toBe('TARJETA');
      expect(result.cobros[2].metodoPago).toBe('TRANSFERENCIA');
    });

    it('should return anonymous venta (without cliente)', async () => {
      // Arrange
      const detalleAnonymous = {
        ...mockDetalleVenta,
        cliente: null,
      };
      mockVentasService.getDetalleVenta.mockResolvedValue(detalleAnonymous);

      // Act
      const result = await controller.getDetalleVenta(ventaId, mockRequest);

      // Assert
      expect(result.cliente).toBeNull();
      expect(result.comprobante).toBeDefined();
      expect(result.items).toBeDefined();
    });

    it('should handle different ventaId formats', async () => {
      // Arrange
      const uuidVentaId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      mockVentasService.getDetalleVenta.mockResolvedValue(mockDetalleVenta);

      // Act
      await controller.getDetalleVenta(uuidVentaId, mockRequest);

      // Assert
      expect(service.getDetalleVenta).toHaveBeenCalledWith(
        uuidVentaId,
        'empresa-123',
      );
    });
  });

  describe('Edge Cases - empresaId extraction', () => {
    it('should handle empresaId extraction from different user structures', async () => {
      // Arrange
      const customRequest = {
        user: {
          empresaId: 'custom-empresa-id-xyz',
          userId: 'custom-user-789',
          email: 'user@example.com',
        },
      };
      mockVentasService.listarVentas.mockResolvedValue([mockVentaListItem]);

      // Act
      await controller.listarVentas({}, customRequest);

      // Assert
      expect(service.listarVentas).toHaveBeenCalledWith(
        {},
        'custom-empresa-id-xyz',
      );
    });

    it('should consistently use empresaId across all endpoints', async () => {
      // Arrange
      const testEmpresaId = 'consistent-empresa-123';
      const testRequest = {
        user: {
          empresaId: testEmpresaId,
        },
      };

      mockVentasService.crearVenta.mockResolvedValue(mockVentaResponse);
      mockVentasService.listarVentas.mockResolvedValue([mockVentaListItem]);
      mockVentasService.registrarNuevoCobro.mockResolvedValue(
        mockCobroResponse,
      );
      mockVentasService.actualizarCobro.mockResolvedValue(mockCobroResponse);
      mockVentasService.actualizarComprobante.mockResolvedValue(
        mockDetalleVenta,
      );
      mockVentasService.getDeudasCliente.mockResolvedValue([mockDeudaCliente]);
      mockVentasService.getDetalleVenta.mockResolvedValue(mockDetalleVenta);

      // Act
      await controller.crearVenta({} as CrearVentaDto, testRequest);
      await controller.listarVentas({}, testRequest);
      await controller.registrarCobro({} as RegistrarCobroDto, testRequest);
      await controller.actualizarCobro(
        '1',
        {} as ActualizarCobroDto,
        testRequest,
      );
      await controller.actualizarComprobante(
        '1',
        {} as ActualizarComprobanteDto,
        testRequest,
      );
      await controller.getDeudasCliente('1', testRequest);
      await controller.getDetalleVenta('1', testRequest);

      // Assert - All service calls should have used the same empresaId
      expect(service.crearVenta).toHaveBeenCalledWith(
        expect.anything(),
        testEmpresaId,
      );
      expect(service.listarVentas).toHaveBeenCalledWith(
        expect.anything(),
        testEmpresaId,
      );
      expect(service.registrarNuevoCobro).toHaveBeenCalledWith(
        expect.anything(),
        testEmpresaId,
      );
      expect(service.actualizarCobro).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        testEmpresaId,
      );
      expect(service.actualizarComprobante).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        testEmpresaId,
      );
      expect(service.getDeudasCliente).toHaveBeenCalledWith(
        expect.anything(),
        testEmpresaId,
      );
      expect(service.getDetalleVenta).toHaveBeenCalledWith(
        expect.anything(),
        testEmpresaId,
      );
    });
  });

  describe('Service Method Call Verification', () => {
    it('should never call service methods with undefined empresaId', async () => {
      // Arrange
      mockVentasService.listarVentas.mockResolvedValue([mockVentaListItem]);

      // Act
      await controller.listarVentas({}, mockRequest);

      // Assert
      const callArgs = mockVentasService.listarVentas.mock.calls[0];
      expect(callArgs[1]).toBeDefined();
      expect(callArgs[1]).not.toBeNull();
      expect(typeof callArgs[1]).toBe('string');
    });

    it('should pass DTOs as first parameter and empresaId as last parameter', async () => {
      // Arrange
      const dto: CrearVentaDto = {
        clienteId: 'cliente-1',
        items: [],
        montoPagado: 1000,
        metodoPago: 'EFECTIVO',
      };
      mockVentasService.crearVenta.mockResolvedValue(mockVentaResponse);

      // Act
      await controller.crearVenta(dto, mockRequest);

      // Assert
      const [firstArg, secondArg] = mockVentasService.crearVenta.mock.calls[0];
      expect(firstArg).toBe(dto);
      expect(secondArg).toBe('empresa-123');
    });

    it('should pass id as first parameter for entity-specific operations', async () => {
      // Arrange
      const entityId = 'entity-123';
      const dto: ActualizarCobroDto = { metodoPago: 'EFECTIVO' };
      mockVentasService.actualizarCobro.mockResolvedValue(mockCobroResponse);

      // Act
      await controller.actualizarCobro(entityId, dto, mockRequest);

      // Assert
      const [firstArg, secondArg, thirdArg] =
        mockVentasService.actualizarCobro.mock.calls[0];
      expect(firstArg).toBe(entityId);
      expect(secondArg).toBe(dto);
      expect(thirdArg).toBe('empresa-123');
    });
  });
});
