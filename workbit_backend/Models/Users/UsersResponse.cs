using workbit.ViewModels;

namespace workbit.Models.Users
{
    public class UsersResponse : JsonResponse
    {
        public Users Usuaruio {get; set;}

        public static UsersResponse Respuesta(Users user) 
        {
            UsersResponse response = new UsersResponse();
            response.StatusCode = 0;
            response.Usuaruio = user;
            return response;
        }
    }
}
