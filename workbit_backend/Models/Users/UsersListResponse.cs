using System;
using System.Collections.Generic;
using workbit.ViewModels;

namespace workbit.Models.Users
{
    public class UsersListResponse : JsonResponse
    {
        public List<Users> users { get; set; } = new();

        public static UsersListResponse Respuesta()
        {
            UsersListResponse respuesta = new UsersListResponse();
            respuesta.StatusCode = 0;
            respuesta.users = Users.Get();

            return respuesta;
        }
    }
}
