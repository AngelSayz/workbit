using System;
using Microsoft.Extensions.Configuration;

namespace workbit.Config
{
    public static class AppConfigManager
    {
        public static AppConfig Configuration { get; private set; }

        static AppConfigManager()
        {
            var builder = new ConfigurationBuilder()
                .AddJsonFile("conection/connection.json", optional: false, reloadOnChange: true);
            var configuration = builder.Build();

            // Usa el método Bind en vez de Get<T> si sigue el error
            var appConfig = new AppConfig();
            configuration.Bind(appConfig);
            Configuration = appConfig;
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
    }

    public class PathsConfig
    {
        public string Domain { get; set; }
    }
}
