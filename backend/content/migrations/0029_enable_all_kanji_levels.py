from django.db import migrations


def enable_all_default_kanji_levels(apps, schema_editor):
    FeatureSetting = apps.get_model('content', 'FeatureSetting')
    setting = FeatureSetting.objects.filter(key='kanji_visibility').first()
    if not setting or not isinstance(setting.value, dict):
        return

    if setting.value.get('disabled_levels') == [1, 2, 3]:
        setting.value = {'disabled_levels': []}
        setting.save(update_fields=['value', 'updated_at'])


def restore_default_hidden_kanji_levels(apps, schema_editor):
    FeatureSetting = apps.get_model('content', 'FeatureSetting')
    setting = FeatureSetting.objects.filter(key='kanji_visibility').first()
    if setting and isinstance(setting.value, dict) and setting.value.get('disabled_levels') == []:
        setting.value = {'disabled_levels': [1, 2, 3]}
        setting.save(update_fields=['value', 'updated_at'])


class Migration(migrations.Migration):
    dependencies = [
        ('content', '0028_alter_grammar_sections'),
    ]

    operations = [
        migrations.RunPython(enable_all_default_kanji_levels, restore_default_hidden_kanji_levels),
    ]