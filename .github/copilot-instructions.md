# BeniceAstro - Tienda Online Veterinaria

## Estado del Proyecto
- [x] Estructura base del proyecto
- [x] Configuracion de Supabase
- [x] Sistema de autenticacion
- [x] Catalogo de productos con filtros avanzados
- [x] Carrito de compras
- [x] Panel de administracion
- [x] Sistema de newsletter y codigos promocionales
- [x] Buscador instantaneo
- [x] Gestion de pedidos y cancelaciones
- [x] Sistema de devoluciones

## Stack Tecnologico
- Astro 4.x con TypeScript (Strict)
- Supabase (Auth + Database + RLS)
- Tailwind CSS
- Chart.js
- Islands Architecture
- Node Adapter (SSR)

## Paleta de Colores
- Primario: Morado (#7e22ce / purple-700)
- Secundario: Naranja (#f97316 / orange-500)

## Estructura del Proyecto
```
src/
├── components/     # Componentes interactivos
├── layouts/        
│   └── Layout.astro # Layout con header, footer, auth
├── pages/          
│   ├── index.astro         # Pagina principal
│   ├── productos.astro     # Catalogo con filtros
│   ├── carrito.astro       # Carrito de compras
│   ├── login.astro         # Inicio de sesion
│   ├── registro.astro      # Registro
│   ├── perfil.astro        # Perfil de usuario
│   ├── mis-pedidos.astro   # Historial de pedidos
│   ├── api/                # API routes
│   │   ├── search.ts       # Buscador live
│   │   ├── newsletter.ts   # Suscripcion
│   │   ├── create-order.ts # Crear pedidos
│   │   └── cancel-order.ts # Cancelar pedidos
│   └── admin/
│       └── index.astro     # Dashboard analitico
├── lib/
│   └── supabase.ts         # Cliente Supabase
├── types/
│   └── index.ts            # Tipos TypeScript
└── styles/
    └── global.css          # Estilos + Tailwind
```

## Instrucciones para Despliegue

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar Supabase
- Copiar `.env.example` a `.env`
- Agregar credenciales de Supabase
- Ejecutar `supabase-schema.sql` en SQL Editor

### 3. Ejecutar en desarrollo
```bash
npm run dev
```

### 4. Compilar para produccion
```bash
npm run build
npm run preview
```

## Caracteristicas Principales
- Autenticacion completa (login, registro, recuperar contrasena)
- Buscador instantaneo con debounce
- Filtros combinables (animal, tamano, categoria, edad)
- Carrito con localStorage y codigos promocionales
- Newsletter con popup automatico
- Gestion de pedidos con estados
- Cancelacion de pedidos con restauracion de stock
- Sistema de devoluciones
- Panel de administracion con analiticas
- Graficos de ventas (Chart.js)
- Row Level Security (RLS)
- Stored Procedures SQL
