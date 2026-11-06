from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("learning", "0010_learningpathstage_userstageprogress"),
    ]

    operations = [
        migrations.AlterField(
            model_name="uservocabulary",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True, db_index=True),
        ),
    ]