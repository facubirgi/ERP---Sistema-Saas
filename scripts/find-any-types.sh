#!/bin/bash
# Script para encontrar todos los usos de 'any' en el código
# Uso: ./scripts/find-any-types.sh [backend|frontend|all]

TARGET=${1:-all}

echo "======================================"
echo "  Buscando tipos 'any'"
echo "======================================"
echo ""

search_any() {
    local dir=$1
    local name=$2

    echo "=== $name ==="
    echo ""

    # Contar total de 'any'
    local total=$(grep -rn ": any" $dir --include="*.ts" --include="*.tsx" | grep -v "node_modules" | wc -l)
    echo "Total de usos de 'any': $total"
    echo ""

    # Archivos con más 'any'
    echo "Top 10 archivos con más 'any':"
    grep -rn ": any" $dir --include="*.ts" --include="*.tsx" | \
        grep -v "node_modules" | \
        cut -d: -f1 | \
        sort | \
        uniq -c | \
        sort -rn | \
        head -10
    echo ""

    # Guardar lista completa
    grep -rn ": any" $dir --include="*.ts" --include="*.tsx" | \
        grep -v "node_modules" > "any-types-$name.txt"
    echo "Lista completa guardada en: any-types-$name.txt"
    echo ""
}

if [ "$TARGET" = "backend" ] || [ "$TARGET" = "all" ]; then
    search_any "backend/src" "backend"
fi

if [ "$TARGET" = "frontend" ] || [ "$TARGET" = "all" ]; then
    search_any "frontend" "frontend"
fi

echo "======================================"
echo "  Búsqueda completada"
echo "======================================"
