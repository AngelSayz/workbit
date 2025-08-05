#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <set>
#include <EEPROM.h>
#include <BluetoothSerial.h>
#include <WiFiUdp.h>
#include <NTPClient.h>
#include <time.h>

// ---------------- CONFIGURACIÓN WIFI ----------------
const char* default_ssid = "Rias";
const char* default_password = "uttijuana";

// Ahora almacenaremos las credenciales como punteros
char* current_ssid_ptr = nullptr;
char* current_password_ptr = nullptr;

// ---------------- CONFIGURACIÓN MQTT ----------------
const char* mqtt_server = "broker.emqx.io";
WiFiClient espClient;
PubSubClient client(espClient);

// ---------------- CONFIGURACIÓN NTP ----------------
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org");
const int TIJUANA_TIMEZONE_OFFSET = -28800; // PST (UTC-8) en segundos
bool ntpInitialized = false;

// ---------------- IDENTIFICADORES ----------------
// Variable global para el space_id que se leerá de EEPROM
int current_space_id = 1; // Default space_id
const char* device_id = "access_001";
const char* rfid_sensor_id = "rfid_001";
const char* ir_sensor_id = "ir_001";
const char* config_topic_prefix = "workbit/devices/";
const char* request_topic = "workbit/access/request";
const char* response_topic = "workbit/access/response";
const char* guest_update_topic = "workbit/access/guests";

// ---------------- CONFIGURACIÓN RFID ----------------
#define SS_PIN 5
#define RST_PIN 22
MFRC522 mfrc522(SS_PIN, RST_PIN);

// ---------------- SENSORES IR ----------------
const int sensorEntrada = 13;
const int sensorSalida = 14;

// ================= VARIABLES DE CONTROL ESTANDARIZADAS =================
int contadorPersonas = 0;
bool accesoHabilitado = false;
String uidEnEspera = "";
unsigned long tiempoAcceso = 0;
unsigned long duracionAcceso = 10000;
unsigned long ultimaLecturaRFID = 0;
unsigned long delayLectura = 2000;

// ================= SISTEMA DE CREDENCIALES MEJORADO =================
// Estructura para credenciales según especificaciones
struct Credential {
  String reservation_id;
  String authorized_cards[15];  // Máximo 15 tarjetas por espacio
  int card_count;
  String valid_from;           // Cambiado a String para ISO date
  String valid_until;          // Cambiado a String para ISO date
  String owner;
  bool is_active;              // Nuevo campo para estado activo
};

Credential credentials[5]; // Máximo 5 reservas activas
int credential_count = 0;

// Tarjetas maestras hardcodeadas según especificaciones
const String MASTER_CARDS[] = {"MASTER001", "MASTER002", "ADMIN123"};
const int MASTER_CARD_COUNT = 3;

// ================= FUNCIONES DE MANEJO DE FECHAS =================
// Función para parsear fecha ISO 8601 a timestamp Unix usando time.h
unsigned long parseISODate(const String& isoDate) {
  // Formato esperado: "2024-01-15T10:30:00.000Z" o "2024-01-15T10:30:00Z"
  if (isoDate.length() < 19) return 0; // Fecha inválida

  struct tm t;
  memset(&t, 0, sizeof(struct tm));

  t.tm_year = isoDate.substring(0, 4).toInt() - 1900;
  t.tm_mon  = isoDate.substring(5, 7).toInt() - 1;
  t.tm_mday = isoDate.substring(8, 10).toInt();
  t.tm_hour = isoDate.substring(11, 13).toInt();
  t.tm_min  = isoDate.substring(14, 16).toInt();
  t.tm_sec  = isoDate.substring(17, 19).toInt();

  // Validaciones básicas
  if (t.tm_year < 120 || t.tm_year > 130) return 0; // 2020-2030
  if (t.tm_mon < 0 || t.tm_mon > 11) return 0;
  if (t.tm_mday < 1 || t.tm_mday > 31) return 0;
  if (t.tm_hour < 0 || t.tm_hour > 23) return 0;
  if (t.tm_min < 0 || t.tm_min > 59) return 0;
  if (t.tm_sec < 0 || t.tm_sec > 59) return 0;

  time_t ts = mktime(&t);
  if (ts < 0) return 0;
  return (unsigned long)ts;
}

// Función para obtener timestamp actual usando NTP
unsigned long getCurrentTimestamp() {
  if (!ntpInitialized) {
    // Fallback a timestamp base si NTP no está inicializado
    static unsigned long baseTimestamp = 1735689600; // 2025-01-01 00:00:00 UTC
    return baseTimestamp + (millis() / 1000);
  }
  
  // Obtener tiempo actual de NTP
  timeClient.update();
  return timeClient.getEpochTime();
}

