# WorkBit Analytics Dashboard

Un dashboard profesional para monitoreo y simulación de reservas y accesos en tiempo real.

![Dashboard Preview](preview.png)

## 🚀 Características

### Dashboard Profesional
- **Métricas en Tiempo Real**: Visualización de KPIs principales (reservas, accesos, usuarios activos, espacios ocupados)
- **Gráficos Interactivos**: Charts dinámicos con Highcharts para análisis de tendencias
- **Diseño Responsivo**: Optimizado para escritorio, tablet y móvil
- **Interfaz Moderna**: Diseño limpio con Bootstrap 5 y gradientes profesionales

### Simulación Inteligente
- **Generación Automática**: Crea reservas y accesos de forma realista
- **Horarios Laborales**: Respeta horarios de trabajo (6 AM - 10 PM)
- **Límites por Hora**: Control de saturación del sistema
- **Timezone Sincronizado**: Todos los datos en zona horaria de Tijuana

### Conectividad Robusta
- **API Azure**: Conexión directa con backend hospedado en Azure
- **Fallback Automático**: Datos de respaldo en caso de problemas de conectividad
- **Manejo de Errores**: Notificaciones claras del estado del sistema
- **CORS Resuelto**: Configuración optimizada para desarrollo y producción

## 🛠️ Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Framework**: Bootstrap 5.3.3
- **Gráficos**: Highcharts
- **Tipografía**: Inter Font (Google Fonts)
- **Iconos**: Bootstrap Icons
- **Backend**: .NET 8 API (Azure)
- **Base de Datos**: Azure SQL Database

## 📊 Métricas del Dashboard

### Tarjetas de KPI
1. **Reservas Hoy**: Conteo total de reservas del día actual
2. **Accesos Registrados**: Número de entradas/salidas loggeadas
3. **Usuarios Activos**: Estimación de usuarios actualmente en las instalaciones
4. **Espacios Ocupados**: Cantidad de espacios con actividad

### Gráficos Analíticos
1. **Reservas por Hora**: Distribución de reservas a lo largo del día
2. **Accesos por Hora**: Flujo de entrada y salida de usuarios

## 🎮 Controles de Simulación

### Botones Principales
- **Iniciar Simulación**: Comienza la generación automática de reservas
- **Detener Simulación**: Pausa la creación de nuevas reservas
- **Actualizar Gráficas**: Recarga los datos del día actual
- **Datos de Prueba**: Carga información de fecha fija para testing

### Indicadores de Estado
- **Indicador de Conectividad**: Muestra el estado de conexión con el API
- **Fecha Actual**: Visualización de la fecha en formato legible
- **Notificaciones**: Feedback en tiempo real de las operaciones

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Dashboard     │    │    Azure API     │    │  Azure SQL DB   │
│   (Frontend)    │◄──►│   (.NET 8)       │◄──►│   (Database)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │
        ▼
┌─────────────────┐
│   Mock Data     │
│   (Fallback)    │
└─────────────────┘
```

## 📁 Estructura del Proyecto

```
workbitsimulator/
├── index.html              # Dashboard principal
├── style.css              # Estilos personalizados
├── js/
│   ├── main.js            # Lógica principal del dashboard
│   ├── services.js        # Servicios de API
│   ├── config.js          # Configuración del sistema
│   └── highcharts.js      # Librería de gráficos
├── img/
│   └── icon.png           # Icono de la aplicación
└── README.md              # Esta documentación
```

## 🚀 Instalación y Uso

### Requisitos Previos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Conexión a internet para CDNs y API

### Ejecución Local
1. **Clonar el repositorio**:
   ```bash
   git clone [repository-url]
   cd workbitsimulator
   ```

2. **Abrir en navegador**:
   ```bash
   # Opción 1: Abrir directamente
   open index.html
   
   # Opción 2: Servidor local (recomendado)
   python -m http.server 8000
   # Luego visitar: http://localhost:8000
   ```

3. **Verificar conectividad**:
   - El dashboard debería mostrar "Sistema listo" en verde
   - Las métricas se cargarán automáticamente
   - Los gráficos mostrarán datos reales o de fallback

### Configuración del API

Si necesitas cambiar la URL del API, edita `js/config.js`:

```javascript
export var config = {
    api: {
        base: 'https://tu-api.azurewebsites.net/api/',
        timeout: 10000
    },
    // ... resto de configuración
};
```

## 🎨 Personalización

### Colores del Dashboard
Los colores se definen en `index.html` dentro del tag `<style>`:

```css
.metric-card { 
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); 
}
.metric-card.secondary { 
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); 
}
.metric-card.success { 
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); 
}
.metric-card.warning { 
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); 
}
```

### Intervalos de Simulación
Modifica los tiempos en `js/config.js`:

```javascript
simulator: {
    reservationInterval: {
        min: 600,  // 10 minutos
        max: 1200  // 20 minutos
    },
    accessInterval: 30,              // 30 segundos
    chartUpdateInterval: 30000,      // 30 segundos
    maxReservationsPerHour: 3
}
```

## 🐛 Solución de Problemas

### Problemas Comunes

1. **Gráficos no cargan**:
   - Verificar conexión a internet
   - Revisar consola del navegador (F12)
   - El sistema debería usar datos de fallback automáticamente

2. **API no responde**:
   - Verificar que la URL del API sea correcta
   - Comprobar que el servicio de Azure esté activo
   - El dashboard mostrará notificaciones de error

3. **Datos desactualizados**:
   - Usar el botón "Actualizar Gráficas"
   - Verificar la zona horaria (debe ser Tijuana)
   - Recargar la página completamente

### Logs del Sistema
Abre la consola del navegador (F12) para ver logs detallados:
- `Starting simulator...` - Simulación iniciada
- `Reservation generated successfully` - Nueva reserva creada
- `Access logged successfully` - Acceso registrado
- `Network/CORS error` - Problema de conectividad

## 📈 Métricas y Monitoreo

### KPIs Disponibles
- **Throughput**: Reservas por hora
- **Utilización**: Porcentaje de espacios ocupados
- **Actividad**: Accesos por periodo de tiempo
- **Tendencias**: Patrones de uso durante el día

### Horarios de Mayor Actividad
Basado en datos reales, los horarios típicos son:
- **Pico matutino**: 8:00 - 10:00 AM
- **Pico mediodía**: 12:00 - 2:00 PM
- **Pico vespertino**: 4:00 - 6:00 PM

## 🔒 Seguridad

- **CORS configurado**: Permite acceso desde localhost y dominios autorizados
- **Validación de datos**: Verificación de espacios y usuarios válidos
- **Rate limiting**: Control de frecuencia de requests
- **Error handling**: Manejo seguro de fallos de conectividad

## 🤝 Contribuciones

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## 📝 Licencia

Este proyecto es parte del ecosistema WorkBit y está bajo la licencia MIT.

## 👨‍💻 Créditos

**Desarrollado por**: Aldo Yamil  
**Empresa**: WorkBit Inc.  
**Año**: 2025  

---

Para soporte técnico o consultas, contactar al equipo de desarrollo de WorkBit. 