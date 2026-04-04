from .models import Message

def create_message(chat, sender, content=None, file=None, image=None):
    return Message.objects.create(
        chat=chat,
        sender=sender,
        content=content or "",
        file=file,
        image=image,
        status=Message.STATUS_SENT
    )

def mark_delivered(chat, user):
    Message.objects.filter(
        chat=chat,
        status=Message.STATUS_SENT
    ).exclude(sender=user).update(status=Message.STATUS_DELIVERED)

def mark_read(chat, user):
    Message.objects.filter(
        chat=chat,
        status=Message.STATUS_DELIVERED
    ).exclude(sender=user).update(status=Message.STATUS_READ)