// Función para inicializar NTP
void initializeNTP() {
  Serial.println("🕐 Inicializando NTP para Tijuana...");
  timeClient.begin();
  timeClient.setTimeOffset(TIJUANA_TIMEZONE_OFFSET);
  timeClient.setUpdateInterval(60000); // Actualizar cada minuto
  
  // Esperar a que se sincronice
  Serial.print("⏳ Sincronizando con servidor NTP");
  int attempts = 0;
  while (!timeClient.update() && attempts < 10) {
    delay(1000);
    Serial.print(".");
    attempts++;
  }
  
  if (attempts < 10) {
    ntpInitialized = true;
    Serial.println("\n✅ NTP sincronizado exitosamente");
    Serial.printf("🕐 Hora actual Tijuana: %s\n", timeClient.getFormattedTime().c_str());
    Serial.printf("📅 Timestamp Unix: %lu\n", timeClient.getEpochTime());
  } else {
    Serial.println("\n❌ Error al sincronizar NTP, usando timestamp base");
  }
}

// Función para verificar si una reserva está activa
bool isReservationActive(const Credential& cred) {
  if (!cred.is_active) return false;
  
  unsigned long currentTime = getCurrentTimestamp();
  unsigned long startTime = parseISODate(cred.valid_from);
  unsigned long endTime = parseISODate(cred.valid_until);
  
  // Validar que las fechas se parsearon correctamente
  if (startTime == 0 || endTime == 0) {
    Serial.printf("⚠️ Fechas inválidas en reserva %s\n", cred.reservation_id.c_str());
    return false;
  }
  
  bool isActive = (currentTime >= startTime && currentTime <= endTime);
  
  // Debug logging (siempre mostrar en desarrollo)
  Serial.printf("🔍 Verificando reserva %s: %lu <= %lu <= %lu = %s\n", 
                cred.reservation_id.c_str(), startTime, currentTime, endTime, 
                isActive ? "ACTIVA" : "INACTIVA");
  
  return isActive;
}

// Función para mostrar el estado actual de las credenciales
void showCredentialsStatus() {
  Serial.println("\n📋 === ESTADO DE CREDENCIALES ===");
  Serial.printf("🔢 Total de reservas: %d\n", credential_count);
  Serial.printf("🔑 Tarjetas maestras: %d\n", MASTER_CARD_COUNT);
  Serial.printf("⏰ Tiempo actual: %lu\n", getCurrentTimestamp());
  
  if (credential_count == 0) {
    Serial.println("📭 No hay reservas activas");
  } else {
    for (int i = 0; i < credential_count; i++) {
      const Credential& cred = credentials[i];
      bool isActive = isReservationActive(cred);
      
      Serial.printf("\n📋 Reserva %d: %s\n", i + 1, cred.reservation_id.c_str());
      Serial.printf("   👤 Propietario: %s\n", cred.owner.c_str());
      Serial.printf("   📅 Desde: %s\n", cred.valid_from.c_str());
      Serial.printf("   📅 Hasta: %s\n", cred.valid_until.c_str());
      Serial.printf("   🪪 Tarjetas: %d\n", cred.card_count);
      Serial.printf("   🔄 Estado: %s\n", isActive ? "✅ ACTIVA" : "❌ INACTIVA");
      
      if (cred.card_count > 0) {
        Serial.print("   🪪 UIDs: ");
        for (int j = 0; j < cred.card_count; j++) {
          Serial.print(cred.authorized_cards[j]);
          if (j < cred.card_count - 1) Serial.print(", ");
        }
        Serial.println();
      }
    }
  }
  Serial.println("================================\n");
}

// ================= DETECCIÓN IR MEJORADA =================
enum DetectionState { 
  WAITING, 
  ENTRY_DETECTED, 
  EXIT_DETECTED 
};
DetectionState state = WAITING;
unsigned long detectionStart = 0;
const unsigned long DETECTION_TIMEOUT = 3000; // 3 segundos según especificaciones

// Variables para manejo de errores
unsigned long lastErrorReport = 0;
const unsigned long ERROR_REPORT_INTERVAL = 5000; // Reportar errores cada 5 segundos máximo
int consecutiveErrors = 0;
const int MAX_CONSECUTIVE_ERRORS = 3;

// ================= VARIABLES DE RECONEXIÓN =================
unsigned long lastReconnectAttempt = 0;
const unsigned long RECONNECT_INTERVAL = 5000; // 5 segundos
int reconnectAttempts = 0;
const int MAX_RECONNECT_ATTEMPTS = 5;

// ---------------- CONFIGURACIÓN BLUETOOTH Y EEPROM ----------------
#if !defined(CONFIG_BT_ENABLED) || !defined(CONFIG_BLUEDROID_ENABLED)
#error SerialBT is not enabled! Please run 'make menuconfig' to and enable it
#endif

BluetoothSerial SerialBT;

#define EEPROM_MAX_STRING_LEN 100 // máximo de 100 caracteres para SSID/PW/SpaceID

// Estructura actualizada para almacenar también el space_id
struct StoredCredentials {
  char ssid_data[EEPROM_MAX_STRING_LEN];
  char password_data[EEPROM_MAX_STRING_LEN];
  int spaceId_data; // Cambiado a int para el space_id
};

StoredCredentials saved_credentials;

String BTMessage;
char BTreecieved;

