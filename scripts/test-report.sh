#!/bin/bash
# Script para ejecutar tests y generar reportes
# Uso: ./scripts/test-report.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_DIR="test-reports"
mkdir -p $REPORT_DIR

echo "======================================"
echo "  Generación de Reportes de Tests"
echo "======================================"
echo ""

echo "📊 Ejecutando tests del backend..."
cd backend
npm test > "../$REPORT_DIR/backend_$TIMESTAMP.txt" 2>&1
BACKEND_EXIT=$?

if [ $BACKEND_EXIT -eq 0 ]; then
    echo "✅ Backend: Todos los tests pasaron"
else
    echo "❌ Backend: Algunos tests fallaron"
fi

echo ""
echo "📊 Ejecutando tests del frontend..."
cd ../frontend
npm test > "../$REPORT_DIR/frontend_$TIMESTAMP.txt" 2>&1
FRONTEND_EXIT=$?

if [ $FRONTEND_EXIT -eq 0 ]; then
    echo "✅ Frontend: Todos los tests pasaron"
else
    echo "❌ Frontend: Algunos tests fallaron"
fi

echo ""
echo "======================================"
echo "  Resumen de Resultados"
echo "======================================"
echo ""
echo "Reportes generados en: $REPORT_DIR/"
echo "  - backend_$TIMESTAMP.txt"
echo "  - frontend_$TIMESTAMP.txt"
echo ""

# Mostrar resumen
echo "Backend Summary:"
tail -5 "$REPORT_DIR/backend_$TIMESTAMP.txt"
echo ""
echo "Frontend Summary:"
tail -5 "$REPORT_DIR/frontend_$TIMESTAMP.txt"
echo ""

exit $(($BACKEND_EXIT + $FRONTEND_EXIT))
