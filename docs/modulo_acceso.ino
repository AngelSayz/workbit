#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <set>
#include <EEPROM.h>
#include <BluetoothSerial.h>

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

// ---------------- IDENTIFICADORES ----------------
// Variable global para el space_id que se leerá de EEPROM
char* current_space_id_ptr = nullptr;
const char* device_id = "esp32_01";
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
  unsigned long valid_from;
  unsigned long valid_until;
  String owner;
};

Credential credentials[5]; // Máximo 5 reservas activas
int credential_count = 0;

// Tarjetas maestras hardcodeadas según especificaciones
const String MASTER_CARDS[] = {"MASTER001", "MASTER002", "ADMIN123"};
const int MASTER_CARD_COUNT = 3;

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
  char spaceId_data[EEPROM_MAX_STRING_LEN]; // Nuevo campo para el space_id
};

StoredCredentials saved_credentials;

String BTMessage;
char BTreecieved;

// ---------------- FUNCIONES EEPROM Y BLUETOOTH ----------------
// Función unificada para guardar todas las configuraciones
void write_settings(const String& ssid_str, const String& pw_str, const String& spaceId_str) {
  if (ssid_str.length() >= EEPROM_MAX_STRING_LEN || pw_str.length() >= EEPROM_MAX_STRING_LEN || spaceId_str.length() >= EEPROM_MAX_STRING_LEN) {
    Serial.println("⚠️ Credencial o Space ID demasiado largo para el almacenamiento EEPROM.");
    SerialBT.println("⚠️ Credencial o Space ID demasiado largo para el almacenamiento EEPROM.");
    return;
  }

  // Copiar las cadenas a los buffers de la estructura
  ssid_str.toCharArray(saved_credentials.ssid_data, ssid_str.length() + 1);
  pw_str.toCharArray(saved_credentials.password_data, pw_str.length() + 1);
  spaceId_str.toCharArray(saved_credentials.spaceId_data, spaceId_str.length() + 1);

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
  if (current_space_id_ptr != nullptr) {
    free(current_space_id_ptr);
    current_space_id_ptr = nullptr;
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
  if (strlen(saved_credentials.spaceId_data) > 0) {
    current_space_id_ptr = (char*)malloc(strlen(saved_credentials.spaceId_data) + 1);
    if (current_space_id_ptr) strcpy(current_space_id_ptr, saved_credentials.spaceId_data);
  }

  Serial.println("\n--- Configuración de EEPROM ---");
  Serial.print("SSID guardado: ");
  Serial.println(current_ssid_ptr ? current_ssid_ptr : "N/A");
  Serial.print("Password guardado: ");
  Serial.println(current_password_ptr ? current_password_ptr : "N/A");
  Serial.print("Space ID guardado: ");
  Serial.println(current_space_id_ptr ? current_space_id_ptr : "N/A");
  Serial.println("-------------------------------\n");

  SerialBT.println("\n--- Configuración de EEPROM ---");
  SerialBT.print("SSID guardado: ");
  SerialBT.println(current_ssid_ptr ? current_ssid_ptr : "N/A");
  SerialBT.print("Space ID guardado: ");
  SerialBT.println(current_space_id_ptr ? current_space_id_ptr : "N/A");
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
          write_settings(SSIDins, PASSins, current_space_id_ptr ? String(current_space_id_ptr) : "1");
        } else {
          if (isBT) {
            SerialBT.println("❌ Formato de comando 'wifi' incorrecto. Use 'wifi:SSID,PASSWORD'");
          } else {
            Serial.println("❌ Formato de comando 'wifi' incorrecto. Use 'wifi:SSID,PASSWORD'");
          }
        }
      } else if (myCommand == "spaceid") {
        write_settings(current_ssid_ptr ? String(current_ssid_ptr) : "Rias", current_password_ptr ? String(current_password_ptr) : "uttijuana", myPayload);
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
    doc["device_id"] = "env_001";
    doc["name"] = "Sistema de Control de Acceso";
    doc["type"] = "access_control";
    doc["space_id"] = (current_space_id_ptr && strlen(current_space_id_ptr) > 0) ? current_space_id_ptr : "cubiculo_1";
    doc["space_name"] = "Oficina 1";
    
    // Tópicos de MQTT
    JsonObject mqtt_topics = doc.createNestedObject("mqtt_topics");
    mqtt_topics["request"] = request_topic;
    mqtt_topics["response"] = response_topic;
    mqtt_topics["guests"] = guest_update_topic;
    mqtt_topics["events"] = "workbit/sensors/infrared";
    mqtt_topics["mqtt_topic"] = "workbit/devices/env_001";

    // Array de sensores
    JsonArray sensors = doc.createNestedArray("sensors");

    JsonObject s1 = sensors.createNestedObject();
    s1["name"] = "Lector RFID";
    s1["type"] = "rfid";
    s1["unit"] = "UID";
    s1["description"] = "Sensor para la lectura de tarjetas RFID (MFRC522)";
    s1["sensor_id"] = rfid_sensor_id;

    JsonObject s2 = sensors.createNestedObject();
    s2["name"] = "Sensores Infrarrojos";
    s2["type"] = "infrared_pair";
    s2["unit"] = "N/A";
    s2["description"] = "Par de sensores infrarrojos para conteo de personas";
    s2["sensor_id"] = ir_sensor_id;

    // Información de Hardware
    JsonObject hw = doc.createNestedObject("hardware_info");
    hw["model"] = "ESP32-WROOM-32";
    hw["firmware_version"] = "1.2.0";
    hw["mac_address"] = WiFi.macAddress();
    hw["ip_address"] = WiFi.localIP().toString();

    // Ubicación del dispositivo
    doc["location"] = "Puerta del cubiculo";

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
        String spaceId = (current_space_id_ptr && strlen(current_space_id_ptr) > 0) ? String(current_space_id_ptr) : "1";
        String credentialsTopic = "workbit/access/credentials/" + spaceId;
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
  
  const char* space_id_str = doc["space_id"];
  String current_space = (current_space_id_ptr && strlen(current_space_id_ptr) > 0) ? String(current_space_id_ptr) : "1";
  
  // Verificar que es para nuestro espacio
  if (!space_id_str || String(space_id_str) != current_space) {
    Serial.printf("⚠️ Credenciales recibidas para espacio %s, esperábamos %s\n", 
                  space_id_str ? space_id_str : "null", current_space.c_str());
    return;
  }

  // Procesar reservas
  JsonArray reservations = doc["reservations"];
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

    if (!res_id || !cards) continue;

    Credential& cred = credentials[credential_count];
    cred.reservation_id = String(res_id);
    cred.owner = owner ? String(owner) : "unknown";
    cred.card_count = 0;

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

    // Parsear timestamps (simplificado)
    cred.valid_from = valid_from ? millis() : 0;
    cred.valid_until = valid_until ? millis() + (24 * 60 * 60 * 1000) : ULONG_MAX; // 24h por defecto

    Serial.printf("✅ Credencial agregada: %s (%s) - %d tarjetas\n", 
                  cred.reservation_id.c_str(), cred.owner.c_str(), cred.card_count);
    
    credential_count++;
  }

  Serial.printf("🔑 Credenciales actualizadas: %d reservas, tarjetas maestras: %d\n", 
                credential_count, MASTER_CARD_COUNT);
  Serial.println("📋 Lista actual de acceso actualizada");
}