// ---------------- FUNCIONES EEPROM Y BLUETOOTH ----------------
// Función unificada para guardar todas las configuraciones
void write_settings(const String& ssid_str, const String& pw_str, int spaceId_int) {
  if (ssid_str.length() >= EEPROM_MAX_STRING_LEN || pw_str.length() >= EEPROM_MAX_STRING_LEN) {
    Serial.println("⚠️ Credencial demasiado larga para el almacenamiento EEPROM.");
    SerialBT.println("⚠️ Credencial demasiado larga para el almacenamiento EEPROM.");
    return;
  }

  // Copiar las cadenas a los buffers de la estructura
  ssid_str.toCharArray(saved_credentials.ssid_data, ssid_str.length() + 1);
  pw_str.toCharArray(saved_credentials.password_data, pw_str.length() + 1);
  saved_credentials.spaceId_data = spaceId_int;

  EEPROM.put(0, saved_credentials);
  EEPROM.commit();

  Serial.println("✅ Configuración guardada en EEPROM.");
  Serial.print("SSID: ");
  Serial.println(saved_credentials.ssid_data);
  Serial.print("Password: ");
  Serial.println(saved_credentials.password_data);
  Serial.print("Space ID: ");
  Serial.println(saved_credentials.spaceId_data);
  SerialBT.println("✅ Configuración guardada. Reinicia para aplicar.");
}

void read_eeprom_settings() {
  EEPROM.get(0, saved_credentials);

  // Liberar memoria antigua si existe
  if (current_ssid_ptr != nullptr) {
    free(current_ssid_ptr);
    current_ssid_ptr = nullptr;
  }
  if (current_password_ptr != nullptr) {
    free(current_password_ptr);
    current_password_ptr = nullptr;
  }

  // Asignar memoria para las cadenas leídas y copiar
  if (strlen(saved_credentials.ssid_data) > 0) {
    current_ssid_ptr = (char*)malloc(strlen(saved_credentials.ssid_data) + 1);
    if (current_ssid_ptr) strcpy(current_ssid_ptr, saved_credentials.ssid_data);
  }
  if (strlen(saved_credentials.password_data) > 0) {
    current_password_ptr = (char*)malloc(strlen(saved_credentials.password_data) + 1);
    if (current_password_ptr) strcpy(current_password_ptr, saved_credentials.password_data);
  }
  
  // Leer space_id como entero
  current_space_id = saved_credentials.spaceId_data;

  Serial.println("\n--- Configuración de EEPROM ---");
  Serial.print("SSID guardado: ");
  Serial.println(current_ssid_ptr ? current_ssid_ptr : "N/A");
  Serial.print("Password guardado: ");
  Serial.println(current_password_ptr ? current_password_ptr : "N/A");
  Serial.print("Space ID guardado: ");
  Serial.println(current_space_id);
  Serial.println("-------------------------------\n");

  SerialBT.println("\n--- Configuración de EEPROM ---");
  SerialBT.print("SSID guardado: ");
  SerialBT.println(current_ssid_ptr ? current_ssid_ptr : "N/A");
  SerialBT.print("Space ID guardado: ");
  SerialBT.println(current_space_id);
  SerialBT.println("-------------------------------\n");
}

