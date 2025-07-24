# WorkBit Web App

Sistema web de gestión inteligente de espacios de trabajo. Aplicación frontend desarrollada en React con Vite, diseñada para conectar con el backend de Node.js y Supabase Auth.

## 🚀 Características

- **Diseño Minimalista**: Interface limpia con paleta de colores blanco y azul
- **Autenticación Segura**: Integración con Supabase Auth y validación de roles
- **Dashboard Administrativo**: Panel de control para administradores y técnicos
- **Responsive**: Totalmente adaptable a dispositivos móviles
- **Componentes Modulares**: Arquitectura escalable con componentes reutilizables

## 📋 Requisitos Previos

- Node.js 18+
- Cuenta de Supabase configurada
- Backend de WorkBit (Node.js) ejecutándose

## 🛠️ Instalación

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio>
cd workbit_web
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# API Configuration
VITE_API_URL=http://localhost:3000
VITE_API_BASE_URL=http://localhost:3000/api

# Supabase Configuration
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key

# Environment
VITE_NODE_ENV=development
```

### 4. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ejecuta el schema SQL de la base de datos (database.sql)
3. Configura la autenticación en Supabase
4. Actualiza las variables de entorno con tus credenciales

## 🚀 Desarrollo

### Iniciar servidor de desarrollo
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### Compilar para producción
```bash
npm run build
```

### Vista previa de producción
```bash
npm run preview
```

## 🔐 Autenticación y Roles

La aplicación utiliza un sistema de autenticación de doble validación:

1. **Supabase Auth**: Manejo de sesiones y tokens
2. **Validación de Roles**: Solo usuarios con roles `admin` o `technician` pueden acceder

### Roles Soportados
- `admin`: Acceso completo al sistema
- `technician`: Acceso limitado sin gestión de usuarios

## 📁 Estructura del Proyecto

```
workbit_web/
├── src/
│   ├── api/              # Servicios de API
│   ├── components/       # Componentes reutilizables
│   │   ├── layout/       # Navbar, Footer, etc.
│   │   ├── sections/     # Secciones de la landing page
│   │   └── ui/           # Componentes base (Button, Input, etc.)
│   ├── features/         # Características específicas
│   │   └── auth/         # Autenticación
│   ├── hooks/            # React hooks personalizados
│   ├── lib/              # Utilidades y configuraciones
│   ├── pages/            # Páginas principales
│   │   └── dashboard/    # Páginas del dashboard
│   └── store/            # Estado global
├── public/               # Archivos estáticos
└── vercel.json          # Configuración para Vercel
```

## 🌐 Deploy en Vercel

### 1. Configuración automática
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy desde el directorio del proyecto
vercel
```

### 2. Variables de entorno en Vercel
Configura las siguientes variables en el dashboard de Vercel:

- `VITE_API_URL`: URL de tu backend de producción
- `VITE_API_BASE_URL`: URL base de la API
- `VITE_SUPABASE_URL`: URL de tu proyecto Supabase
- `VITE_SUPABASE_ANON_KEY`: Clave anónima de Supabase

### 3. Configuración del Backend
Asegúrate de que tu backend de Node.js esté desplegado y configurado con:
- CORS habilitado para tu dominio de Vercel
- Variables de entorno correctas en producción

## 🔧 API Backend

Esta aplicación se conecta con el backend de Node.js de WorkBit. Asegúrate de que esté ejecutándose con los siguientes endpoints:

- `POST /login` - Autenticación de usuarios
- `GET /api/users` - Gestión de usuarios
- `GET /api/spaces` - Gestión de espacios
- `GET /api/reservations` - Gestión de reservas

## 🎨 Personalización

### Colores
La aplicación usa una paleta de colores azul y blanco. Para personalizar:

1. Edita `tailwind.config.js` para modificar los colores
2. Los colores principales están en las clases `blue-*`

### Componentes
- Los componentes UI base están en `src/components/ui/`
- Las secciones de la landing page en `src/components/sections/`
- El layout del dashboard en `src/pages/dashboard/`

## 📝 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Compilar para producción
- `npm run preview` - Vista previa de producción
- `npm run lint` - Ejecutar ESLint

## 🔍 Solución de Problemas

### Error de CORS
Si recibes errores de CORS, verifica que:
- El backend tenga configurado CORS para tu dominio
- Las URLs en las variables de entorno sean correctas

### Error de Autenticación
Si el login falla:
- Verifica que Supabase esté configurado correctamente
- Asegúrate de que el usuario tenga rol `admin` o `technician`
- Revisa que el backend esté ejecutándose

### Error 404 en Vercel
Si las rutas no funcionan en Vercel:
- Verifica que `vercel.json` esté presente
- Asegúrate de que las rewrites estén configuradas

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -m 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si necesitas ayuda:
1. Revisa la documentación del backend de Node.js
2. Verifica la configuración de Supabase
3. Consulta los logs de desarrollo en la consola del navegador
