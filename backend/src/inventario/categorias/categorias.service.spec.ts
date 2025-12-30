import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CategoriasService } from './categorias.service';
import { Categoria } from './entities/categoria.entity';
import { Producto } from '../productos/entities/producto.entity';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

describe('CategoriasService', () => {
  let service: CategoriasService;
  // Repository disponible para mocking si se necesita en el futuro
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

  const mockProducto: Producto = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    codigoBarras: '7790001234567',
    nombre: 'Coca Cola',
    precioCosto: 100,
    precioVenta: 150,
    stockActual: 50,
    stockMinimo: 10,
    categoriaId: '123e4567-e89b-12d3-a456-426614174001',
    categoria: null,
    empresaId: mockEmpresaId,
    empresa: null,
    eliminado: false,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
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

  const mockCategoriaRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriasService,
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

    service = await module.resolve<CategoriasService>(CategoriasService);
    _categoriaRepository = module.get<Repository<Categoria>>(
      getRepositoryToken(Categoria),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateCategoriaDto = {
      nombre: 'Bebidas',
    };

    it('debe crear una categoría exitosamente', async () => {
      mockCategoriaRepository.findOne.mockResolvedValue(null); // No existe
      mockCategoriaRepository.create.mockReturnValue(mockCategoria);
      mockCategoriaRepository.save.mockResolvedValue(mockCategoria);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCategoria);
      expect(mockCategoriaRepository.findOne).toHaveBeenCalledWith({
        where: {
          nombre: createDto.nombre,
          empresaId: mockEmpresaId,
        },
      });
    });

    it('debe lanzar error si ya existe una categoría activa con el mismo nombre', async () => {
      mockCategoriaRepository.findOne.mockResolvedValue(mockCategoria);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Ya existe una categoría con el nombre',
      );
    });

    it('debe lanzar error si existe una categoría eliminada con el mismo nombre', async () => {
      const categoriaEliminada = {
        ...mockCategoria,
        eliminado: true,
      };
      mockCategoriaRepository.findOne.mockResolvedValue(categoriaEliminada);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Existe una categoría eliminada con ese nombre',
      );
    });
  });

  describe('findAll', () => {
    it('debe retornar todas las categorías activas del tenant', async () => {
      const categorias = [mockCategoria];
      mockCategoriaRepository.find.mockResolvedValue(categorias);

      const result = await service.findAll();

      expect(result).toEqual(categorias);
      expect(mockCategoriaRepository.find).toHaveBeenCalledWith({
        where: {
          empresaId: mockEmpresaId,
          eliminado: false,
        },
        order: {
          nombre: 'ASC',
        },
      });
    });
  });

  describe('findAllPaginated', () => {
    it('debe retornar categorías paginadas', async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const categorias = [mockCategoria];
      const total = 1;

      mockCategoriaRepository.findAndCount.mockResolvedValue([
        categorias,
        total,
      ]);

      const result = await service.findAllPaginated(paginationDto);

      expect(result.data).toEqual(categorias);
      expect(result.total).toBe(total);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('debe respetar el límite máximo de paginación', async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 1000 }; // Más que el máximo
      mockCategoriaRepository.findAndCount.mockResolvedValue([
        [mockCategoria],
        1,
      ]);

      const result = await service.findAllPaginated(paginationDto);

      // El límite debe ajustarse al máximo permitido (100)
      expect(result.limit).toBeLessThanOrEqual(100);
    });
  });

  describe('findOne', () => {
    it('debe retornar una categoría por ID', async () => {
      mockCategoriaRepository.findOne.mockResolvedValue(mockCategoria);

      const result = await service.findOne(mockCategoria.id);

      expect(result).toEqual(mockCategoria);
      expect(mockCategoriaRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: mockCategoria.id,
          empresaId: mockEmpresaId,
          eliminado: false,
        },
      });
    });

    it('debe lanzar NotFoundException si la categoría no existe', async () => {
      mockCategoriaRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        'Categoría no encontrada',
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateCategoriaDto = {
      nombre: 'Bebidas y Gaseosas',
    };

    it('debe actualizar una categoría exitosamente', async () => {
      mockCategoriaRepository.findOne
        .mockResolvedValueOnce(mockCategoria) // findOne inicial
        .mockResolvedValueOnce(null); // validación de nombre único

      mockCategoriaRepository.save.mockResolvedValue({
        ...mockCategoria,
        ...updateDto,
      });

      const result = await service.update(mockCategoria.id, updateDto);

      expect(result.nombre).toBe(updateDto.nombre);
    });

    it('debe lanzar error si el nuevo nombre ya existe', async () => {
      // Crear una categoría fresca para este test
      const categoriaActual = {
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

      const categoriaExistente = {
        ...categoriaActual,
        id: 'otro-id-diferente',
        nombre: 'Bebidas y Gaseosas',
      };

      mockCategoriaRepository.findOne
        .mockResolvedValueOnce(categoriaActual) // findOne inicial
        .mockResolvedValueOnce(categoriaExistente); // validación de nombre

      await expect(
        service.update(categoriaActual.id, updateDto),
      ).rejects.toThrow('Ya existe una categoría con el nombre');
    });

    it('no debe lanzar error si el nombre no cambia', async () => {
      const updateDtoSinCambio: UpdateCategoriaDto = {
        nombre: mockCategoria.nombre, // mismo nombre
      };

      mockCategoriaRepository.findOne.mockResolvedValue(mockCategoria);
      mockCategoriaRepository.save.mockResolvedValue(mockCategoria);

      const result = await service.update(mockCategoria.id, updateDtoSinCambio);

      expect(result).toEqual(mockCategoria);
    });
  });

  describe('softDelete', () => {
    it('debe eliminar lógicamente una categoría sin productos', async () => {
      const categoriaSinProductos = {
        ...mockCategoria,
        productos: [],
      };

      mockCategoriaRepository.findOne.mockResolvedValue(categoriaSinProductos);
      mockCategoriaRepository.save.mockResolvedValue({
        ...categoriaSinProductos,
        eliminado: true,
      });

      await service.softDelete(mockCategoria.id);

      expect(mockCategoriaRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          eliminado: true,
          deletedAt: expect.any(Date),
        }),
      );
    });

    it('debe lanzar error si la categoría tiene productos activos (RESTRICT)', async () => {
      const categoriaConProductos = {
        ...mockCategoria,
        productos: [mockProducto],
      };

      mockCategoriaRepository.findOne.mockResolvedValue(categoriaConProductos);

      await expect(service.softDelete(mockCategoria.id)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.softDelete(mockCategoria.id)).rejects.toThrow(
        'tiene 1 producto(s) asociado(s)',
      );
    });

    it('debe permitir eliminar categoría con productos eliminados', async () => {
      const productoEliminado = {
        ...mockProducto,
        eliminado: true,
      };

      const categoriaConProductosEliminados = {
        ...mockCategoria,
        productos: [productoEliminado],
      };

      mockCategoriaRepository.findOne.mockResolvedValue(
        categoriaConProductosEliminados,
      );
      mockCategoriaRepository.save.mockResolvedValue({
        ...categoriaConProductosEliminados,
        eliminado: true,
      });

      await service.softDelete(mockCategoria.id);

      expect(mockCategoriaRepository.save).toHaveBeenCalled();
    });

    it('debe lanzar error si la categoría no existe', async () => {
      mockCategoriaRepository.findOne.mockResolvedValue(null);

      await expect(service.softDelete('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar error si la categoría ya está eliminada', async () => {
      mockCategoriaRepository.findOne.mockResolvedValue({
        ...mockCategoria,
        eliminado: true,
        productos: [],
      });

      await expect(service.softDelete(mockCategoria.id)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.softDelete(mockCategoria.id)).rejects.toThrow(
        'ya está eliminada',
      );
    });
  });

  describe('restore', () => {
    it('debe restaurar una categoría eliminada', async () => {
      const categoriaEliminada = {
        ...mockCategoria,
        eliminado: true,
        deletedAt: new Date(),
      };

      mockCategoriaRepository.findOne
        .mockResolvedValueOnce(categoriaEliminada) // findOne inicial
        .mockResolvedValueOnce(null); // validación nombre único

      mockCategoriaRepository.save.mockResolvedValue({
        ...categoriaEliminada,
        eliminado: false,
        deletedAt: null,
      });

      const result = await service.restore(mockCategoria.id);

      expect(result.eliminado).toBe(false);
      expect(result.deletedAt).toBeNull();
    });

    it('debe lanzar error si ya existe categoría activa con el mismo nombre', async () => {
      const categoriaEliminada = {
        ...mockCategoria,
        eliminado: true,
      };

      const categoriaActiva = {
        ...mockCategoria,
        id: 'otro-id',
        eliminado: false,
      };

      mockCategoriaRepository.findOne
        .mockResolvedValueOnce(categoriaEliminada)
        .mockResolvedValueOnce(categoriaActiva);

      await expect(service.restore(mockCategoria.id)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.restore(mockCategoria.id)).rejects.toThrow(
        'Ya existe una categoría activa con el nombre',
      );
    });

    it('debe lanzar error si la categoría no está eliminada', async () => {
      mockCategoriaRepository.findOne.mockResolvedValue(mockCategoria);

      await expect(service.restore(mockCategoria.id)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.restore(mockCategoria.id)).rejects.toThrow(
        'no está eliminada',
      );
    });
  });

  describe('findDeleted', () => {
    it('debe retornar solo categorías eliminadas', async () => {
      const categoriaEliminada = {
        ...mockCategoria,
        eliminado: true,
        deletedAt: new Date(),
      };

      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      mockCategoriaRepository.findAndCount.mockResolvedValue([
        [categoriaEliminada],
        1,
      ]);

      const result = await service.findDeleted(paginationDto);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].eliminado).toBe(true);
      expect(mockCategoriaRepository.findAndCount).toHaveBeenCalledWith({
        where: {
          empresaId: mockEmpresaId,
          eliminado: true,
        },
        order: {
          deletedAt: 'DESC',
        },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('countProductos', () => {
    it('debe contar solo productos activos de la categoría', async () => {
      const productoEliminado = {
        ...mockProducto,
        id: 'producto-2',
        eliminado: true,
      };

      const categoriaConProductos = {
        ...mockCategoria,
        productos: [mockProducto, productoEliminado],
      };

      mockCategoriaRepository.findOne.mockResolvedValue(categoriaConProductos);

      const count = await service.countProductos(mockCategoria.id);

      // Solo debe contar el producto activo
      expect(count).toBe(1);
    });

    it('debe lanzar error si la categoría no existe', async () => {
      mockCategoriaRepository.findOne.mockResolvedValue(null);

      await expect(service.countProductos('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe retornar 0 si la categoría no tiene productos', async () => {
      const categoriaSinProductos = {
        ...mockCategoria,
        productos: [],
      };

      mockCategoriaRepository.findOne.mockResolvedValue(categoriaSinProductos);

      const count = await service.countProductos(mockCategoria.id);

      expect(count).toBe(0);
    });
  });
});