void process_message(String message, bool isBT) {
  if (message != "") {
    if (isBT) Serial.println("BT Recibido: " + message);
    else Serial.println("Serial Recibido: " + message);

    int symbolIndex = message.indexOf(':');
    if (symbolIndex != -1) {
      String myCommand = message.substring(0, symbolIndex);
      String myPayload = message.substring(symbolIndex + 1);

      if (myCommand == "wifi") {
        int commaIndex = myPayload.indexOf(',');
        if (commaIndex != -1) {
          String SSIDins = myPayload.substring(0, commaIndex);
          String PASSins = myPayload.substring(commaIndex + 1);
          write_settings(SSIDins, PASSins, current_space_id);
        } else {
          if (isBT) {
            SerialBT.println("❌ Formato de comando 'wifi' incorrecto. Use 'wifi:SSID,PASSWORD'");
          } else {
            Serial.println("❌ Formato de comando 'wifi' incorrecto. Use 'wifi:SSID,PASSWORD'");
          }
        }
             } else if (myCommand == "spaceid") {
         int newSpaceId = myPayload.toInt();
         write_settings(current_ssid_ptr ? String(current_ssid_ptr) : "Rias", current_password_ptr ? String(current_password_ptr) : "uttijuana", newSpaceId);
        if (isBT) {
            SerialBT.println("✅ Space ID actualizado. Reinicia para aplicar.");
        } else {
            Serial.println("✅ Space ID actualizado. Reinicia para aplicar.");
        }
      } else if (myCommand == "read eeprom") {
        read_eeprom_settings();
      } else if (myCommand == "clear eeprom") {
        for(int i = 0; i < EEPROM.length(); i++) {
            EEPROM.write(i, 0);
        }
        EEPROM.commit();
        if (isBT) {
            SerialBT.println("✅ EEPROM borrada exitosamente. Reinicia tu ESP32 y sube el código principal.");
        } else {
            Serial.println("✅ EEPROM borrada exitosamente. Reinicia tu ESP32 y sube el código principal.");
        }
             } else if (myCommand == "credentials") {
         showCredentialsStatus();
         if (isBT) {
             SerialBT.println("✅ Estado de credenciales mostrado en Serial");
         }
       } else if (myCommand == "ntp") {
         if (WiFi.status() == WL_CONNECTED) {
           initializeNTP();
           if (isBT) {
             SerialBT.println("✅ NTP sincronizado. Ver detalles en Serial.");
           }
         } else {
           if (isBT) {
             SerialBT.println("❌ WiFi no conectado. Conecta WiFi primero.");
           } else {
             Serial.println("❌ WiFi no conectado. Conecta WiFi primero.");
           }
         }
       } else if (myCommand == "time") {
         if (ntpInitialized) {
           timeClient.update();
           String currentTime = timeClient.getFormattedTime();
           unsigned long timestamp = timeClient.getEpochTime();
           String timeInfo = "🕐 Hora Tijuana: " + currentTime + " | Timestamp: " + String(timestamp);
           if (isBT) {
             SerialBT.println(timeInfo);
           } else {
             Serial.println(timeInfo);
           }
         } else {
           String timeInfo = "❌ NTP no inicializado. Usa 'ntp:' para sincronizar.";
           if (isBT) {
             SerialBT.println(timeInfo);
           } else {
             Serial.println(timeInfo);
           }
         }
       } else {
        if (isBT) {
            SerialBT.println("⚠️ Comando desconocido.");
        } else {
            Serial.println("⚠️ Comando desconocido.");
        }
      }
    } else {
      if (isBT) {
            SerialBT.println("❌ Mensaje no decodificado. Falta ':'");
      } else {
            Serial.println("❌ Mensaje no decodificado. Falta ':'");
      }
    }
  }
}

// ---------------- FUNCIONES WIFI Y RECONEXION ----------------
void conectarWiFi() {
  Serial.print("Conectando a WiFi...");
  Serial.print("\nSSID usado: ");
  Serial.println(current_ssid_ptr ? current_ssid_ptr : default_ssid);
  Serial.print("Password usado: ");
  Serial.println(current_password_ptr ? current_password_ptr : default_password);
  Serial.print("Longitud SSID: ");
  Serial.println(strlen(current_ssid_ptr ? current_ssid_ptr : default_ssid));
  Serial.print("Longitud PW: ");
  Serial.println(strlen(current_password_ptr ? current_password_ptr : default_password));

  WiFi.disconnect();
  delay(100);

  if (current_ssid_ptr != nullptr && strlen(current_ssid_ptr) > 0 && current_password_ptr != nullptr && strlen(current_password_ptr) > 0) {
    WiFi.begin(current_ssid_ptr, current_password_ptr);
    Serial.printf("Intentando conectar con credenciales guardadas: %s\n", current_ssid_ptr);
  } else {
    WiFi.begin(default_ssid, default_password);
    Serial.printf("Intentando conectar con credenciales por defecto: %s\n", default_ssid);
  }
}

void publishDeviceConfig() {
    DynamicJsonDocument doc(1024);

    // Información básica del dispositivo
    doc["device_id"] = device_id;
    doc["name"] = "Sistema de Control de Acceso";
    doc["type"] = "access_control";
         doc["space_id"] = current_space_id;
     doc["space_name"] = "Cubículo " + String(current_space_id);
    
    // Tópico principal MQTT
    String main_topic = "workbit/devices/" + String(device_id);
    doc["mqtt_topic"] = main_topic;
    
    // Tópicos de MQTT adicionales
    JsonObject mqtt_topics = doc.createNestedObject("mqtt_topics");
    mqtt_topics["request"] = request_topic;
    mqtt_topics["response"] = response_topic;
    mqtt_topics["guests"] = guest_update_topic;
    mqtt_topics["events"] = "workbit/sensors/infrared";
    mqtt_topics["main"] = main_topic;

    // Array de sensores
    JsonArray sensors = doc.createNestedArray("sensors");

    JsonObject s1 = sensors.createNestedObject();
    s1["name"] = "Lector RFID";
    s1["type"] = "rfid";
    s1["sensor_id"] = rfid_sensor_id;
    s1["unit"] = "UID";
    s1["description"] = "Sensor para la lectura de tarjetas RFID (MFRC522)";

    JsonObject s2 = sensors.createNestedObject();
    s2["name"] = "Sensores Infrarrojos";
    s2["type"] = "infrared_pair";
    s2["sensor_id"] = ir_sensor_id;
    s2["unit"] = "count";
    s2["description"] = "Par de sensores infrarrojos para conteo de personas";

    // Información de Hardware
    JsonObject hw = doc.createNestedObject("hardware_info");
    hw["model"] = "ESP32-WROOM-32";
    hw["firmware_version"] = "1.2.0";
    hw["mac_address"] = WiFi.macAddress();
    hw["ip_address"] = WiFi.localIP().toString();

    // Ubicación del dispositivo
    doc["location"] = "Puerta del cubículo " + String(current_space_id);

     char buffer[1024];
    serializeJson(doc, buffer);

    client.publish("workbit/devices/add", buffer);
    Serial.println("✅ Configuracion del dispositivo publicada en workbit/devices/add");
}

