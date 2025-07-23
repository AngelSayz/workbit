using Microsoft.AspNetCore.Authentication.Cookies;
using workbit.Config; // Add this import

var builder = WebApplication.CreateBuilder(args);

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowEverything",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure logging for Azure
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

var app = builder.Build();

// Better startup logging
var logger = app.Services.GetRequiredService<ILogger<Program>>();
logger.LogInformation("WorkBit API starting up...");
logger.LogInformation("Environment: {Environment}", app.Environment.EnvironmentName);

// FORCE configuration initialization during startup
try 
{
    logger.LogInformation("Initializing configuration...");
    var config = AppConfigManager.Configuration; // This triggers the static constructor
    logger.LogInformation("Configuration initialized successfully");
    logger.LogInformation("Database Server: {Server}", config?.ConnectionStrings?.SqlServer?.Server ?? "NOT SET");
    logger.LogInformation("Database Name: {Database}", config?.ConnectionStrings?.SqlServer?.Database ?? "NOT SET");
}
catch (Exception ex)
{
    logger.LogError(ex, "Failed to initialize configuration: {Message}", ex.Message);
    throw; // This will cause startup to fail, which is better than silent failure
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// REMOVE HTTPS redirection - it's causing warnings and Azure handles HTTPS at the load balancer level
// if (app.Environment.IsProduction())
// {
//     app.UseHttpsRedirection();
// }

// Add basic health check
app.MapGet("/health", () => Results.Ok(new { 
    status = "healthy", 
    timestamp = DateTime.UtcNow,
    database_configured = AppConfigManager.Configuration?.ConnectionStrings?.SqlServer?.Server != null
}));

// CORS middleware
app.UseCors("AllowEverything");

app.UseAuthorization();
app.MapControllers();

logger.LogInformation("WorkBit API startup complete. Ready to accept requests.");

app.Run();
