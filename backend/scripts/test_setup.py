import os
import sys

print("Start")
import django
print("Django imported")
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
print("Settings set")
django.setup()
print("Django setup done")

from content.models import Grammar
print("Grammar imported")

count = Grammar.objects.count()
print(f"Count: {count}")
sys.exit(0)
