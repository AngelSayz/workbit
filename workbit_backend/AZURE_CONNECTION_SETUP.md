# Configuración de Azure SQL Database

## 🚨 **URGENTE: Error de Conexión**

El simulador está fallando porque el backend no puede conectarse a Azure SQL Database.

## 🔧 **Arreglo Inmediato**

### **Paso 1: Actualizar `conection/connection.json`**

Reemplaza el contenido actual con tu información de Azure SQL Database:

```json
{
  "ConnectionStrings": {
    "SqlServer": {
      "Server": "TU-SERVIDOR.database.windows.net",
      "Database": "TU-DATABASE-NAME",
      "UserId": "TU-USUARIO-ADMIN",
      "Password": "TU-PASSWORD-SEGURO"
    }
  },
  "Paths": {
    "Domain": "https://workbit-api.azurewebsites.net/"
  }
}
```

### **Paso 2: Encontrar tus datos de Azure**

1. **Ve a Azure Portal → SQL databases**
2. **Selecciona tu base de datos WorkBit**
3. **En "Connection strings" encontrarás:**

```
Server=tcp:TU-SERVIDOR.database.windows.net,1433;Initial Catalog=TU-DATABASE;User ID=TU-USUARIO;Password={your_password_here};
```

### **Paso 3: Extraer la información**

De la cadena de Azure, extrae:
- **Server**: `TU-SERVIDOR.database.windows.net` (sin "tcp:" y sin ",1433")
- **Database**: `TU-DATABASE` (Initial Catalog)
- **UserId**: `TU-USUARIO` (User ID)
- **Password**: Tu password real

### **Ejemplo Real**

Si tu cadena de Azure es:
```
Server=tcp:workbit-server-2025.database.windows.net,1433;Initial Catalog=WorkbitProduction;User ID=workbitadmin;Password=MiPassword123!;
```

Tu `connection.json` debe ser:
```json
{
  "ConnectionStrings": {
    "SqlServer": {
      "Server": "workbit-server-2025.database.windows.net",
      "Database": "WorkbitProduction", 
      "UserId": "workbitadmin",
      "Password": "MiPassword123!"
    }
  },
  "Paths": {
    "Domain": "https://workbit-api.azurewebsites.net/"
  }
}
```

## 🚀 **Después del cambio**

1. **Despliega** el backend a Azure con los cambios de CORS y conexión
2. **Prueba** el simulador - debería funcionar sin errores 500
3. **CORS** ya está configurado para permitir cualquier origen

## 🔍 **Verificación**

Los logs del backend mostrarán:
```
✅ Configuración cargada: Server = tu-servidor.database.windows.net
```

Si ves errores de conexión, verifica:
- ✅ Server name correcto
- ✅ Database name correcto  
- ✅ Usuario y password correctos
- ✅ Firewall de Azure permite conexiones

## 📱 **Contacto Rápido**

Si necesitas ayuda inmediata:
1. Comparte tu cadena de conexión de Azure (SIN la password)
2. Verifica que la base de datos esté encendida en Azure
3. Revisa los logs de Azure App Service

---

**Estado Actual**: ❌ Backend no puede conectarse a Azure SQL  
**Próximo Paso**: ✅ Actualizar connection.json con datos reales de Azure 