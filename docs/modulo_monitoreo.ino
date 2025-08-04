#include <Wire.h>
#include "Adafruit_CCS811.h"
#include "DHT.h"
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <EEPROM.h>
#include <BluetoothSerial.h>

// -------- Wifi -----------
const char* default_ssid = "Rias";
const char* default_password = "uttijuana";

// Ahora almacenaremos las credenciales y el space_id como punteros
char* current_ssid_ptr = nullptr;
char* current_password_ptr = nullptr;

// Nueva variable global para el space_id
char* current_space_id_ptr = nullptr;
const char* default_space_id = "2";

// ================= VARIABLES PARA PROMEDIO DE LECTURAS =================
// Buffer circular para 6 lecturas (cada 10 segundos durante 1 minuto)
#define BUFFER_SIZE 6
float tempBuffer[BUFFER_SIZE];
float humBuffer[BUFFER_SIZE]; 
float co2Buffer[BUFFER_SIZE];
int bufferIndex = 0;
bool bufferFull = false;

unsigned long lastReading = 0;
unsigned long lastPublish = 0;
const unsigned long READING_INTERVAL = 10000;  // 10 segundos
const unsigned long PUBLISH_INTERVAL = 60000;  // 1 minuto

// ================= UMBRALES ESTANDARIZADOS =================
// Umbrales según especificaciones del usuario
struct Thresholds {
  float co2_good = 800.0;      // < 800 ppm = Verde
  float co2_warning = 1200.0;  // 800-1199 ppm = Amarillo, ≥1200 = Rojo
  
  float temp_min_good = 20.0;  // 20-25°C = Verde
  float temp_max_good = 25.0;
  float temp_min_warning = 18.0; // 18-19.9°C y 25.1-27.9°C = Amarillo
  float temp_max_warning = 27.9;
  
  float hum_min_good = 40.0;   // 40-60% = Verde
  float hum_max_good = 60.0;
  float hum_min_warning = 30.0; // 30-39.9% y 60.1-70% = Amarillo
  float hum_max_warning = 70.0;
} thresholds;

// ================= VARIABLES DE RECONEXIÓN =================
unsigned long lastReconnectAttempt = 0;
const unsigned long RECONNECT_INTERVAL = 5000; // 5 segundos
int reconnectAttempts = 0;
const int MAX_RECONNECT_ATTEMPTS = 5;

// ---------------- CONFIGURACION MQTT ----------------
const char* mqtt_server = "broker.emqx.io";
WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastPublish = 0;

// -------- CONFIG DHT --------
#define DHTPIN 18
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// Pines para el LED RGB (Cátodo común)
const int RED_PIN = 15;
const int GREEN_PIN = 2;
const int BLUE_PIN = 4;

// Identificadores (ahora usan las variables dinámicas)
const char* device_id = "esp32_02";
const char* co2_sensor_id = "co2_sensor_01";
const char* temp_sensor_id = "temp_sensor_01";
const char* hum_sensor_id = "hum_sensor_01";

// -------- CCS811 --------
Adafruit_CCS811 ccs;

// -------- BLUETOOTH Y EEPROM --------
#if !defined(CONFIG_BT_ENABLED) || !defined(CONFIG_BLUEDROID_ENABLED)
#error SerialBT is not enabled! Please run 'make menuconfig' to and enable it
#endif

BluetoothSerial SerialBT;

#define EEPROM_MAX_STRING_LEN 100 // Tamaño máximo para SSID y PW

// Estructura para almacenar credenciales WiFi y el space_id
struct StoredSettings { 
    char ssid_data[EEPROM_MAX_STRING_LEN];
    char password_data[EEPROM_MAX_STRING_LEN];
    char spaceId_data[EEPROM_MAX_STRING_LEN]; // Nuevo campo
};

StoredSettings saved_settings; 

String BTMessage;
char BTreecieved;