void conectarMQTT() {
  Serial.print("Conectando a MQTT...");
  if (client.connect("ESP32AccessClient")) {
    Serial.println("Conectado a MQTT ✅");
    client.subscribe(response_topic);
    client.subscribe(guest_update_topic);
    
    // Suscribirse a credenciales de nuestro espacio
    String credentialsTopic = "workbit/access/credentials/" + String(current_space_id);
    client.subscribe(credentialsTopic.c_str());
    Serial.println("🔑 Suscrito a credenciales: " + credentialsTopic);
    
    publishDeviceConfig();
  } else {
    Serial.print("Fallo rc=");
    Serial.print(client.state());
    Serial.println(" intentando de nuevo en 2s");
  }
}

// ================= RECONEXIÓN ROBUSTA CON BACKOFF EXPONENCIAL =================
void handleReconnection() {
  // Solo intentar reconexión si ha pasado el intervalo
  if (millis() - lastReconnectAttempt < RECONNECT_INTERVAL) {
    return;
  }

  bool needsReconnection = false;

  // Verificar WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("🔄 WiFi desconectado, intentando reconectar...");
    needsReconnection = true;
    
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      conectarWiFi();
      
      // Esperar resultado con timeout
      int attempts = 0;
      while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(250);
        Serial.print(".");
        attempts++;
      }
      
             if (WiFi.status() == WL_CONNECTED) {
         Serial.println("\n✅ WiFi reconectado");
         Serial.print("IP: ");
         Serial.println(WiFi.localIP());
         reconnectAttempts = 0; // Reset contador
         
         // Inicializar NTP después de reconectar WiFi
         if (!ntpInitialized) {
           initializeNTP();
         }
       } else {
        reconnectAttempts++;
        Serial.printf("\n❌ Reintento WiFi %d/%d fallido\n", reconnectAttempts, MAX_RECONNECT_ATTEMPTS);
      }
    } else {
      Serial.println("❌ Máximo de reintentos WiFi alcanzado, esperando...");
      delay(30000); // Esperar 30 segundos antes de resetear contador
      reconnectAttempts = 0;
    }
  }

  // Verificar MQTT solo si WiFi está conectado
  if (WiFi.status() == WL_CONNECTED && !client.connected()) {
    Serial.println("🔄 MQTT desconectado, intentando reconectar...");
    needsReconnection = true;
    
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      conectarMQTT();
      
      if (client.connected()) {
        Serial.println("✅ MQTT reconectado");
        reconnectAttempts = 0; // Reset contador
        
        // Suscribirse a credenciales de nuestro espacio
        String credentialsTopic = "workbit/access/credentials/" + String(current_space_id);
        client.subscribe(credentialsTopic.c_str());
        Serial.println("🔑 Suscrito a credenciales: " + credentialsTopic);
        
      } else {
        reconnectAttempts++;
        Serial.printf("❌ Reintento MQTT %d/%d fallido\n", reconnectAttempts, MAX_RECONNECT_ATTEMPTS);
      }
    }
  }

  if (needsReconnection) {
    // Backoff exponencial: 5s, 10s, 20s, 40s, 80s
    unsigned long backoffDelay = RECONNECT_INTERVAL * (1 << min(reconnectAttempts, 4));
    lastReconnectAttempt = millis();
    
    if (reconnectAttempts > 0) {
      Serial.printf("⏱️ Próximo intento en %lu segundos\n", backoffDelay / 1000);
    }
  }
}

// Función legacy para compatibilidad
void reconnectIfDisconnected() {
  handleReconnection();
}

// ================= CALLBACK MQTT ESTANDARIZADO =================
void callback(char* topic, byte* payload, unsigned int length) {
  StaticJsonDocument<1024> doc;
  DeserializationError error = deserializeJson(doc, payload, length);
  if (error) {
    Serial.println("❌ Error al deserializar JSON");
    return;
  }

  String topicStr = String(topic);

  // Manejar respuestas de acceso (legacy)
  if (topicStr == response_topic) {
    handleAccessResponse(doc);
    
  // Manejar actualizaciones de invitados (legacy)
  } else if (topicStr == guest_update_topic) {
    handleGuestUpdate(doc);
    
  // Manejar credenciales por espacio (NUEVO - según especificaciones)
  } else if (topicStr.startsWith("workbit/access/credentials/")) {
    handleCredentialsUpdate(doc);
    
  } else {
    Serial.println("📬 Tópico MQTT no reconocido: " + topicStr);
  }
}

