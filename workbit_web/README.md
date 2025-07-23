# WorkBit Web Application

Una aplicación web moderna para la gestión de espacios de trabajo y reservas, construida con React, Vite y Tailwind CSS, que se conecta con un backend ASP.NET.

## 🚀 Características

- **Autenticación JWT**: Sistema de login seguro con tokens
- **Dashboard Interactivo**: Resumen en tiempo real de espacios y reservas
- **Gestión de Espacios**: Visualización y control de estado de cubículos
- **Sistema de Reservas**: Creación y gestión de reservas
- **Roles de Usuario**: Admin, Técnico y Empleado con permisos diferenciados
- **UI Moderna**: Interfaz responsive con animaciones suaves
- **Componentes Reutilizables**: Arquitectura modular y escalable

## 🛠️ Tecnologías

- **Frontend**: React 18, Vite
- **Estilos**: Tailwind CSS
- **Estado Global**: Zustand
- **Rutas**: React Router DOM
- **HTTP Client**: Axios
- **Animaciones**: Framer Motion
- **Iconos**: Lucide React

## 📋 Prerrequisitos

- Node.js 16+ y npm
- Backend ASP.NET ejecutándose en `http://localhost:5000`

## 🚀 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd workbit_web
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   
   Crea un archivo `.env.local` en la raíz del proyecto:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

5. **Construir para producción**
   ```bash
   npm run build
   ```

## 📁 Estructura del Proyecto

```
src/
├── api/                    # Configuración de Axios y llamadas API
│   └── apiService.js       # Servicios centralizados de API
├── components/
│   ├── ui/                 # Componentes base reutilizables
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Card.jsx
│   │   ├── Modal.jsx
│   │   └── LoadingSpinner.jsx
│   └── layout/             # Componentes de layout
│       └── Sidebar.jsx
├── features/
│   └── auth/               # Lógica de autenticación
│       └── ProtectedRoute.jsx
├── hooks/                  # Hooks personalizados
│   ├── useAuth.js
│   └── useApi.js
├── lib/                    # Utilidades y constantes
│   ├── constants.js
│   └── utils.js
├── pages/                  # Páginas principales
│   ├── LoginPage.jsx
│   └── dashboard/
│       ├── DashboardLayout.jsx
│       └── OverviewPage.jsx
├── store/                  # Estado global con Zustand
│   └── userStore.js
└── App.jsx                 # Configuración de rutas principales
```

## 🔑 Funcionalidades Principales

### Autenticación
- Login con email y contraseña
- Gestión automática de tokens JWT
- Rutas protegidas por roles
- Persistencia de sesión

### Dashboard
- Resumen de estadísticas en tiempo real
- Tarjetas de espacios con estados
- Lista de reservas recientes
- Navegación contextual por rol

### Gestión de Espacios
- Visualización de todos los espacios
- Cambio de estado (disponible, ocupado, mantenimiento)
- Filtros y búsqueda
- Información detallada por espacio

### Sistema de Reservas
- Creación de nuevas reservas
- Gestión de estados (pendiente, activa, cancelada)
- Calendario de disponibilidad
- Historial de reservas

## 🔧 Configuración de API

El frontend se conecta al backend ASP.NET mediante los siguientes endpoints:

- **POST** `/api/account/login` - Autenticación
- **GET** `/api/account/profile` - Perfil del usuario
- **GET** `/api/spaces` - Lista de espacios
- **PUT** `/api/spaces/{id}/status` - Actualizar estado de espacio
- **GET** `/api/reservations` - Lista de reservas
- **POST** `/api/reservations` - Crear reserva
- **GET** `/api/users` - Lista de usuarios (Admin)

## 👥 Roles y Permisos

### Administrador
- Acceso completo a todas las funcionalidades
- Gestión de usuarios
- Panel de administración
- Control total de espacios y reservas

### Técnico
- Gestión de espacios y estados
- Gestión de reservas
- Panel técnico especializado
- Sin acceso a gestión de usuarios

### Empleado
- Visualización de espacios
- Creación de reservas propias
- Consulta de información básica

## 🎨 Sistema de Diseño

El proyecto utiliza un sistema de diseño consistente basado en:

- **Colores**: Paleta azul como color primario
- **Tipografía**: Sistema tipográfico escalable
- **Espaciado**: Grid system basado en Tailwind
- **Componentes**: Biblioteca de componentes reutilizables
- **Animaciones**: Transiciones suaves con Framer Motion

## 🔄 Estado Global

El estado se gestiona con Zustand y incluye:

- **Usuario**: Datos del usuario autenticado
- **Autenticación**: Token y estado de sesión
- **Roles**: Permisos y validaciones

## 📱 Responsive Design

La aplicación está optimizada para:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🧪 Próximas Funcionalidades

- [ ] Notificaciones en tiempo real
- [ ] Sistema de reportes
- [ ] Integración con calendario externo
- [ ] Modo oscuro
- [ ] PWA (Progressive Web App)
- [ ] Internacionalización completa

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o consultas:
- Crear un issue en el repositorio
- Contactar al equipo de desarrollo

---

Desarrollado con ❤️ para WorkBit
