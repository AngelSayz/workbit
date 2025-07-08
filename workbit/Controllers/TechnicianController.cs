using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace workbit.Controllers
{
    [Authorize(Roles = "technician")]
    public class TechnicianController : Controller
    {
        public IActionResult Dashboard()
        {
            return View();
        }
    }

}