// ================= FUNCIONES DE CALLBACK =================
void handleAccessResponse(StaticJsonDocument<1024>& doc) {
  const char* uid = doc["card_code"];
  bool access = doc["access_granted"];

  if (!uid) {
    Serial.println("⚠️ UID no válido recibido");
    return;
  }

  Serial.printf("📨 Respuesta de acceso para UID: %s - %s\n", uid, access ? "CONCEDIDO" : "DENEGADO");

  if (access && uidEnEspera == String(uid)) {
    accesoHabilitado = true;
    tiempoAcceso = millis();
    Serial.println("✅ Acceso concedido por servidor");
  } else {
    Serial.println("🚫 Acceso denegado o UID no coincide");
  }

  uidEnEspera = "";
}

void handleGuestUpdate(StaticJsonDocument<1024>& doc) {
  JsonArray guests = doc["guests"].as<JsonArray>();
  
  Serial.printf("🔄 Actualizando %d invitados\n", guests.size());
  
  // Por ahora mantenemos compatibilidad con sistema legacy
  // En el nuevo sistema, esto se maneja por credenciales
}

void handleCredentialsUpdate(StaticJsonDocument<1024>& doc) {
  Serial.println("🔑 Recibiendo credenciales RFID estandarizadas...");

  // Limpiar credenciales existentes
  credential_count = 0;
  
  // Extraer space_id como número
  int space_id_num = doc["space_id"] | -1;
  
  // Verificar que es para nuestro espacio
  if (space_id_num == -1 || space_id_num != current_space_id) {
    Serial.printf("⚠️ Credenciales recibidas para espacio %d, esperábamos %d\n", 
                  space_id_num, current_space_id);
    return;
  }

  // Mostrar información del mensaje recibido
  Serial.printf("📨 Mensaje recibido para espacio %d\n", space_id_num);
  Serial.printf("📅 Timestamp: %s\n", doc["timestamp"] | "N/A");
  Serial.printf("⏰ Expira: %s\n", doc["expires_at"] | "N/A");
  Serial.printf("🕐 Hora actual Tijuana: %s\n", ntpInitialized ? timeClient.getFormattedTime().c_str() : "NTP no disponible");

  // Procesar reservas
  JsonArray reservations = doc["reservations"];
  Serial.printf("📋 Procesando %d reservas\n", reservations.size());
  
  for (JsonVariant reservation : reservations) {
    if (credential_count >= 5) {
      Serial.println("⚠️ Máximo de 5 reservas alcanzado, ignorando el resto");
      break;
    }

    const char* res_id = reservation["reservation_id"];
    const char* owner = reservation["owner"];
    const char* valid_from = reservation["valid_from"];
    const char* valid_until = reservation["valid_until"];
    JsonArray cards = reservation["authorized_cards"];

    if (!res_id || !cards) {
      Serial.println("⚠️ Reserva sin ID o tarjetas, saltando...");
      continue;
    }

    Credential& cred = credentials[credential_count];
    cred.reservation_id = String(res_id);
    cred.owner = owner ? String(owner) : "unknown";
    cred.card_count = 0;

    // Validar fechas
    if (!valid_from || !valid_until) {
      Serial.printf("⚠️ Fechas inválidas en reserva %s, saltando...\n", res_id);
      continue;
    }

    // Agregar tarjetas (máximo 15)
    for (JsonVariant card : cards) {
      if (cred.card_count >= 15) {
        Serial.println("⚠️ Máximo de 15 tarjetas por reserva alcanzado");
        break;
      }
      
      String cardStr = String(card.as<const char*>());
      if (cardStr.length() > 0) {
        cred.authorized_cards[cred.card_count] = cardStr;
        cred.card_count++;
      }
    }

    // Guardar fechas ISO
    cred.valid_from = String(valid_from);
    cred.valid_until = String(valid_until);
    cred.is_active = true;

    // Verificar si la reserva está activa
    bool isActive = isReservationActive(cred);
    
    Serial.printf("✅ Credencial agregada: %s (%s)\n", 
                  cred.reservation_id.c_str(), cred.owner.c_str());
    Serial.printf("   📅 Desde: %s\n", cred.valid_from.c_str());
    Serial.printf("   📅 Hasta: %s\n", cred.valid_until.c_str());
    Serial.printf("   🪪 Tarjetas: %d\n", cred.card_count);
    Serial.printf("   🔄 Estado: %s\n", isActive ? "ACTIVA" : "INACTIVA");
    
    credential_count++;
  }

  // Mostrar tarjetas maestras si están en el mensaje
  if (doc.containsKey("master_cards")) {
    JsonArray masterCards = doc["master_cards"];
    Serial.printf("🔑 Tarjetas maestras recibidas: %d\n", masterCards.size());
    for (JsonVariant card : masterCards) {
      Serial.printf("   🪪 %s\n", card.as<const char*>());
    }
  }

  Serial.printf("🔑 Credenciales actualizadas: %d reservas activas\n", credential_count);
  Serial.println("📋 Lista de acceso actualizada y lista para uso");
}

