using Microsoft.AspNetCore.Mvc;
using MyPO.API.Models.DTOs;
using MyPO.API.Services;

namespace MyPO.API.Controllers;

[ApiController]
[Route("api/contact")]
public class ContactController : ControllerBase
{
    private readonly IEmailService _emailService;

    public ContactController(IEmailService emailService) => _emailService = emailService;

    [HttpPost]
    public async Task<IActionResult> SendContact(ContactDto dto)
    {
        await _emailService.SendContactEmailAsync(dto.Name, dto.Email, dto.Subject, dto.Message);
        return Ok(new { message = "Message sent successfully." });
    }
}
