from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Call
import uuid

class StartCallView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        receiver_id = request.data.get("receiver_id")
        room_name = str(uuid.uuid4())[:8]
        Call.objects.create(caller=request.user, receiver_id=receiver_id, room_name=room_name)
        return Response({"room_name": room_name})
