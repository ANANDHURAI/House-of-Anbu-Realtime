from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q

from accounts.models import UserAccount


class SearchingView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):
        query = request.data.get('query', '').strip()

        users = UserAccount.objects.filter(
            Q(name__icontains=query) |
            Q(email__icontains=query) |
            Q(phone__icontains=query)
        ).exclude(id=request.user.id)

        results = [
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "phone": user.phone,
                "about_me": user.about_me,
                "profile_image": request.build_absolute_uri(user.profile_image.url) if user.profile_image else None,
            }
            for user in users
        ]

        return Response({"results": results}, status=status.HTTP_200_OK)



    
