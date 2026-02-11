from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class JLPTLevel(models.IntegerChoices):
        N5 = 5, 'N5'
        N4 = 4, 'N4'
        N3 = 3, 'N3'
        N2 = 2, 'N2'
        N1 = 1, 'N1'

    level_target = models.IntegerField(choices=JLPTLevel.choices, default=JLPTLevel.N5)
