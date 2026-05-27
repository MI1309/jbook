from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("learning", "0006_alter_quizattempt_timestamp"),
    ]

    operations = [
        migrations.AddField(
            model_name="quizattempt",
            name="mode",
            field=models.CharField(default="choice", max_length=20),
        ),
    ]