// ---------------- PUBLICACIONES MQTT ----------------
void publishRequestAccess(const String& uid) {
  StaticJsonDocument<256> doc;
  doc["device_id"] = device_id;
  doc["space_id"] = current_space_id;
  doc["card_code"] = uid;

  char buffer[256];
  serializeJson(doc, buffer);
  if (client.connected()) {
    client.publish(request_topic, buffer);
  } else {
    Serial.println("⚠️ MQTT no conectado. No se pudo publicar la solicitud.");
  }
}

// ================= FUNCIONES ESTANDARIZADAS DE PUBLICACIÓN =================
void publishInfraredEvent(const char* event, int people_inside) {
  StaticJsonDocument<512> doc;
  
  doc["space_id"] = current_space_id;
  doc["device_id"] = device_id;
  doc["sensor_id"] = ir_sensor_id;
  doc["sensor_type"] = "infrared_pair";
  doc["timestamp"] = millis();
  doc["event"] = event;
  doc["people_inside"] = people_inside;

  char jsonBuffer[512];
  serializeJson(doc, jsonBuffer);
  
  if (client.connected()) {
    // Publicar en topic legacy para compatibilidad
    client.publish("workbit/sensors/infrared", jsonBuffer);
    
    // Publicar también en topic estandarizado para nuevos handlers
    String newTopic = "workbit/devices/" + String(device_id) + "/readings";
    client.publish(newTopic.c_str(), jsonBuffer);
    
    Serial.printf("✅ Evento IR publicado: %s, personas: %d\n", event, people_inside);
  } else {
    Serial.println("⚠️ MQTT no conectado. No se pudo publicar evento IR.");
  }
}

void publishError(String errorType, String message) {
  StaticJsonDocument<256> doc;
  
  doc["space_id"] = current_space_id;
  doc["alert_type"] = errorType;
  doc["message"] = message;
  doc["device_id"] = device_id;
  doc["timestamp"] = millis();

  char buffer[256];
  serializeJson(doc, buffer);
  
  String topic = "workbit/alerts/" + String(current_space_id);
  if (client.connected()) {
    client.publish(topic.c_str(), buffer);
    Serial.println("⚠️ Error publicado: " + errorType + " - " + message);
  }
}

// ---------------- SETUP ----------------
void setup() {
  Serial.begin(115200);
  delay(2000);
  Serial.println("Serial inicializado. Preparando sistema...");

  SPI.begin();
  mfrc522.PCD_Init();

  pinMode(sensorEntrada, INPUT);
  pinMode(sensorSalida, INPUT);

  EEPROM.begin(sizeof(StoredCredentials));
  read_eeprom_settings();

  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
  client.setBufferSize(1024);

  SerialBT.begin("ESP32_WorkBit_Access");
  Serial.println("Bluetooth iniciado: ESP32_WorkBit_Access");

  // Inicializar NTP después de conectar WiFi
  if (WiFi.status() == WL_CONNECTED) {
    initializeNTP();
  }

  Serial.println("🟢 Sistema listo.");
  
  // Mostrar estado inicial de credenciales
  showCredentialsStatus();
}

// ================= LOOP PRINCIPAL ESTANDARIZADO =================
void loop() {
  // Asegurar conectividad robusta
  handleReconnection();
  client.loop();

  // Manejar mensajes Bluetooth
  if (SerialBT.available()) {
    while (SerialBT.available() > 0) {
      BTreecieved = (char)SerialBT.read();
      if (BTreecieved != '\n') {
        BTMessage += BTreecieved;
      } else {
        break;
      }
    }
    if (BTreecieved == '\n') {
      process_message(BTMessage, true);
      BTMessage = "";
      BTreecieved = 0;
    }
  }

  // Manejar mensajes serie
  if (Serial.available()) {
    String serialMessage = Serial.readStringUntil('\n');
    process_message(serialMessage, false);
  }

  // Lectura RFID con delay
  if (millis() - ultimaLecturaRFID > delayLectura && leerRFID()) {
    ultimaLecturaRFID = millis();
  }

  // Timeout de acceso
  if (accesoHabilitado && millis() - tiempoAcceso > duracionAcceso) {
    accesoHabilitado = false;
    Serial.println("⛔ Tiempo de acceso expirado");
  }

  // ================= DETECCIÓN IR MEJORADA CON MANEJO DE ERRORES =================
  if (accesoHabilitado) {
    handleInfraredDetection();
  }
}