// ================= FUNCIONES DE CALIDAD ESTANDARIZADAS =================
String getQuality(float value, String sensorType) {
  if (sensorType == "co2") {
    if (value < thresholds.co2_good) return "good";
    if (value < thresholds.co2_warning) return "warning";
    return "critical";
  } else if (sensorType == "temperature") {
    if (value >= thresholds.temp_min_good && value <= thresholds.temp_max_good) return "good";
    if (value >= thresholds.temp_min_warning && value <= thresholds.temp_max_warning) return "warning";
    return "critical";
  } else if (sensorType == "humidity") {
    if (value >= thresholds.hum_min_good && value <= thresholds.hum_max_good) return "good";
    if (value >= thresholds.hum_min_warning && value <= thresholds.hum_max_warning) return "warning";
    return "critical";
  }
  return "unknown";
}

// ================= FUNCIONES DE BUFFER Y PROMEDIO =================
void addToBuffer(float temp, float hum, float co2) {
  tempBuffer[bufferIndex] = temp;
  humBuffer[bufferIndex] = hum;
  co2Buffer[bufferIndex] = co2;
  
  bufferIndex = (bufferIndex + 1) % BUFFER_SIZE;
  if (!bufferFull && bufferIndex == 0) {
    bufferFull = true;
  }
  
  Serial.printf("📊 Buffer actualizado [%d]: T=%.1f°C, H=%.0f%%, CO2=%.0fppm\n", 
                bufferIndex, temp, hum, co2);
}

float calculateAverage(float buffer[]) {
  float sum = 0;
  int count = bufferFull ? BUFFER_SIZE : bufferIndex;
  
  for (int i = 0; i < count; i++) {
    sum += buffer[i];
  }
  
  return count > 0 ? sum / count : 0;
}

// ================= FUNCIONES DE ALERTAS =================
void checkAndPublishAlerts(float co2, float temp, float hum, int peopleCount) {
  String spaceId = (current_space_id_ptr && strlen(current_space_id_ptr) > 0) ? String(current_space_id_ptr) : default_space_id;
  
  // Alerta de CO₂ crítico (≥1200 ppm)
  if (co2 >= thresholds.co2_warning) {
    publishAlert("co2_critical", co2, "Niveles de CO₂ críticos", spaceId);
  }
  
  // Alerta de temperatura crítica
  String tempQuality = getQuality(temp, "temperature");
  if (tempQuality == "critical") {
    publishAlert("temperature_critical", temp, "Temperatura fuera de rango", spaceId);
  }
  
  // Alerta de humedad crítica
  String humQuality = getQuality(hum, "humidity");
  if (humQuality == "critical") {
    publishAlert("humidity_critical", hum, "Humedad fuera de rango", spaceId);
  }
}

void publishAlert(String alertType, float value, String message, String spaceId) {
  DynamicJsonDocument doc(512);
  doc["space_id"] = spaceId.toInt();
  doc["alert_type"] = alertType;
  doc["value"] = value;
  doc["message"] = message;
  doc["device_id"] = device_id;
  doc["timestamp"] = millis();
  
  char buffer[512];
  serializeJson(doc, buffer);
  
  String topic = "workbit/alerts/" + spaceId;
  if (client.connected()) {
    client.publish(topic.c_str(), buffer);
    Serial.println("⚠️ Alerta publicada: " + alertType + " (" + String(value) + ")");
  } else {
    Serial.println("⚠️ No se pudo publicar alerta - MQTT desconectado");
  }
}

// ================= FUNCIONES AUXILIARES ================
void setColor(bool r, bool g, bool b) {
  digitalWrite(RED_PIN, r);
  digitalWrite(GREEN_PIN, g);
  digitalWrite(BLUE_PIN, b);
}

