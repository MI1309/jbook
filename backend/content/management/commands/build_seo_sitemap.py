import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from xml.etree.ElementTree import Element, SubElement, tostring

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from content.models import FeatureSetting, Grammar, Kanji, Vocab

SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9"


def disabled_levels(key, default=()):
    setting = FeatureSetting.objects.filter(key=key).only("value").first()
    if not setting or not isinstance(setting.value, dict):
        return set(default)
    return {
        level
        for level in setting.value.get("disabled_levels", [])
        if level in range(1, 6)
    }


class Command(BaseCommand):
    help = "Generate an XML sitemap snapshot for public JBook content"

    def handle(self, *args, **options):
        output = os.environ.get("SEO_SITEMAP_OUTPUT")
        if not output:
            raise CommandError(
                "Set SEO_SITEMAP_OUTPUT to the public sitemap.xml output path"
            )

        base = settings.FRONTEND_URL.rstrip("/")
        entries = [(f"{base}/", None)]
        entries.extend(
            (f"{base}/kanji/{obj.pk}", None)
            for obj in Kanji.objects.exclude(
                jlpt_level__in=disabled_levels("kanji_visibility", default=(1, 2, 3))
            ).only("id", "jlpt_level")
        )
        entries.extend(
            (f"{base}/bunpo/{obj.pk}", None)
            for obj in Grammar.objects.exclude(
                jlpt_level__in=disabled_levels("bunpo_visibility")
            ).only("id", "jlpt_level")
        )
        entries.extend(
            (f"{base}/kotoba/{obj.pk}", None)
            for obj in Vocab.objects.exclude(
                jlpt_level__in=disabled_levels("vocab_visibility")
            ).only("id", "jlpt_level")
        )

        if len(entries) > 50_000:
            raise CommandError(
                "More than 50,000 URLs; split into files and publish a sitemap index"
            )

        root = Element(f"{{{SITEMAP_NS}}}urlset")
        lastmod = datetime.now(timezone.utc).date().isoformat()
        for url, _ in entries:
            item = SubElement(root, f"{{{SITEMAP_NS}}}url")
            SubElement(item, f"{{{SITEMAP_NS}}}loc").text = url
            SubElement(item, f"{{{SITEMAP_NS}}}lastmod").text = lastmod

        destination = Path(output)
        destination.parent.mkdir(parents=True, exist_ok=True)
        descriptor, temporary = tempfile.mkstemp(
            dir=destination.parent,
            prefix=".sitemap-",
        )
        try:
            with os.fdopen(descriptor, "wb") as stream:
                stream.write(b'<?xml version="1.0" encoding="UTF-8"?>\n')
                stream.write(tostring(root, encoding="utf-8"))
            os.replace(temporary, destination)
        finally:
            if os.path.exists(temporary):
                os.unlink(temporary)

        self.stdout.write(
            self.style.SUCCESS(f"Wrote {len(entries)} URLs to {destination}")
        )
