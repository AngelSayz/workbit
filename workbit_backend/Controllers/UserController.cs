using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace workbit.Controllers
{
    [Authorize(Roles = "user")]
    public class UserController : Controller
    {
        public IActionResult Dashboard()
        {
            return View();
        }
    }

}
