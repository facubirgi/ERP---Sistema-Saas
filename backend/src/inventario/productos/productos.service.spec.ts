import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ProductosService } from './productos.service';
import { Producto } from './entities/producto.entity';
import { Categoria } from '../categorias/entities/categoria.entity';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { SearchProductoDto } from './dto/search-producto.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

describe('ProductosService', () => {
  let service: ProductosService;
  // Repositorios disponibles para mocking si se necesitan en el futuro
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let _productoRepository: Repository<Producto>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let _categoriaRepository: Repository<Categoria>;

  const mockEmpresaId = '123e4567-e89b-12d3-a456-426614174000';
  const mockRequest = {
    user: {
      empresaId: mockEmpresaId,
      tenantId: mockEmpresaId,
    },
    tenantId: mockEmpresaId,
  };

  const mockCategoria: Categoria = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    nombre: 'Bebidas',
    empresaId: mockEmpresaId,
    eliminado: false,
    deletedAt: null,
    productos: [],
    empresa: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProducto: Producto = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    codigoBarras: '7790001234567',
    nombre: 'Coca Cola',
    precioCosto: 100,
    precioVenta: 150,
    stockActual: 50,
    stockMinimo: 10,
    categoriaId: mockCategoria.id,
    categoria: mockCategoria,
    empresaId: mockEmpresaId,
    empresa: null,
    eliminado: false,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProductoRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(),
    remove: jest.fn(),
  };

  const mockCategoriaRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductosService,
        {
          provide: getRepositoryToken(Producto),
          useValue: mockProductoRepository,
        },
        {
          provide: getRepositoryToken(Categoria),
          useValue: mockCategoriaRepository,
        },
        {
          provide: REQUEST,
          useValue: mockRequest,
        },
      ],
    }).compile();

    service = await module.resolve<ProductosService>(ProductosService);
    _productoRepository = module.get<Repository<Producto>>(
      getRepositoryToken(Producto),
    );
    _categoriaRepository = module.get<Repository<Categoria>>(
      getRepositoryToken(Categoria),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateProductoDto = {
      codigoBarras: '7790001234567',
      nombre: 'Coca Cola',
      precioCosto: 100,
      precioVenta: 150,
      stockActual: 50,
      stockMinimo: 10,
      categoriaId: mockCategoria.id,
    };

    it('debe crear un producto exitosamente', async () => {
      mockCategoriaRepository.findOne.mockResolvedValue(mockCategoria);
      mockProductoRepository.findOne.mockResolvedValue(null); // código de barras único
      mockProductoRepository.create.mockReturnValue(mockProducto);
      mockProductoRepository.save.mockResolvedValue(mockProducto);

      const result = await service.create(createDto);

      expect(result).toEqual(mockProducto);
      expect(mockCategoriaRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: createDto.categoriaId,
          empresaId: mockEmpresaId,
          eliminado: false,
        },
      });
    });

    it('debe lanzar BadRequestException si la categoría no existe', async () => {
      mockCategoriaRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Categoría no encontrada o no pertenece a su empresa',
      );
    });

    it('debe lanzar BadRequestException si el margen es negativo', async () => {
      mockCategoriaRepository.findOne.mockResolvedValue(mockCategoria);

      const dtoMalMargen: CreateProductoDto = {
        ...createDto,
        precioCosto: 200,
        precioVenta: 100, // margen negativo
      };

      await expect(service.create(dtoMalMargen)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar BadRequestException si el código de barras ya existe', async () => {
      mockCategoriaRepository.findOne.mockResolvedValue(mockCategoria);
      mockProductoRepository.findOne.mockResolvedValue(mockProducto); // código ya existe

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Ya existe un producto con el código de barras',
      );
    });
  });

  describe('findAll', () => {
    it('debe retornar todos los productos activos del tenant', async () => {
      const productos = [mockProducto];
      mockProductoRepository.find.mockResolvedValue(productos);

      const result = await service.findAll();

      expect(result).toEqual(productos);
      expect(mockProductoRepository.find).toHaveBeenCalledWith({
        where: {
          empresaId: mockEmpresaId,
          eliminado: false,
        },
        relations: ['categoria'],
        order: {
          nombre: 'ASC',
        },
      });
    });
  });

  describe('findAllPaginated', () => {
    it('debe retornar productos paginados', async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const productos = [mockProducto];
      const total = 1;

      mockProductoRepository.findAndCount.mockResolvedValue([productos, total]);

      const result = await service.findAllPaginated(paginationDto);

      expect(result.data).toEqual(productos);
      expect(result.total).toBe(total);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });

  describe('findOne', () => {
    it('debe retornar un producto por ID', async () => {
      mockProductoRepository.findOne.mockResolvedValue(mockProducto);

      const result = await service.findOne(mockProducto.id);

      expect(result).toEqual(mockProducto);
      expect(mockProductoRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: mockProducto.id,
          empresaId: mockEmpresaId,
          eliminado: false,
        },
        relations: ['categoria'],
      });
    });

    it('debe lanzar NotFoundException si el producto no existe', async () => {
      mockProductoRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        'Producto no encontrado',
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateProductoDto = {
      nombre: 'Coca Cola Zero',
      precioVenta: 160,
    };

    it('debe actualizar un producto exitosamente', async () => {
      mockProductoRepository.findOne.mockResolvedValue(mockProducto);
      mockProductoRepository.save.mockResolvedValue({
        ...mockProducto,
        ...updateDto,
      });

      const result = await service.update(mockProducto.id, updateDto);

      expect(result.nombre).toBe(updateDto.nombre);
      expect(result.precioVenta).toBe(updateDto.precioVenta);
    });

    it('debe aplicar margen inteligente al actualizar solo precio de costo', async () => {
      const productoConMargen = {
        ...mockProducto,
        precioCosto: 100,
        precioVenta: 150,
      };
      mockProductoRepository.findOne.mockResolvedValue(productoConMargen);
      mockProductoRepository.save.mockResolvedValue(productoConMargen);

      const updateDtoCosto: UpdateProductoDto = {
        precioCosto: 120, // de 100 a 120 (+20%)
      };

      await service.update(mockProducto.id, updateDtoCosto);

      // Margen actual: (150-100)/100 = 50%
      // Nuevo precio venta: 120 * 1.5 = 180
      expect(updateDtoCosto.precioVenta).toBe(180);
    });

    it('debe lanzar error si margen actual es negativo al actualizar costo', async () => {
      const productoMargenNegativo = {
        ...mockProducto,
        precioCosto: 200,
        precioVenta: 100,
      };
      mockProductoRepository.findOne.mockResolvedValue(productoMargenNegativo);

      const updateDtoCosto: UpdateProductoDto = {
        precioCosto: 220,
      };

      await expect(
        service.update(mockProducto.id, updateDtoCosto),
      ).rejects.toThrow('margen negativo');
    });
  });

  describe('search', () => {
    const searchDto: SearchProductoDto = {
      termino: '7790001234567',
      page: 1,
      limit: 10,
    };

    it('debe retornar resultado exacto por código de barras', async () => {
      mockProductoRepository.findOne.mockResolvedValue(mockProducto);

      const result = await service.search(searchDto);

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(mockProducto);
      expect(result.total).toBe(1);
    });

    it('debe buscar por nombre si no encuentra por código', async () => {
      const searchDtoNombre: SearchProductoDto = {
        termino: 'Coca',
        page: 1,
        limit: 10,
      };

      mockProductoRepository.findOne.mockResolvedValue(null); // No hay match por código

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProducto], 1]),
      };

      mockProductoRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.search(searchDtoNombre);

      expect(result.data).toHaveLength(1);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'producto.nombre ILIKE :termino',
        { termino: '%Coca%' },
      );
    });
  });

  describe('hardDelete', () => {
    it('debe eliminar permanentemente un producto', async () => {
      mockProductoRepository.findOne.mockResolvedValue(mockProducto);
      mockProductoRepository.remove = jest.fn().mockResolvedValue(mockProducto);

      await service.hardDelete(mockProducto.id);

      expect(mockProductoRepository.remove).toHaveBeenCalledWith(mockProducto);
    });

    it('debe lanzar error si el producto no existe', async () => {
      mockProductoRepository.findOne.mockResolvedValue(null);

      await expect(service.hardDelete('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('restore', () => {
    it('debe lanzar error indicando que no se puede restaurar (hardDelete)', async () => {
      await expect(service.restore(mockProducto.id)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.restore(mockProducto.id)).rejects.toThrow(
        'No se puede restaurar un producto eliminado',
      );
    });
  });

  describe('findBajoStock', () => {
    it('debe retornar productos con stock bajo', async () => {
      const productoStockBajo = {
        ...mockProducto,
        stockActual: 5,
        stockMinimo: 10,
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[productoStockBajo], 1]),
      };

      mockProductoRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const result = await service.findBajoStock(paginationDto);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].stockActual).toBeLessThanOrEqual(
        result.data[0].stockMinimo,
      );
    });
  });
});
