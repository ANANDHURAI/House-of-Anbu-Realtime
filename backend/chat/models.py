from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Chat(models.Model):
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chats_as_user1')
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chats_as_user2')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user1', 'user2')

    def __str__(self):
        return f"Chat between {self.user1.name} and {self.user2.name}"


class Message(models.Model):
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='chat_images/', blank=True, null=True)
    file = models.FileField(upload_to='chat_files/', blank=True, null=True)
    is_read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    message_type = models.CharField(
        max_length=20,
        default='text',
        choices=[
            ('text', 'Text'),
            ('call', 'Call'),
            ('call_missed', 'Missed Call'),
        ]
    )

    call = models.ForeignKey(
        'videocall.Call',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='messages'
    )

    def __str__(self):
        return f"{self.sender.name}: {self.content[:30] if self.content else 'Media message'}"
