import { render, screen } from '@testing-library/react';
import { Badge, BadgeVariant } from './Badge';

describe('Badge Component', () => {
  it('debe renderizar correctamente con children', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('debe aplicar la variante por defecto', () => {
    const { container } = render(<Badge>Default</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800', 'border-gray-200');
  });

  describe('Variantes de estilo', () => {
    const variants: BadgeVariant[] = [
      'default',
      'success',
      'warning',
      'danger',
      'info',
      'primary',
    ];

    const expectedClasses: Record<BadgeVariant, string[]> = {
      default: ['bg-gray-100', 'text-gray-800', 'border-gray-200'],
      success: ['bg-green-100', 'text-green-800', 'border-green-200'],
      warning: ['bg-yellow-100', 'text-yellow-800', 'border-yellow-200'],
      danger: ['bg-red-100', 'text-red-800', 'border-red-200'],
      info: ['bg-blue-100', 'text-blue-800', 'border-blue-200'],
      primary: ['bg-blue-600', 'text-white', 'border-blue-700'],
    };

    variants.forEach((variant) => {
      it(`debe aplicar correctamente la variante ${variant}`, () => {
        const { container } = render(
          <Badge variant={variant}>{variant}</Badge>
        );
        const badge = container.querySelector('span');
        expectedClasses[variant].forEach((className) => {
          expect(badge).toHaveClass(className);
        });
      });
    });
  });

  it('debe renderizar con un icono', () => {
    const TestIcon = () => <svg data-testid="test-icon" />;
    render(
      <Badge icon={<TestIcon />}>
        Badge with Icon
      </Badge>
    );

    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    expect(screen.getByText('Badge with Icon')).toBeInTheDocument();
  });

  it('debe aplicar className personalizado', () => {
    const customClass = 'my-custom-class';
    const { container } = render(
      <Badge className={customClass}>Custom Class</Badge>
    );
    const badge = container.querySelector('span');
    expect(badge).toHaveClass(customClass);
  });

  it('debe mantener las clases base incluso con className personalizado', () => {
    const { container } = render(
      <Badge className="custom">Badge</Badge>
    );
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-full');
  });
});
