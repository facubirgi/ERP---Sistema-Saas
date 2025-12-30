import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Productos API (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let agent: request.SuperAgentTest;
  let empresaId: string;
  let categoriaId: string;
  let productoId: string;

  // Datos de usuario de prueba
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'Password123!',
    nombre: 'Test User',
  };

  // Datos de empresa de prueba
  const testEmpresa = {
    nombre: `Empresa Test ${Date.now()}`,
    slug: `empresa-test-${Date.now()}`,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Aplicar pipes de validación como en main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Crear agente que mantiene cookies entre requests
    agent = request.agent(app.getHttpServer());

    // Registrar usuario y empresa de prueba
    // El backend configura httpOnly cookie automáticamente
    const registerResponse = await agent.post('/auth/register').send({
      ...testUser,
      empresa: testEmpresa,
    });

    if (registerResponse.status === 201) {
      empresaId = registerResponse.body.user.empresaId;
    }

    // Crear una categoría de prueba
    // El agente envía automáticamente la cookie de autenticación
    const categoriaResponse = await agent.post('/categorias').send({
      nombre: 'Bebidas Test',
    });

    if (categoriaResponse.status === 201) {
      categoriaId = categoriaResponse.body.id;
    }
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    if (dataSource && dataSource.isInitialized) {
      // Eliminar datos en orden inverso por las relaciones
      await dataSource.query(`DELETE FROM producto WHERE empresa_id = $1`, [
        empresaId,
      ]);
      await dataSource.query(`DELETE FROM categoria WHERE empresa_id = $1`, [
        empresaId,
      ]);
      await dataSource.query(`DELETE FROM usuario WHERE empresa_id = $1`, [
        empresaId,
      ]);
      await dataSource.query(`DELETE FROM empresa WHERE id = $1`, [empresaId]);
    }

    await app.close();
  });

  describe('POST /productos - Crear producto', () => {
    it('debe crear un producto exitosamente', async () => {
      const createDto = {
        codigoBarras: '7790001234567',
        nombre: 'Coca Cola 500ml',
        precioCosto: 100,
        precioVenta: 150,
        stockActual: 50,
        stockMinimo: 10,
        categoriaId,
      };

      const response = await agent
        .post('/productos')
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.nombre).toBe(createDto.nombre);
      expect(response.body.codigoBarras).toBe(createDto.codigoBarras);
      expect(response.body.precioCosto).toBe(createDto.precioCosto);
      expect(response.body.precioVenta).toBe(createDto.precioVenta);
      expect(response.body.empresaId).toBe(empresaId);
      expect(response.body.eliminado).toBe(false);

      // Guardar ID para siguientes tests
      productoId = response.body.id;
    });

    it('debe rechazar producto con margen negativo', async () => {
      const createDto = {
        nombre: 'Producto Mal Margen',
        precioCosto: 200,
        precioVenta: 100, // margen negativo
        stockActual: 10,
        stockMinimo: 5,
        categoriaId,
      };

      const response = await agent
        .post('/productos')
        .send(createDto)
        .expect(400);

      expect(response.body.message).toContain('margen');
    });

    it('debe rechazar producto con categoría inválida', async () => {
      const createDto = {
        nombre: 'Producto Sin Categoría',
        precioCosto: 100,
        precioVenta: 150,
        stockActual: 10,
        stockMinimo: 5,
        categoriaId: '123e4567-e89b-12d3-a456-000000000000', // UUID inválido
      };

      const response = await agent
        .post('/productos')
        .send(createDto)
        .expect(400);

      expect(response.body.message).toContain('Categoría no encontrada');
    });

    it('debe rechazar código de barras duplicado', async () => {
      const createDto = {
        codigoBarras: '7790001234567', // Ya usado
        nombre: 'Otro Producto',
        precioCosto: 100,
        precioVenta: 150,
        stockActual: 10,
        stockMinimo: 5,
        categoriaId,
      };

      const response = await agent
        .post('/productos')
        .send(createDto)
        .expect(400);

      expect(response.body.message).toContain('código de barras');
    });

    it('debe rechazar sin autenticación', async () => {
      const createDto = {
        nombre: 'Producto Sin Auth',
        precioCosto: 100,
        precioVenta: 150,
        stockActual: 10,
        stockMinimo: 5,
        categoriaId,
      };

      await request(app.getHttpServer())
        .post('/productos')
        .send(createDto)
        .expect(401);
    });
  });

  describe('GET /productos - Listar productos', () => {
    it('debe listar productos con paginación', async () => {
      const response = await agent
        .get('/productos')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('totalPages');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(10);
    });

    it('debe retornar solo productos del tenant autenticado', async () => {
      const response = await agent.get('/productos').expect(200);

      // Todos los productos deben tener el mismo empresaId
      response.body.data.forEach((producto: any) => {
        expect(producto.empresaId).toBe(empresaId);
      });
    });
  });

  describe('GET /productos/search - Búsqueda híbrida', () => {
    it('debe encontrar producto por código de barras exacto', async () => {
      const response = await agent
        .get('/productos/search')
        .query({ termino: '7790001234567' })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].codigoBarras).toBe('7790001234567');
      expect(response.body.total).toBe(1);
    });

    it('debe encontrar productos por nombre parcial', async () => {
      const response = await agent
        .get('/productos/search')
        .query({ termino: 'Coca' })
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((producto: any) => {
        expect(producto.nombre.toLowerCase()).toContain('coca');
      });
    });

    it('debe retornar array vacío si no encuentra coincidencias', async () => {
      const response = await agent
        .get('/productos/search')
        .query({ termino: 'ProductoInexistente123XYZ' })
        .expect(200);

      expect(response.body.data).toHaveLength(0);
      expect(response.body.total).toBe(0);
    });
  });

  describe('GET /productos/:id - Obtener producto', () => {
    it('debe obtener un producto por ID', async () => {
      const response = await agent.get(`/productos/${productoId}`).expect(200);

      expect(response.body.id).toBe(productoId);
      expect(response.body).toHaveProperty('categoria');
      expect(response.body.categoria).toHaveProperty('nombre');
    });

    it('debe retornar 404 si el producto no existe', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-000000000999';

      await request(app.getHttpServer())
        .get(`/productos/${fakeId}`)
        .expect(404);
    });

    it('debe rechazar UUID inválido', async () => {
      await request(app.getHttpServer())
        .get('/productos/invalid-uuid')
        .expect(400);
    });
  });

  describe('PUT /productos/:id - Actualizar producto', () => {
    it('debe actualizar nombre del producto', async () => {
      const updateDto = {
        nombre: 'Coca Cola 500ml - Actualizada',
      };

      const response = await agent
        .put(`/productos/${productoId}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.nombre).toBe(updateDto.nombre);
    });

    it('debe aplicar margen inteligente al actualizar solo precio de costo', async () => {
      // Primero obtener el producto actual
      const currentProduct = await request(app.getHttpServer())
        .get(`/productos/${productoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const margenActual =
        (currentProduct.body.precioVenta - currentProduct.body.precioCosto) /
        currentProduct.body.precioCosto;

      const nuevoPrecioCosto = 120;
      const precioVentaEsperado =
        Math.round(nuevoPrecioCosto * (1 + margenActual) * 100) / 100;

      const updateDto = {
        precioCosto: nuevoPrecioCosto,
      };

      const response = await agent
        .put(`/productos/${productoId}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.precioCosto).toBe(nuevoPrecioCosto);
      expect(response.body.precioVenta).toBe(precioVentaEsperado);
    });

    it('debe rechazar margen negativo en actualización', async () => {
      const updateDto = {
        precioCosto: 200,
        precioVenta: 100, // margen negativo
      };

      const response = await agent
        .put(`/productos/${productoId}`)
        .send(updateDto)
        .expect(400);

      expect(response.body.message).toContain('margen');
    });
  });

  describe('GET /productos/bajo-stock - Stock bajo', () => {
    it('debe listar productos con stock bajo', async () => {
      // Crear un producto con stock bajo
      await request(app.getHttpServer()).post('/productos').send({
        nombre: 'Producto Stock Bajo',
        precioCosto: 50,
        precioVenta: 80,
        stockActual: 3,
        stockMinimo: 10,
        categoriaId,
      });

      const response = await agent.get('/productos/bajo-stock').expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((producto: any) => {
        expect(producto.stockActual).toBeLessThanOrEqual(
          producto.stockMinimo * 1.5, // multiplicador de stock bajo
        );
      });
    });
  });

  describe('DELETE /productos/:id - Soft delete', () => {
    it('debe eliminar lógicamente un producto', async () => {
      await request(app.getHttpServer())
        .delete(`/productos/${productoId}`)
        .expect(204);

      // Verificar que no aparece en listado
      const listResponse = await request(app.getHttpServer())
        .get('/productos')
        .set('Authorization', `Bearer ${authToken}`);

      const encontrado = listResponse.body.data.find(
        (p: any) => p.id === productoId,
      );
      expect(encontrado).toBeUndefined();
    });

    it('debe rechazar eliminación de producto ya eliminado', async () => {
      await request(app.getHttpServer())
        .delete(`/productos/${productoId}`)
        .expect(400);
    });
  });

  describe('POST /productos/:id/restore - Restaurar', () => {
    it('debe restaurar un producto eliminado', async () => {
      const response = await agent
        .post(`/productos/${productoId}/restore`)
        .expect(200);

      expect(response.body.eliminado).toBe(false);
      expect(response.body.deletedAt).toBeNull();

      // Verificar que aparece en listado nuevamente
      const listResponse = await request(app.getHttpServer())
        .get('/productos')
        .set('Authorization', `Bearer ${authToken}`);

      const encontrado = listResponse.body.data.find(
        (p: any) => p.id === productoId,
      );
      expect(encontrado).toBeDefined();
    });

    it('debe rechazar restauración de producto activo', async () => {
      await request(app.getHttpServer())
        .post(`/productos/${productoId}/restore`)
        .expect(400);
    });
  });
});
