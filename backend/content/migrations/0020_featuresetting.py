from django.db import migrations, models


def create_default_setting(apps, schema_editor):
    FeatureSetting = apps.get_model('content', 'FeatureSetting')
    FeatureSetting.objects.get_or_create(
        key='kanji_visibility',
        defaults={'value': {'disabled_levels': [1, 2, 3]}},
    )


class Migration(migrations.Migration):
    dependencies = [
        ('content', '0022_mediaattachment_blog_excerpt_blog_featured_image'),
    ]

    operations = [
        migrations.CreateModel(
            name='FeatureSetting',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('key', models.CharField(max_length=100, unique=True)),
                ('value', models.JSONField(default=dict)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.RunPython(create_default_setting, migrations.RunPython.noop),
    ]