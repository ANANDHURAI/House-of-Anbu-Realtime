from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager


class UserManager(BaseUserManager):
    def create_user(self, email, name, phone, password=None , ** extra_fileds):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, name=name, phone=phone, **extra_fileds)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self , email, name, phone , password = None , **extra_fields):
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, name, phone, password, **extra_fields)
    

class UserAccount(AbstractBaseUser):
    name = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15)
    about_me = models.TextField(blank=True, null=True)
    profile_image = models.ImageField(upload_to='profileImage/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name', 'phone']

    def __str__(self):
        return f"{self.email} for {self.name}"


