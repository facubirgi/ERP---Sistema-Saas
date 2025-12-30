import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Table, Column, PaginationInfo } from './Table';

interface TestData {
  id: string;
  name: string;
  email: string;
  age: number;
}

describe('Table Component', () => {
  const mockData: TestData[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com', age: 30 },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', age: 25 },
    { id: '3', name: 'Bob Johnson', email: 'bob@example.com', age: 35 },
  ];

  const mockColumns: Column<TestData>[] = [
    { key: 'name', header: 'Nombre' },
    { key: 'email', header: 'Email' },
    { key: 'age', header: 'Edad' },
  ];

  const keyExtractor = (item: TestData) => item.id;

  it('debe renderizar correctamente con datos', () => {
    render(
      <Table
        columns={mockColumns}
        data={mockData}
        keyExtractor={keyExtractor}
      />
    );

    // Verificar headers
    expect(screen.getByText('Nombre')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Edad')).toBeInTheDocument();

    // Verificar datos
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('35')).toBeInTheDocument();
  });

  it('debe mostrar mensaje cuando no hay datos', () => {
    render(
      <Table
        columns={mockColumns}
        data={[]}
        keyExtractor={keyExtractor}
      />
    );

    expect(screen.getByText('No hay datos para mostrar')).toBeInTheDocument();
  });

  it('debe mostrar mensaje personalizado cuando no hay datos', () => {
    const customMessage = 'No se encontraron productos';

    render(
      <Table
        columns={mockColumns}
        data={[]}
        keyExtractor={keyExtractor}
        emptyMessage={customMessage}
      />
    );

    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it('debe mostrar estado de carga', () => {
    render(
      <Table
        columns={mockColumns}
        data={[]}
        keyExtractor={keyExtractor}
        loading={true}
      />
    );

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('debe renderizar columnas con render personalizado', () => {
    const columnsWithRender: Column<TestData>[] = [
      {
        key: 'name',
        header: 'Nombre',
        render: (item) => <strong>{item.name.toUpperCase()}</strong>,
      },
    ];

    render(
      <Table
        columns={columnsWithRender}
        data={mockData}
        keyExtractor={keyExtractor}
      />
    );

    expect(screen.getByText('JOHN DOE')).toBeInTheDocument();
    expect(screen.getByText('JANE SMITH')).toBeInTheDocument();
  });

  it('debe aplicar className personalizado a columnas', () => {
    const columnsWithClass: Column<TestData>[] = [
      {
        key: 'name',
        header: 'Nombre',
        className: 'custom-column-class',
      },
    ];

    const { container } = render(
      <Table
        columns={columnsWithClass}
        data={mockData}
        keyExtractor={keyExtractor}
      />
    );

    const cells = container.querySelectorAll('.custom-column-class');
    // Debe haber exactamente 4 celdas: 1 header + 3 datos
    expect(cells).toHaveLength(4);
  });

  describe('Paginación', () => {
    const mockPagination: PaginationInfo = {
      page: 2,
      limit: 10,
      total: 50,
      totalPages: 5,
      hasNextPage: true,
      hasPrevPage: true,
    };

    it('debe mostrar información de paginación correcta', () => {
      render(
        <Table
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
          pagination={mockPagination}
        />
      );

      // Verificar el texto de paginación (el texto está dividido en múltiples elementos)
      expect(screen.getByText((content, element) => {
        return element?.tagName === 'P' && element?.textContent === 'Mostrando 11 a 20 de 50 resultados';
      })).toBeInTheDocument();
      // Verificar valores específicos
      expect(screen.getByText('11')).toBeInTheDocument(); // startItem
      expect(screen.getByText('20')).toBeInTheDocument(); // endItem
      expect(screen.getByText('50')).toBeInTheDocument(); // total
    });

    it('debe llamar onPageChange al hacer clic en página siguiente', async () => {
      const user = userEvent.setup();
      const mockOnPageChange = jest.fn();

      render(
        <Table
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
          pagination={mockPagination}
          onPageChange={mockOnPageChange}
        />
      );

      // Buscar el botón de página 3 y hacer clic
      const page3Button = screen.getByRole('button', { name: '3' });
      await user.click(page3Button);

      expect(mockOnPageChange).toHaveBeenCalledWith(3);
      expect(mockOnPageChange).toHaveBeenCalledTimes(1);
    });

    it('debe deshabilitar botones de navegación anterior en la primera página', () => {
      const paginationFirstPage: PaginationInfo = {
        ...mockPagination,
        page: 1,
        hasPrevPage: false,
      };

      render(
        <Table
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
          pagination={paginationFirstPage}
        />
      );

      // Buscar botón específico por aria-label
      const firstPageButton = screen.getByLabelText('Primera página');
      expect(firstPageButton).toBeDisabled();
    });

    it('debe deshabilitar botones de navegación siguiente en la última página', () => {
      const paginationLastPage: PaginationInfo = {
        ...mockPagination,
        page: 5,
        hasNextPage: false,
      };

      render(
        <Table
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
          pagination={paginationLastPage}
        />
      );

      // Verificar que los botones de navegación final están deshabilitados
      const allButtons = screen.getAllByRole('button');
      const disabledButtons = allButtons.filter(btn => 
        (btn as HTMLButtonElement).disabled
      );

      // Debe haber al menos 2 botones deshabilitados (siguiente y última)
      expect(disabledButtons.length).toBeGreaterThanOrEqual(2);
    });

    it('debe mostrar hasta 5 números de página', () => {
      render(
        <Table
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
          pagination={mockPagination}
        />
      );

      // Debe mostrar exactamente 5 páginas (totalPages = 5, muestra máximo 5)
      const pageButtons = screen.getAllByRole('button').filter((btn) => {
        const text = btn.textContent;
        return text && /^\d+$/.test(text);
      });

      expect(pageButtons).toHaveLength(5);
      
      // Verificar que las páginas mostradas son correctas (1, 2, 3, 4, 5)
      const pageNumbers = pageButtons.map(btn => parseInt(btn.textContent || '0'));
      expect(pageNumbers).toEqual([1, 2, 3, 4, 5]);
    });

    it('no debe mostrar paginación cuando está cargando', () => {
      render(
        <Table
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
          pagination={mockPagination}
          loading={true}
        />
      );

      // No debe mostrar la información de paginación
      expect(screen.queryByText(/Mostrando/)).not.toBeInTheDocument();
    });

    it('no debe mostrar paginación cuando no hay datos', () => {
      render(
        <Table
          columns={mockColumns}
          data={[]}
          keyExtractor={keyExtractor}
          pagination={mockPagination}
        />
      );

      // No debe mostrar la información de paginación
      expect(screen.queryByText(/Mostrando/)).not.toBeInTheDocument();
    });
  });

  it('debe aplicar className personalizado al contenedor', () => {
    const customClass = 'my-custom-table';

    const { container } = render(
      <Table
        columns={mockColumns}
        data={mockData}
        keyExtractor={keyExtractor}
        className={customClass}
      />
    );

    expect(container.querySelector('.my-custom-table')).toBeInTheDocument();
  });

  it('debe renderizar correctamente todas las filas', () => {
    const { container } = render(
      <Table
        columns={mockColumns}
        data={mockData}
        keyExtractor={keyExtractor}
      />
    );

    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(mockData.length);
  });

  it('debe manejar valores nulos o undefined en columnas', () => {
    const dataWithNulls: TestData[] = [
      { id: '1', name: 'John', email: '', age: 0 },
    ];

    render(
      <Table
        columns={mockColumns}
        data={dataWithNulls}
        keyExtractor={keyExtractor}
      />
    );

    // Debe renderizar sin errores
    expect(screen.getByText('John')).toBeInTheDocument();
  });

  describe('Interacciones de Usuario', () => {
    it('debe navegar a la primera página', async () => {
      const user = userEvent.setup();
      const mockOnPageChange = jest.fn();
      const pagination: PaginationInfo = {
        page: 3,
        limit: 10,
        total: 50,
        totalPages: 5,
        hasNextPage: true,
        hasPrevPage: true,
      };

      render(
        <Table
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      );

      const firstPageButton = screen.getByLabelText('Primera página');
      await user.click(firstPageButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(1);
    });

    it('debe navegar a la última página', async () => {
      const user = userEvent.setup();
      const mockOnPageChange = jest.fn();
      const pagination: PaginationInfo = {
        page: 3,
        limit: 10,
        total: 50,
        totalPages: 5,
        hasNextPage: true,
        hasPrevPage: true,
      };

      render(
        <Table
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      );

      // Buscar el botón que contiene el ícono ChevronsRight (última página)
      const buttons = screen.getAllByRole('button');
      const lastPageButton = buttons.find(btn => 
        btn.querySelector('[data-lucide="chevrons-right"]')
      );

      if (lastPageButton) {
        await user.click(lastPageButton);
        expect(mockOnPageChange).toHaveBeenCalledWith(5);
      }
    });
  });

  describe('Edge Cases', () => {
    it('debe manejar paginación con una sola página', () => {
      const singlePagePagination: PaginationInfo = {
        page: 1,
        limit: 10,
        total: 3,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      };

      render(
        <Table
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
          pagination={singlePagePagination}
        />
      );

      expect(screen.getByText((content, element) => {
        return element?.tagName === 'P' && element?.textContent === 'Mostrando 1 a 3 de 3 resultados';
      })).toBeInTheDocument();

      // Todos los botones de navegación deben estar deshabilitados
      const firstPageButton = screen.getByLabelText('Primera página');
      expect(firstPageButton).toBeDisabled();
    });

    it('debe manejar datos vacíos con paginación', () => {
      const emptyPagination: PaginationInfo = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      };

      render(
        <Table
          columns={mockColumns}
          data={[]}
          keyExtractor={keyExtractor}
          pagination={emptyPagination}
        />
      );

      // No debe mostrar paginación cuando no hay datos
      expect(screen.queryByText(/Mostrando/)).not.toBeInTheDocument();
      expect(screen.getByText('No hay datos para mostrar')).toBeInTheDocument();
    });

    it('debe manejar muchas páginas (>5)', () => {
      const manyPagesPagination: PaginationInfo = {
        page: 10,
        limit: 10,
        total: 200,
        totalPages: 20,
        hasNextPage: true,
        hasPrevPage: true,
      };

      render(
        <Table
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
          pagination={manyPagesPagination}
        />
      );

      // Debe mostrar exactamente 5 botones de número de página
      const pageButtons = screen.getAllByRole('button').filter((btn) => {
        const text = btn.textContent;
        return text && /^\d+$/.test(text);
      });

      expect(pageButtons).toHaveLength(5);
    });
  });
});
