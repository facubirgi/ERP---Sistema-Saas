import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from './SearchBar';

describe('SearchBar Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('debe renderizar correctamente', () => {
    const mockOnSearch = jest.fn();
    render(<SearchBar onSearch={mockOnSearch} />);

    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();
  });

  it('debe renderizar con placeholder personalizado', () => {
    const mockOnSearch = jest.fn();
    const customPlaceholder = 'Buscar productos...';

    render(
      <SearchBar
        onSearch={mockOnSearch}
        placeholder={customPlaceholder}
      />
    );

    expect(screen.getByPlaceholderText(customPlaceholder)).toBeInTheDocument();
  });

  it('debe mostrar el valor inicial', () => {
    const mockOnSearch = jest.fn();
    const initialValue = 'Coca Cola';

    render(
      <SearchBar
        onSearch={mockOnSearch}
        initialValue={initialValue}
      />
    );

    const input = screen.getByDisplayValue(initialValue);
    expect(input).toBeInTheDocument();
  });

  it('debe actualizar el valor cuando el usuario escribe', async () => {
    const user = userEvent.setup({ delay: null });
    const mockOnSearch = jest.fn();

    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText('Buscar...');
    await user.type(input, 'test');

    expect(input).toHaveValue('test');
  });

  it('debe llamar onSearch con debounce', async () => {
    const user = userEvent.setup({ delay: null });
    const mockOnSearch = jest.fn();
    const debounceMs = 300;

    render(<SearchBar onSearch={mockOnSearch} debounceMs={debounceMs} />);

    const input = screen.getByPlaceholderText('Buscar...');
    await user.type(input, 'test');

    // No debe llamarse inmediatamente
    expect(mockOnSearch).not.toHaveBeenCalled();

    // Avanzar el tiempo de debounce
    jest.advanceTimersByTime(debounceMs);

    // Ahora debe haberse llamado con el valor final
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('test');
    });
  });

  it('debe mostrar el botón de limpiar cuando hay texto', async () => {
    const user = userEvent.setup({ delay: null });
    const mockOnSearch = jest.fn();

    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText('Buscar...');

    // Inicialmente no debe estar el botón de limpiar
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    // Escribir texto
    await user.type(input, 'test');

    // Ahora debe aparecer el botón
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('debe limpiar el texto al hacer clic en el botón de limpiar', async () => {
    const user = userEvent.setup({ delay: null });
    const mockOnSearch = jest.fn();

    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText('Buscar...');

    // Escribir texto
    await user.type(input, 'test');
    expect(input).toHaveValue('test');

    // Hacer clic en limpiar
    const clearButton = screen.getByRole('button');
    await user.click(clearButton);

    // El input debe estar vacío
    expect(input).toHaveValue('');

    // Debe llamar onSearch con string vacío después del debounce
    jest.advanceTimersByTime(300);
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('');
    });
  });

  it('debe aplicar className personalizado', () => {
    const mockOnSearch = jest.fn();
    const customClass = 'my-custom-class';

    const { container } = render(
      <SearchBar onSearch={mockOnSearch} className={customClass} />
    );

    const wrapper = container.querySelector('.my-custom-class');
    expect(wrapper).toBeInTheDocument();
  });

  it('debe mostrar iconos correctamente', () => {
    const mockOnSearch = jest.fn();
    const { container } = render(<SearchBar onSearch={mockOnSearch} />);

    // Debe tener el icono de búsqueda
    const searchIcon = container.querySelector('svg');
    expect(searchIcon).toBeInTheDocument();
  });

  it('debe cancelar el timeout anterior cuando el usuario sigue escribiendo', async () => {
    const user = userEvent.setup({ delay: null });
    const mockOnSearch = jest.fn();
    const debounceMs = 300;

    render(<SearchBar onSearch={mockOnSearch} debounceMs={debounceMs} />);

    const input = screen.getByPlaceholderText('Buscar...');

    // Escribir 't'
    await user.type(input, 't');
    jest.advanceTimersByTime(100);

    // Escribir 'e'
    await user.type(input, 'e');
    jest.advanceTimersByTime(100);

    // Escribir 's'
    await user.type(input, 's');
    jest.advanceTimersByTime(100);

    // Escribir 't'
    await user.type(input, 't');

    // No debe haberse llamado aún
    expect(mockOnSearch).not.toHaveBeenCalled();

    // Avanzar el tiempo completo desde la última tecla
    jest.advanceTimersByTime(debounceMs);

    // Debe haberse llamado UNA SOLA VEZ con el texto completo
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledTimes(1);
      expect(mockOnSearch).toHaveBeenCalledWith('test');
    });
  });
});
