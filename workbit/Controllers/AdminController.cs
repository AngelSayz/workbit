using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace workbit.Controllers
{
    [Authorize(Roles = "admin")]
    public class AdminController : Controller
    {
        public IActionResult Dashboard()
        {
            return View();
        }
    }

}
