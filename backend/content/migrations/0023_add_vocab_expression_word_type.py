from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0020_featuresetting"),
    ]

    operations = [
        migrations.AlterField(
            model_name="kanji",
            name="word_type",
            field=models.CharField(
                blank=True,
                choices=[
                    ("noun", "Noun (Kata Benda)"),
                    ("godan", "Godan Verb (Kata Kerja Golongan 1)"),
                    ("ichidan", "Ichidan Verb (Kata Kerja Golongan 2)"),
                    ("suru", "Suru Verb (Kata Kerja Golongan 3)"),
                    ("intransitive", "Intransitive Verb (Kata Kerja Intransitif)"),
                    ("transitive", "Transitive Verb (Kata Kerja Transitif)"),
                    ("i_adj", "I-Adjective (Kata Sifat I)"),
                    ("na_adj", "Na-Adjective (Kata Sifat Na)"),
                    ("adverb", "Adverb (Kata Keterangan)"),
                    ("particle", "Particle (Partikel)"),
                    ("suffix", "Suffix (Akhiran)"),
                    ("conjunction", "Conjunction (Kata Sambung)"),
                    ("expression", "Expression (Ungkapan)"),
                    ("interjection", "Interjection (Kata Seru)"),
                    ("pronoun", "Pronoun (Kata Ganti)"),
                    ("counter", "Counter (Kata Bantu Bilangan)"),
                    ("other", "Lain-lain"),
                ],
                help_text="Tipe kata utama jika ada",
                max_length=20,
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="vocab",
            name="word_type",
            field=models.CharField(
                blank=True,
                choices=[
                    ("noun", "Noun (Kata Benda)"),
                    ("godan", "Godan Verb (Kata Kerja Golongan 1)"),
                    ("ichidan", "Ichidan Verb (Kata Kerja Golongan 2)"),
                    ("suru", "Suru Verb (Kata Kerja Golongan 3)"),
                    ("intransitive", "Intransitive Verb (Kata Kerja Intransitif)"),
                    ("transitive", "Transitive Verb (Kata Kerja Transitif)"),
                    ("i_adj", "I-Adjective (Kata Sifat I)"),
                    ("na_adj", "Na-Adjective (Kata Sifat Na)"),
                    ("adverb", "Adverb (Kata Keterangan)"),
                    ("particle", "Particle (Partikel)"),
                    ("suffix", "Suffix (Akhiran)"),
                    ("conjunction", "Conjunction (Kata Sambung)"),
                    ("expression", "Expression (Ungkapan)"),
                    ("interjection", "Interjection (Kata Seru)"),
                    ("pronoun", "Pronoun (Kata Ganti)"),
                    ("counter", "Counter (Kata Bantu Bilangan)"),
                    ("other", "Lain-lain"),
                ],
                help_text="Tipe kata (e.g. Noun, Godan Verb)",
                max_length=20,
                null=True,
            ),
        ),
    ]