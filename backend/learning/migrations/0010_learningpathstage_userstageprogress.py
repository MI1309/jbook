from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def create_default_stages(apps, schema_editor):
    LearningPathStage = apps.get_model("learning", "LearningPathStage")
    database = schema_editor.connection.alias
    stages = [
        ("hiragana", "Hiragana", 1, "available"),
        ("katakana", "Katakana", 2, "available"),
        ("n5", "JLPT N5", 3, "available"),
        ("n4", "JLPT N4", 4, "available"),
        ("n3", "JLPT N3", 5, "beta"),
        ("n2", "JLPT N2", 6, "beta"),
        ("n1", "JLPT N1", 7, "beta"),
    ]
    for code, title, display_order, availability in stages:
        LearningPathStage.objects.using(database).get_or_create(
            code=code,
            defaults={
                "title": title,
                "display_order": display_order,
                "availability": availability,
            },
        )


class Migration(migrations.Migration):

    dependencies = [
        ("learning", "0009_studylog_uservocabulary"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="LearningPathStage",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("code", models.SlugField(max_length=32, unique=True)),
                ("title", models.CharField(max_length=100)),
                ("description", models.TextField(blank=True)),
                ("display_order", models.PositiveSmallIntegerField(unique=True)),
                (
                    "availability",
                    models.CharField(
                        choices=[("available", "Available"), ("beta", "Beta")],
                        default="available",
                        max_length=10,
                    ),
                ),
            ],
            options={"ordering": ["display_order"]},
        ),
        migrations.CreateModel(
            name="UserStageProgress",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("completion_percent", models.PositiveSmallIntegerField(default=0)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "stage",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="user_progress",
                        to="learning.learningpathstage",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="learning_stage_progress",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ["stage__display_order"]},
        ),
        migrations.AddConstraint(
            model_name="userstageprogress",
            constraint=models.UniqueConstraint(
                fields=("user", "stage"), name="unique_user_stage_progress"
            ),
        ),
        migrations.AddConstraint(
            model_name="userstageprogress",
            constraint=models.CheckConstraint(
                condition=models.Q(("completion_percent__lte", 100)),
                name="user_stage_progress_percent_lte_100",
            ),
        ),
        migrations.RunPython(create_default_stages, migrations.RunPython.noop),
    ]