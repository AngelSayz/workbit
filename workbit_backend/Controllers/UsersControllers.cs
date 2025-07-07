using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using workbit.Models.Users;
using workbit.Models.Users.DTO;
using workbit.Models.Roles;
using workbit.ViewModels;
using workbit.MessagesTypes;
using workbit.Models.Roles;

namespace workbit.Controllers
{
    [ApiController]
    [Route("api/[controller]")] // => "api/users"
    public class UsersController : ControllerBase
    {
        [HttpGet]
        [Route("")]
        public ActionResult Get()
        {
            try
            {
                List<Users> users = Users.Get();
                return Ok(UsersListResponse.Respuesta());
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al obtener usuarios: {ex.Message}");
            }
        }

        [HttpGet]
        [Route("{id}")]
        public ActionResult Get(int id)
        {
            try
            {
                Users user = Users.Get(id);
                if (user == null)
                {
                    return StatusCode(404, MessageResponse.Respuesta(1, "User not found", MessageUsers.Error));
                }
                return Ok(UsersResponse.Respuesta(user));
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al buscar usuario con id {id}: {ex.Message}");
            }
        }

        [HttpPost]
        [Route("register")]
        public ActionResult PostUser([FromForm] UserRegisterDto dto)
        {
            try
            {
                if (dto == null)
                {
                    return BadRequest(MessageResponse.Respuesta(1, "User data cannot be null", MessageUsers.Error));
                }

                int roleId = Roles.ObtenerRoleIdPorNombre(dto.RoleName);
                // obtiene el id real del rol

                Users newUser = new Users
                {
                    Name = dto.Name,
                    Lastname = dto.Lastname,
                    Username = dto.Username,
                    Email = dto.Email,
                    Password = dto.Password,
                    RoleId = roleId
                };

                newUser.saveUser();

                return Ok(MessageResponse.Respuesta(0, "User registered successfully", MessageUsers.Success));
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al registrar usuario: {ex.Message}");
            }
        }

        [HttpPost]
        [Route("update")]
        public ActionResult UpdateUser([FromForm] Users updateUser)
        {
            try
            {
                if (updateUser == null)
                    return BadRequest(MessageResponse.Respuesta(1, "User cannot be null", MessageUsers.Error));

                updateUser.updateUser();

                return Ok(MessageResponse.Respuesta(0, "User updated successfully", MessageUsers.Success));
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al actualizar usuario: {ex.Message}");
            }
        }
    }
}
