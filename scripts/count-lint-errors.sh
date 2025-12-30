#!/bin/bash
# Script para contar errores de linting por categoría
# Uso: ./scripts/count-lint-errors.sh

echo "======================================"
echo "  Análisis de Errores de Linting"
echo "======================================"
echo ""

echo "=== Backend Linting Errors ==="
cd backend
BACKEND_OUTPUT=$(npm run lint 2>&1)

echo "$BACKEND_OUTPUT" | grep -c "error" | xargs -I {} echo "Total de errores: {}"
echo "$BACKEND_OUTPUT" | grep -c "warning" | xargs -I {} echo "Total de warnings: {}"
echo ""
echo "Errores por categoría:"
echo "$BACKEND_OUTPUT" | grep "error" | grep -oP "@[\w/-]+$" | sort | uniq -c | sort -rn
echo ""

echo "=== Frontend Linting Errors ==="
cd ../frontend
FRONTEND_OUTPUT=$(npm run lint 2>&1)

echo "$FRONTEND_OUTPUT" | grep -c "error" | xargs -I {} echo "Total de errores: {}"
echo "$FRONTEND_OUTPUT" | grep -c "warning" | xargs -I {} echo "Total de warnings: {}"
echo ""
echo "Errores por categoría:"
echo "$FRONTEND_OUTPUT" | grep "error" | grep -oP "@[\w/-]+$|react[\w/-]+$" | sort | uniq -c | sort -rn
echo ""

echo "======================================"
echo "  Análisis completado"
echo "======================================"
