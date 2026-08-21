using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MyPO.API.Data;
using MyPO.API.Models;
using MyPO.API.Models.Entities;
using System.Security.Claims;

namespace MyPO.API.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly AppDbContext _db;

    public ChatHub(AppDbContext db)
    {
        _db = db;
    }

    public async Task JoinApplicationRoom(string applicationId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"app-{applicationId}");
    }

    public async Task LeaveApplicationRoom(string applicationId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"app-{applicationId}");
    }

    public async Task SendMessage(string applicationId, string messageText)
    {
        var userId = Guid.Parse(Context.User!.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var appId = Guid.Parse(applicationId);

        var application = await _db.FundingApplications
            .Include(a => a.AssignedFunder)
            .FirstOrDefaultAsync(a => a.Id == appId);

        if (application == null || !ApplicationStatus.IsFunded(application.Status))
            return;

        Guid receiverId;
        if (application.UserId == userId)
        {
            var funder = await _db.RegisteredFunders.FirstOrDefaultAsync(f => f.Id == application.AssignedFunderId);
            if (funder == null) return;
            receiverId = funder.UserId;
        }
        else
        {
            receiverId = application.UserId;
        }

        var message = new ApplicationMessage
        {
            ApplicationId = appId,
            SenderId = userId,
            ReceiverId = receiverId,
            MessageText = messageText,
            CreatedAt = DateTime.UtcNow
        };

        _db.ApplicationMessages.Add(message);
        await _db.SaveChangesAsync();

        var senderUser = await _db.Users.FindAsync(userId);

        await Clients.Group($"app-{applicationId}").SendAsync("ReceiveMessage", new
        {
            id = message.Id,
            applicationId = message.ApplicationId,
            senderId = message.SenderId,
            senderEmail = senderUser?.Email,
            receiverId = message.ReceiverId,
            messageText = message.MessageText,
            isRead = message.IsRead,
            createdAt = message.CreatedAt
        });
    }
}
