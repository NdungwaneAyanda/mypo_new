using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace MyPO.API.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    public async Task JoinFunderRoom()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "funders");
    }
}