// ---------------- FUNCIONES EEPROM Y BLUETOOTH ----------------
// Función unificada para guardar todas las configuraciones
void write_settings(const String& ssid_str, const String& pw_str, const String& spaceId_str) {
  if (ssid_str.length() >= EEPROM_MAX_STRING_LEN || pw_str.length() >= EEPROM_MAX_STRING_LEN || spaceId_str.length() >= EEPROM_MAX_STRING_LEN) {
    Serial.println("⚠️ Credencial o Space ID demasiado largo para el almacenamiento EEPROM.");
    SerialBT.println("⚠️ Credencial o Space ID demasiado largo para el almacenamiento EEPROM.");
    return;
  }

  // Copiar las cadenas a los buffers de la estructura
  ssid_str.toCharArray(saved_settings.ssid_data, ssid_str.length() + 1);
  pw_str.toCharArray(saved_settings.password_data, pw_str.length() + 1);
  spaceId_str.toCharArray(saved_settings.spaceId_data, spaceId_str.length() + 1);

  EEPROM.put(0, saved_settings);
  EEPROM.commit();

  Serial.println("✅ Configuración guardada en EEPROM.");
  Serial.print("SSID: ");
  Serial.println(saved_settings.ssid_data);
  Serial.print("Password: ");
  Serial.println(saved_settings.password_data);
  Serial.print("Space ID: ");
  Serial.println(saved_settings.spaceId_data);
  SerialBT.println("✅ Configuración guardada. Reinicia para aplicar.");
}

