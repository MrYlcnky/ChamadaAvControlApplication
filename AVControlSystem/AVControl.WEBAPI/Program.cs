using AVControl.Core.Interfaces;
using AVControl.Data.Context;
using AVControl.Data.Repositories;
using AVControl.Data.UnitOfWorks;
using AVControl.Service.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// 1. Veritabanı (MySQL) Bağlantısının Ayarlanması
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString));
});

// 2. AutoMapper Kurulumu
builder.Services.AddAutoMapper(config =>
{
    config.AddProfile<AVControl.Service.Mapping.MapProfile>();
});

// 3. Dependency Injection
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped(typeof(IService<>), typeof(GenericService<>));

builder.Services.AddScoped<IKullaniciService, KullaniciService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IDeviceCommandService, DeviceCommandService>();
builder.Services.AddScoped<IAVOrchestrationService, AVOrchestrationService>();
builder.Services.AddScoped<IMatrixDeviceService, MatrixDeviceService>();
builder.Services.AddScoped<IIrTransmitterService, IrTransmitterService>();
builder.Services.AddScoped<ILedProcessorService, LedProcessorService>();
builder.Services.AddScoped<IInputSourceService, InputSourceService>();
builder.Services.AddScoped<IOutputZoneService, OutputZoneService>();
builder.Services.AddScoped<IRemoteControlService, RemoteControlService>();
builder.Services.AddScoped<IRemoteButtonService, RemoteButtonService>();
builder.Services.AddScoped<IChannelListService, ChannelListService>();
builder.Services.AddScoped<IFavoriTakimService, FavoriTakimService>();
builder.Services.AddScoped<IFavoriLigService, FavoriLigService>();

builder.Services.AddScoped<IMacTakvimService, MacTakvimService>();
builder.Services.AddSingleton<NovastarService>();


// 4. JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["Secret"];

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,

        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(secretKey!)
        )
    };
});

// 5. CORS Ayarları
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins!)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 6. Controller ve Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "AVControl.WEBAPI",
        Version = "v1"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Token'ınızı şu formatta giriniz: Bearer {token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection();

app.UseRouting();

// CORS mutlaka Authentication/Authorization'dan önce olmalı
app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.UseStaticFiles();

app.MapControllers();

app.Run();