// ================= FUNCIÓN DE DETECCIÓN IR MEJORADA =================
void handleInfraredDetection() {
  int entrada = digitalRead(sensorEntrada);
  int salida = digitalRead(sensorSalida);
  unsigned long now = millis();
  
  // Error: ambos sensores activos simultáneamente
  if (entrada == LOW && salida == LOW) {
    consecutiveErrors++;
    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS && (now - lastErrorReport) > ERROR_REPORT_INTERVAL) {
      publishError("detection_error", "Ambos sensores IR activos simultaneamente");
      lastErrorReport = now;
      Serial.println("❌ ERROR: Ambos sensores IR activos");
    }
    return;
  } else {
    consecutiveErrors = 0; // Reset contador de errores
  }
  
  switch (state) {
    case WAITING:
      if (entrada == LOW && salida == HIGH) {
        state = ENTRY_DETECTED;
        detectionStart = now;
        Serial.println("👁️ Detección de entrada iniciada");
      } else if (salida == LOW && entrada == HIGH) {
        state = EXIT_DETECTED;
        detectionStart = now;
        Serial.println("👁️ Detección de salida iniciada");
      }
      break;
      
    case ENTRY_DETECTED:
      if (salida == LOW && (now - detectionStart) < DETECTION_TIMEOUT) {
        // Entrada completada exitosamente
        contadorPersonas++;
        
        // Verificar límite de capacidad (máximo 8 según especificaciones)
        if (contadorPersonas > 8) {
          Serial.printf("⚠️ CAPACIDAD EXCEDIDA: %d personas (máximo 8)\n", contadorPersonas);
          publishError("capacity_exceeded", "Capacidad maxima excedida");
        }
        
        Serial.printf("✅ ENTRADA registrada. Personas: %d\n", contadorPersonas);
        publishInfraredEvent("entry", contadorPersonas);
        
        state = WAITING;
        esperarSensoresLibres();
        delay(600); // Debounce
        
      } else if ((now - detectionStart) >= DETECTION_TIMEOUT) {
        // Timeout en detección de entrada
        publishError("detection_timeout", "Timeout en deteccion de entrada");
        Serial.println("⏰ Timeout en detección de entrada");
        state = WAITING;
      }
      break;
      
    case EXIT_DETECTED:
      if (entrada == LOW && (now - detectionStart) < DETECTION_TIMEOUT) {
        // Salida completada exitosamente
        if (contadorPersonas > 0) {
          contadorPersonas--;
        } else {
          Serial.println("⚠️ Intento de salida con contador en 0");
        }
        
        Serial.printf("✅ SALIDA registrada. Personas: %d\n", contadorPersonas);
        publishInfraredEvent("exit", contadorPersonas);
        
        state = WAITING;
        esperarSensoresLibres();
        delay(600); // Debounce
        
      } else if ((now - detectionStart) >= DETECTION_TIMEOUT) {
        // Timeout en detección de salida
        publishError("detection_timeout", "Timeout en deteccion de salida");
        Serial.println("⏰ Timeout en detección de salida");
        state = WAITING;
      }
      break;
  }
}

// ================= FUNCIONES RFID ESTANDARIZADAS =================
bool isCardAuthorized(String cardUid) {
  Serial.printf("🔍 Verificando autorización para tarjeta: %s\n", cardUid.c_str());
  
  // Verificar tarjetas maestras (hardcodeadas según especificaciones)
  for (int i = 0; i < MASTER_CARD_COUNT; i++) {
    if (cardUid == MASTER_CARDS[i]) {
      Serial.println("🔑 Tarjeta maestra detectada: " + cardUid);
      return true;
    }
  }
  
  // Verificar credenciales de reservas
  unsigned long currentTime = getCurrentTimestamp();
  Serial.printf("⏰ Tiempo actual: %lu\n", currentTime);
  
  for (int i = 0; i < credential_count; i++) {
    Serial.printf("🔍 Verificando reserva %d: %s\n", i, credentials[i].reservation_id.c_str());
    
    // Verificar si la reserva está activa
    if (isReservationActive(credentials[i])) {
      Serial.printf("✅ Reserva %s está activa, verificando tarjetas...\n", credentials[i].reservation_id.c_str());
      
      for (int j = 0; j < credentials[i].card_count; j++) {
        if (cardUid == credentials[i].authorized_cards[j]) {
          Serial.printf("✅ Tarjeta autorizada por reserva %s (%s)\n", 
                        credentials[i].reservation_id.c_str(), 
                        credentials[i].owner.c_str());
          Serial.printf("📅 Válida desde: %s hasta: %s\n", 
                        credentials[i].valid_from.c_str(), 
                        credentials[i].valid_until.c_str());
          return true;
        }
      }
    } else {
      Serial.printf("❌ Reserva %s no está activa\n", credentials[i].reservation_id.c_str());
    }
  }
  
  Serial.printf("🚫 Tarjeta %s no autorizada\n", cardUid.c_str());
  return false;
}

bool leerRFID() {
  if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) return false;

  String uid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    uid += String(mfrc522.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  Serial.print("🪪 UID detectado: ");
  Serial.println(uid);

  // Verificar autorización usando nuevo sistema
  if (isCardAuthorized(uid)) {
    accesoHabilitado = true;
    tiempoAcceso = millis();
    Serial.println("✅ Acceso autorizado localmente");
    return true;
  } else {
    Serial.println("🚫 Tarjeta no autorizada, consultando servidor...");
    uidEnEspera = uid;
    publishRequestAccess(uid);
    return true;
  }
}

void esperarSensorLibre(int pin) {
  while (digitalRead(pin) == LOW) delay(10);
}

void esperarSensoresLibres() {
  while (digitalRead(sensorEntrada) == LOW || digitalRead(sensorSalida) == LOW) delay(10);
}
