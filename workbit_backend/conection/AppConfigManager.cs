using System;
using Microsoft.Extensions.Configuration;

namespace workbit.Config
{
    public static class AppConfigManager
    {
        public static AppConfig Configuration { get; private set; }

        static AppConfigManager()
        {
            try
            {
                // Create configuration builder with proper Azure environment variable support
                var builder = new ConfigurationBuilder()
                    .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                    .AddJsonFile("conection/connection.json", optional: true, reloadOnChange: true)
                    .AddEnvironmentVariables(); // This reads Azure's connection strings

                var configuration = builder.Build();

                var appConfig = new AppConfig();

                // Try to get Azure's connection string first (highest priority)
                var azureConnectionString = configuration.GetConnectionString("DefaultConnection");
                
                if (!string.IsNullOrEmpty(azureConnectionString))
                {
                    // Parse Azure connection string format
                    var parsedConnection = ParseAzureConnectionString(azureConnectionString);
                    appConfig.ConnectionStrings = new ConnectionStringsConfig
                    {
                        SqlServer = parsedConnection
                    };
                    Console.WriteLine("✅ Using Azure connection string (environment variable)");
                    Console.WriteLine($"✅ Server: {parsedConnection.Server}");
                    Console.WriteLine($"✅ Database: {parsedConnection.Database}");
                }
                else if (configuration.GetSection("ConnectionStrings:SqlServer").Exists())
                {
                    // Use custom configuration file format
                    configuration.Bind(appConfig);
                    Console.WriteLine("✅ Using custom configuration (connection.json)");
                }
                else
                {
                    // Use standard appsettings.json format
                    appConfig.ConnectionStrings = new ConnectionStringsConfig
                    {
                        SqlServer = new SqlServerConfig
                        {
                            Server = configuration["SqlServer:Server"] ?? "",
                            Database = configuration["SqlServer:Database"] ?? "",
                            UserId = configuration["SqlServer:UserId"] ?? "",
                            Password = configuration["SqlServer:Password"] ?? ""
                        }
                    };
                    Console.WriteLine("✅ Using appsettings.json configuration");
                }

                // Set paths configuration
                appConfig.Paths = new PathsConfig
                {
                    Domain = configuration["Paths:Domain"] ?? "https://workbit-api.azurewebsites.net/"
                };

                Configuration = appConfig;
                
                Console.WriteLine($"✅ Final configuration - Server: {Configuration.ConnectionStrings?.SqlServer?.Server}");
                Console.WriteLine($"✅ Final configuration - Database: {Configuration.ConnectionStrings?.SqlServer?.Database}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error loading configuration: {ex.Message}");
                Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
                
                // Safe fallback configuration
                Configuration = new AppConfig
                {
                    ConnectionStrings = new ConnectionStringsConfig
                    {
                        SqlServer = new SqlServerConfig
                        {
                            Server = "workbit-api-server.database.windows.net",
                            Database = "workbit-api-database",
                            UserId = "workbit-api-server-admin",
                            Password = "Cafcats2025"
                        }
                    },
                    Paths = new PathsConfig
                    {
                        Domain = "https://workbit-api.azurewebsites.net/"
                    }
                };
                Console.WriteLine("⚠️ Using fallback configuration");
            }
        }

        private static SqlServerConfig ParseAzureConnectionString(string connectionString)
        {
            // Parse Azure SQL connection string format:
            // "Server=tcp:server.database.windows.net,1433;Initial Catalog=database;User ID=user;Password=password;Encrypt=True;TrustServerCertificate=False;"
            
            var config = new SqlServerConfig();
            var parts = connectionString.Split(';');

            foreach (var part in parts)
            {
                if (string.IsNullOrWhiteSpace(part)) continue;

                var keyValue = part.Split('=', 2);
                if (keyValue.Length != 2) continue;

                var key = keyValue[0].Trim().ToLower();
                var value = keyValue[1].Trim();

                switch (key)
                {
                    case "server":
                        // Remove "tcp:" prefix and ",1433" suffix if present
                        config.Server = value.Replace("tcp:", "").Split(',')[0];
                        break;
                    case "initial catalog":
                    case "database":
                        config.Database = value;
                        break;
                    case "user id":
                    case "uid":
                        config.UserId = value;
                        break;
                    case "password":
                    case "pwd":
                        config.Password = value;
                        break;
                }
            }

            return config;
        }
    }

    public class AppConfig
    {
        public ConnectionStringsConfig ConnectionStrings { get; set; }
        public PathsConfig Paths { get; set; }
    }

    public class ConnectionStringsConfig
    {
        public SqlServerConfig SqlServer { get; set; }
    }

    public class SqlServerConfig
    {
        public string Server { get; set; }
        public string Database { get; set; }
        public string UserId { get; set; }
        public string Password { get; set; }
    }

    public class PathsConfig
    {
        public string Domain { get; set; }
    }
}