void read_eeprom_settings() {
  EEPROM.get(0, saved_settings);

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
  if (strlen(saved_settings.ssid_data) > 0) {
    current_ssid_ptr = (char*)malloc(strlen(saved_settings.ssid_data) + 1);
    if (current_ssid_ptr) strcpy(current_ssid_ptr, saved_settings.ssid_data);
  }
  if (strlen(saved_settings.password_data) > 0) {
    current_password_ptr = (char*)malloc(strlen(saved_settings.password_data) + 1);
    if (current_password_ptr) strcpy(current_password_ptr, saved_settings.password_data);
  }
  if (strlen(saved_settings.spaceId_data) > 0) {
    current_space_id_ptr = (char*)malloc(strlen(saved_settings.spaceId_data) + 1);
    if (current_space_id_ptr) strcpy(current_space_id_ptr, saved_settings.spaceId_data);
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

void process_bluetooth_message(String message) {
  if (message != "") {
    Serial.println("BT Recibido: " + message);
    int symbolIndex = message.indexOf(':');
    if (symbolIndex != -1) {
      String myCommand = message.substring(0, symbolIndex);
      String myPayload = message.substring(symbolIndex + 1);

      if (myCommand == "wifi") {
        int commaIndex = myPayload.indexOf(',');
        if (commaIndex != -1) {
          String SSIDins = myPayload.substring(0, commaIndex);
          String PASSins = myPayload.substring(commaIndex + 1);
          write_settings(SSIDins, PASSins, current_space_id_ptr ? String(current_space_id_ptr) : default_space_id);
        } else {
          Serial.println("❌ Formato de comando 'wifi' incorrecto. Use 'wifi:SSID,PASSWORD'");
          SerialBT.println("❌ Formato de comando 'wifi' incorrecto. Use 'wifi:SSID,PASSWORD'");
        }
      } else if (myCommand == "spaceid") {
          // Comando para cambiar solo el space_id, preservando las credenciales WiFi
          write_settings(current_ssid_ptr ? String(current_ssid_ptr) : default_ssid, current_password_ptr ? String(current_password_ptr) : default_password, myPayload);
          Serial.println("✅ Space ID actualizado. Reinicia para aplicar.");
          SerialBT.println("✅ Space ID actualizado. Reinicia para aplicar.");
      } else if (myCommand == "read eeprom") {
        read_eeprom_settings();
      } else {
        Serial.println("⚠️ Comando BT desconocido.");
        SerialBT.println("⚠️ Comando BT desconocido.");
      }
    } else {
      Serial.println("❌ Mensaje BT no decodificado. Falta ':'");
      SerialBT.println("❌ Mensaje BT no decodificado. Falta ':'");
    }
  }
}

// ---------------- FUNCIONES WIFI Y RECONEXION ----------------
// Intenta iniciar la conexión WiFi una vez con las credenciales actuales
void conectarWiFi() {
    Serial.println("Iniciando intento de conexión a WiFi...");
    Serial.print("SSID: "); Serial.println(current_ssid_ptr ? current_ssid_ptr : "N/A (usando default)");
    Serial.print("Password: "); Serial.println(current_password_ptr ? current_password_ptr : "N/A (usando default)"); // Cuidado en prod

    WiFi.disconnect(); // Asegura un intento de conexión limpio
    delay(100);

    if (current_ssid_ptr && current_password_ptr && strlen(current_ssid_ptr) > 0 && strlen(current_password_ptr) > 0) {
        WiFi.begin(current_ssid_ptr, current_password_ptr);
    } else {
        WiFi.begin(default_ssid, default_password);
    }
}

//Publicar la configuracion del dispositivo
void publish_device_config() {
    DynamicJsonDocument doc(1024);
    
    // Ahora se usa la variable dinámica
    doc["device_id"] = "env_002";
    doc["name"] = "Sensor Ambiental - Oficina 2";
    doc["type"] = "environmental";
    doc["space_id"] = (current_space_id_ptr && strlen(current_space_id_ptr) > 0) ? current_space_id_ptr : default_space_id;
    doc["space_name"] = "Oficina 2";
    doc["mqtt_topic"] = "workbit/devices/env_002";

    JsonArray sensors = doc.createNestedArray("sensors");

    JsonObject s1 = sensors.createNestedObject();
    s1["name"] = "Sensor de Temperatura";
    s1["type"] = "temperature";
    s1["unit"] = "°C";
    s1["description"] = "Sensor de temperatura ambiente";

    JsonObject s2 = sensors.createNestedObject();
    s2["name"] = "Sensor de Humedad";
    s2["type"] = "humidity";
    s2["unit"] = "%";
    s2["description"] = "Sensor de humedad relativa";

    JsonObject s3 = sensors.createNestedObject();
    s3["name"] = "Sensor de CO2";
    s3["type"] = "co2";
    s3["unit"] = "ppm";
    s3["description"] = "Sensor de dióxido de carbono";

    JsonObject hw = doc.createNestedObject("hardware_info");
    hw["model"] = "ESP32-WROOM-32";
    hw["firmware_version"] = "1.2.0";
    hw["mac_address"] = WiFi.macAddress();
    hw["ip_address"] = WiFi.localIP().toString();

    doc["location"] = "Techo, esquina noreste";

    char buffer[1024];
    serializeJson(doc, buffer);

    client.publish("workbit/devices/add", buffer);
    Serial.println("✅ Configuracion del dispositivo publicada en workbit/devices/add");
}


// Intenta conectar a MQTT una vez
void conectarMQTT() {
    Serial.print("Conectando a MQTT...");
    // El client ID debe ser único, usamos device_id
    if (client.connect(device_id)) {
        Serial.println("Conectado a MQTT ✅");
        publish_device_config();
    } else {
        Serial.print("Fallo, rc=");
        Serial.print(client.state());
        Serial.println(" reintentando en 2s");
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

// Gestiona la reconexión a WiFi y MQTT (función legacy - mantenida para compatibilidad)
void reconnectIfDisconnected() {
  handleReconnection();
}

// ---------------- SETUP ----------------
void setup() {
    pinMode(RED_PIN, OUTPUT);
    pinMode(GREEN_PIN, OUTPUT);
    pinMode(BLUE_PIN, OUTPUT);
    setColor(0, 0, 0); // Apagar LED al inicio

    Serial.begin(115200);
    delay(2000); // Retardo para que el Monitor Serie se inicialice
    Serial.println("Serial inicializado. Preparando sistema...");

    Serial.println("====================================");
    Serial.println("   Sistema de Monitoreo Ambiental   ");
    Serial.println("====================================");

    Wire.begin(21, 22); // SDA, SCL. ¡Verifica que estos pines I2C sean correctos para tu ESP32!
    dht.begin();

    // Inicializar EEPROM con el tamaño de la nueva estructura de configuraciones
    EEPROM.begin(sizeof(StoredSettings));
    read_eeprom_settings(); // Leer las configuraciones guardadas al inicio

    client.setServer(mqtt_server, 1883);
    client.setBufferSize(1024);

    SerialBT.begin("ESP32_Monitor_Env"); // Inicializar Bluetooth
    Serial.println("Bluetooth iniciado: ESP32_Monitor_Env");

    if (!ccs.begin()) {
        Serial.println(">> ERROR: No se encontró el sensor CCS811. Verifique conexiones I2C.");
        while (1) {
            setColor(1,0,0); delay(200); setColor(0,0,0); delay(200); // Flashear rojo para indicar error
        }
    }

    // Esperar a que el sensor CCS811 esté disponible
    Serial.print("Esperando sensor CCS811 disponible...");
    while (!ccs.available()) {
        delay(100);
        Serial.print(".");
    }
    Serial.println("\n>> Sensores inicializados correctamente.");
    Serial.println("🟢 Sistema listo.");
}

// ================= LOOP PRINCIPAL ESTANDARIZADO =================
void loop() {
    // Asegurar conectividad WiFi y MQTT
    handleReconnection();
    client.loop(); // Procesar mensajes MQTT

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
            process_bluetooth_message(BTMessage);
            BTMessage = "";
            BTreecieved = 0;
        }
    }

    unsigned long now = millis();

    // ================= LECTURAS CADA 10 SEGUNDOS =================
    if (now - lastReading >= READING_INTERVAL) {
        lastReading = now;

        float temp = dht.readTemperature();
        float hum = dht.readHumidity();

        if (isnan(temp) || isnan(hum)) {
            Serial.println("❌ ERROR: Fallo al leer datos del DHT22.");
            setColor(1, 0, 0); // LED rojo para error
            return;
        }

        ccs.setEnvironmentalData(hum, temp);

        if (ccs.available() && !ccs.readData()) {
            uint16_t eco2 = ccs.geteCO2();
            uint16_t tvoc = ccs.getTVOC();

            // Agregar al buffer para promedio
            addToBuffer(temp, hum, (float)eco2);

            // Calcular calidad de sensores individuales
            String tempQuality = getQuality(temp, "temperature");
            String humQuality = getQuality(hum, "humidity");
            String co2Quality = getQuality((float)eco2, "co2");

            // Actualizar LED basado en calidad general (prioridad: CO2 > Temp > Hum)
            if (co2Quality == "critical" || tempQuality == "critical" || humQuality == "critical") {
                setColor(1, 0, 0); // Rojo crítico
            } else if (co2Quality == "warning" || tempQuality == "warning" || humQuality == "warning") {
                setColor(1, 1, 0); // Amarillo advertencia
            } else {
                setColor(0, 1, 0); // Verde normal
            }

            // Verificar y publicar alertas si es necesario
            checkAndPublishAlerts((float)eco2, temp, hum, 0);

            Serial.printf("📊 Lectura %s: T=%.1f°C(%s), H=%.0f%%(%s), CO2=%dppm(%s)\n",
                          (bufferFull ? "completa" : "parcial"),
                          temp, tempQuality.c_str(),
                          hum, humQuality.c_str(),
                          eco2, co2Quality.c_str());

        } else {
            Serial.println("❌ ERROR: No se pudo leer el CCS811.");
            setColor(1, 0, 0); // LED rojo para error
        }
    }

    // ================= PUBLICACIÓN CADA MINUTO (PROMEDIO) =================
    if (now - lastPublish >= PUBLISH_INTERVAL) {
        lastPublish = now;

        // Solo publicar si tenemos datos suficientes
        if (bufferIndex > 0 || bufferFull) {
            float avgTemp = calculateAverage(tempBuffer);
            float avgHum = calculateAverage(humBuffer);
            float avgCo2 = calculateAverage(co2Buffer);

            // Calcular calidad basada en promedios
            String tempQuality = getQuality(avgTemp, "temperature");
            String humQuality = getQuality(avgHum, "humidity");
            String co2Quality = getQuality(avgCo2, "co2");

            // === Crear JSON estandarizado según especificaciones ===
            DynamicJsonDocument doc(768);

            String spaceId = (current_space_id_ptr && strlen(current_space_id_ptr) > 0) ? String(current_space_id_ptr) : default_space_id;
            doc["space_id"] = spaceId;
            doc["device_id"] = device_id;
            doc["timestamp"] = now;

            // Sensor de CO2 con calidad
            JsonObject co2_sensor = doc.createNestedObject("co2_sensor");
            co2_sensor["sensor_id"] = co2_sensor_id;
            co2_sensor["sensor_type"] = "co2";
            co2_sensor["value"] = round(avgCo2);
            co2_sensor["unit"] = "ppm";
            co2_sensor["quality"] = co2Quality;

            // Sensor de Temperatura con calidad
            JsonObject temp_sensor = doc.createNestedObject("temperature_sensor");
            temp_sensor["sensor_id"] = temp_sensor_id;
            temp_sensor["sensor_type"] = "temperature";
            temp_sensor["value"] = round(avgTemp * 10) / 10.0; // 1 decimal
            temp_sensor["unit"] = "celsius";
            temp_sensor["quality"] = tempQuality;

            // Sensor de Humedad con calidad
            JsonObject hum_sensor = doc.createNestedObject("humidity_sensor");
            hum_sensor["sensor_id"] = hum_sensor_id;
            hum_sensor["sensor_type"] = "humidity";
            hum_sensor["value"] = round(avgHum);
            hum_sensor["unit"] = "percent";
            hum_sensor["quality"] = humQuality;

            // Estado del LED
            JsonObject led_status = doc.createNestedObject("led_status");
            led_status["color"] = (co2Quality == "critical" || tempQuality == "critical" || humQuality == "critical") ? "Rojo" :
                                  (co2Quality == "warning" || tempQuality == "warning" || humQuality == "warning") ? "Amarillo" : "Verde";
            led_status["red"] = digitalRead(RED_PIN);
            led_status["green"] = digitalRead(GREEN_PIN);
            led_status["blue"] = digitalRead(BLUE_PIN);

            // Información de hardware
            JsonObject hw_info = doc.createNestedObject("hardware_info");
            hw_info["samples_averaged"] = bufferFull ? BUFFER_SIZE : bufferIndex;
            hw_info["wifi_rssi"] = WiFi.RSSI();
            hw_info["free_heap"] = ESP.getFreeHeap();

            char jsonBuffer[768];
            serializeJson(doc, jsonBuffer);

            // Publicar a topic estandarizado
            if (client.connected()) {
                if (client.publish("workbit/sensors/environmental_data", jsonBuffer)) {
                    Serial.println("✅ Promedio publicado en workbit/sensors/environmental_data");
                    Serial.printf("📈 Promedios (%d muestras): T=%.1f°C, H=%.0f%%, CO2=%.0fppm\n", 
                                  bufferFull ? BUFFER_SIZE : bufferIndex, avgTemp, avgHum, avgCo2);
                } else {
                    Serial.printf("❌ Fallo al publicar promedio. Estado MQTT: %d\n", client.state());
                }
            } else {
                Serial.println("⚠️ MQTT desconectado. No se pudo publicar promedio.");
            }

            // Log detallado en consola
            Serial.println("========== PROMEDIO DE LECTURAS ==========");
            Serial.printf(" Space ID            : %s\n", spaceId.c_str());
            Serial.printf(" Muestras promediadas: %d\n", bufferFull ? BUFFER_SIZE : bufferIndex);
            Serial.printf(" Temperatura         : %.1f °C (%s)\n", avgTemp, tempQuality.c_str());
            Serial.printf(" Humedad Relativa    : %.0f %% (%s)\n", avgHum, humQuality.c_str());
            Serial.printf(" CO₂ Estimado        : %.0f ppm (%s)\n", avgCo2, co2Quality.c_str());
            Serial.printf(" WiFi RSSI           : %d dBm\n", WiFi.RSSI());
            Serial.printf(" Memoria Libre       : %d bytes\n", ESP.getFreeHeap());
            Serial.println("==========================================\n");

        } else {
            Serial.println("⚠️ No hay datos suficientes para publicar promedio");
        }
    }
}
