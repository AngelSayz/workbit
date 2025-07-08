using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using workbit.Models.Users;
using workbit.ViewModels;

namespace workbit.Controllers
{
    public class AccountController : Controller
    {
        [HttpGet("login")]
        public IActionResult Login() => View();

        [HttpPost]
        public IActionResult Login(LoginViewModel model)
        {
            if (!ModelState.IsValid)
                return View(model);

            // Buscar el usuario
            var users = Users.Get();
            var user = users.FirstOrDefault(u => u.Username == model.Username && u.Password == model.Password);

            if (user == null)
            {
                ModelState.AddModelError("", "Usuario o contraseña incorrectos");
                return View(model);
            }

            switch (user.Roles?.Name)
            {
                case "admin":
                    return RedirectToAction("Dashboard", "Admin");
                case "user":
                    return RedirectToAction("Dashboard", "User");
                case "technician":
                    return RedirectToAction("Dashboard", "Technician");
                default:
                    return RedirectToAction("Index", "Home");
            }
        }

        [HttpPost("login")]
        public IActionResult ApiLogin([FromForm] LoginViewModel model)
        {
            if (string.IsNullOrWhiteSpace(model.Username) || string.IsNullOrWhiteSpace(model.Password))
            {
                return BadRequest(new { message = "Usuario y contraseña requeridos" });
            }

            var users = Users.Get();
            var user = users.FirstOrDefault(u => u.Username == model.Username && u.Password == model.Password);

            if (user == null)
            {
                return Unauthorized(new { message = "Credenciales inválidas" });
            }

            return Ok(new
            {
                message = "Login exitoso",
                username = user.Username,
                fullname = user.Name + " " + user.Lastname,
                role = user.Roles?.Name,
                userId = user.Id
            });

        }
    }
}
