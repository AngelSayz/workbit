using System;
using System.Collections.Generic;
using workbit.MessagesTypes;


namespace workbit.ViewModels
{
    public class MessageResponse: JsonResponse
    {
        public string Message { get; set; }
        public string Type { get; set; }

        public static MessageResponse Respuesta(int status, string Message, MessageUsers Type)
        {
            MessageResponse response = new MessageResponse();
            response.StatusCode = status;
            response.Message = Message;
            response.Type = Type.ToString();

            return response;

        }

        public static MessageResponse Respuesta(int status, string Message, MessageReservation Type)
        {
            MessageResponse response = new MessageResponse();
            response.StatusCode = status;
            response.Message = Message;
            response.Type = Type.ToString();

            return response;
        }


    }
}