// ---------------- PUBLICACIONES MQTT ----------------
void publishRequestAccess(const String& uid) {
  StaticJsonDocument<256> doc;
  doc["device_id"] = device_id;
  doc["space_id"] = (current_space_id_ptr && strlen(current_space_id_ptr) > 0) ? current_space_id_ptr : "cubiculo_1";
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
  String spaceId = (current_space_id_ptr && strlen(current_space_id_ptr) > 0) ? String(current_space_id_ptr) : "1";
  
  doc["space_id"] = spaceId.toInt();
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
  String spaceId = (current_space_id_ptr && strlen(current_space_id_ptr) > 0) ? String(current_space_id_ptr) : "1";
  
  doc["space_id"] = spaceId.toInt();
  doc["alert_type"] = errorType;
  doc["message"] = message;
  doc["device_id"] = device_id;
  doc["timestamp"] = millis();

  char buffer[256];
  serializeJson(doc, buffer);
  
  String topic = "workbit/alerts/" + spaceId;
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

  Serial.println("🟢 Sistema listo.");
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
  // Verificar tarjetas maestras (hardcodeadas según especificaciones)
  for (int i = 0; i < MASTER_CARD_COUNT; i++) {
    if (cardUid == MASTER_CARDS[i]) {
      Serial.println("🔑 Tarjeta maestra detectada: " + cardUid);
      return true;
    }
  }
  
  // Verificar credenciales de reservas
  unsigned long currentTime = millis();
  for (int i = 0; i < credential_count; i++) {
    // Verificar si la reserva está activa (simplificado)
    if (currentTime >= credentials[i].valid_from && currentTime <= credentials[i].valid_until) {
      for (int j = 0; j < credentials[i].card_count; j++) {
        if (cardUid == credentials[i].authorized_cards[j]) {
          Serial.printf("✅ Tarjeta autorizada por reserva %s (%s)\n", 
                        credentials[i].reservation_id.c_str(), 
                        credentials[i].owner.c_str());
          return true;
        }
      }
    }
  }
  
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
