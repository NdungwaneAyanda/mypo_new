using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MyPO.API.Data;
using MyPO.API.Hubs;
using MyPO.API.Services;
using Serilog;
using Serilog.Events;

// Bootstrap logger for startup errors
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
Log.Information("Starting MyPO API...");

var builder = WebApplication.CreateBuilder(args);

// Replace default logging with Serilog
builder.Host.UseSerilog((ctx, services, cfg) => cfg
    .ReadFrom.Configuration(ctx.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Application", "MyPO.API")
    .WriteTo.Console(outputTemplate:
        "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .WriteTo.File(
        path: "logs/mypo-.log",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 30,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                builder.Configuration["Jwt:Key"]!)),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                    context.Token = accessToken;
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
            builder.Configuration["FrontendUrl"] ?? "https://mypo.co.za",
            "https://mypo.co.za",
            "https://www.mypo.co.za",
            "http://localhost:4200",
            "https://localhost:4200"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

// Persist Data Protection keys to disk when a directory is configured
// (e.g. on Linux where the service account has no user profile).
var dataProtectionKeysDir = builder.Configuration["DataProtection:KeysDirectory"];
if (!string.IsNullOrWhiteSpace(dataProtectionKeysDir))
{
    Directory.CreateDirectory(dataProtectionKeysDir);
    builder.Services.AddDataProtection()
        .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionKeysDir))
        .SetApplicationName("MyPO.API");
}

builder.Services.AddSignalR();

builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<RefCodeService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddHttpClient();

builder.Services.AddControllers();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    // Ensure admin account always matches appsettings credentials
    var adminEmail    = (builder.Configuration["Admin:Email"]    ?? "admin@mypo.co.za").ToLower();
    var adminPassword =  builder.Configuration["Admin:Password"] ?? "Admin@MyPO2026!";

    var existingAdmin = db.Users
        .Include(u => u.Roles)
        .FirstOrDefault(u => u.Roles.Any(r => r.Role == "admin"));

    if (existingAdmin == null)
    {
        // Create fresh admin account
        var adminUser = new MyPO.API.Models.Entities.User
        {
            Email          = adminEmail,
            PasswordHash   = BCrypt.Net.BCrypt.HashPassword(adminPassword),
            EmailConfirmed = true
        };
        db.Users.Add(adminUser);
        db.UserRoles.Add(new MyPO.API.Models.Entities.UserRole { UserId = adminUser.Id, Role = "admin" });
        db.SaveChanges();
        Log.Information("Admin user seeded: {Email}", adminEmail);
    }
    else
    {
        // Always sync email + password hash so appsettings.json is the source of truth
        existingAdmin.Email        = adminEmail;
        existingAdmin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword);
        db.SaveChanges();
        Log.Information("Admin credentials synced: {Email}", adminEmail);
    }
}

app.UseStaticFiles();
app.UseSerilogRequestLogging(opts =>
{
    opts.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
    opts.GetLevel = (ctx, elapsed, ex) =>
        ex != null || ctx.Response.StatusCode >= 500 ? LogEventLevel.Error :
        ctx.Response.StatusCode >= 400               ? LogEventLevel.Warning :
                                                       LogEventLevel.Information;
});
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");
app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();

}
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Fatal(ex, "MyPO API terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
