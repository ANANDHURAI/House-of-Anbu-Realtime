from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Call(models.Model):
    CALL_STATUS = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('ended', 'Ended'),
    ]

    caller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='calls_made')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='calls_received')
    status = models.CharField(max_length=10, choices=CALL_STATUS, default='pending')
    room_name = models.CharField(max_length=100, unique=True)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(blank=True, null=True)
    duration = models.IntegerField(default=0, help_text="Call duration in seconds")
    is_missed = models.BooleanField(default=False)

    chat = models.ForeignKey(
        'chat.Chat',
        on_delete=models.CASCADE,
        related_name='calls',
        null=True,
        blank=True
    )

    def __str__(self):
        return f"{self.caller.name} → {self.receiver.name} ({self.status})"
