import csv
from django.contrib import admin
from django.db.models import Count
from django.http import HttpResponse
from django.urls import path, reverse
from .models import Kanji, Vocab, Grammar, Blog, Particle, Announcement, MinnaQuestion, DoukaiPassage, DoukaiQuestion

@admin.action(description="Export selected items as CSV")
def export_as_csv(modeladmin, request, queryset):
    """
    Generic admin action to export selected objects to CSV.
    """
    opts = modeladmin.model._meta
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename={opts.verbose_name_plural}.csv'

    writer = csv.writer(response)
    
    # Get all field names of the model, excluding 'id'
    field_names = [field.name for field in opts.fields if field.name != 'id']
    writer.writerow(field_names)

    # Write data rows
    for obj in queryset:
        row = [getattr(obj, field) for field in field_names]
        writer.writerow(row)

    return response

class DoukaiQuestionInline(admin.TabularInline):
    model = DoukaiQuestion
    extra = 3

@admin.register(DoukaiPassage)
class DoukaiPassageAdmin(admin.ModelAdmin):
    list_display = ('title', 'book', 'chapter', 'jlpt_level', 'question_count')
    list_filter = ('book', 'chapter', 'jlpt_level')
    search_fields = ('title', 'text_jp', 'text_id')
    inlines = [DoukaiQuestionInline]
    actions = [export_as_csv]

@admin.register(DoukaiQuestion)
class DoukaiQuestionAdmin(admin.ModelAdmin):
    list_display = ('question_text', 'passage', 'is_correct', 'order')
    list_filter = ('is_correct', 'passage__book', 'passage__chapter')
    search_fields = ('question_text', 'explanation')
    raw_id_fields = ('passage',)


@admin.register(Kanji)
class KanjiAdmin(admin.ModelAdmin):
    list_display = ('character', 'meaning', 'jlpt_level', 'strokes')
    list_filter = ('jlpt_level',)
    search_fields = ('character', 'meaning')
    ordering = ('jlpt_level', 'character')
    actions = [export_as_csv, 'delete_duplicate_kanji']

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('duplicates/', self.admin_site.admin_view(self.duplicate_kanji_view), name='content_kanji_duplicates'),
        ]
        return custom_urls + urls

    def delete_duplicate_kanji(self, request, queryset):
        duplicates = {}
        deleted_ids = []
        for obj in queryset.order_by('character', 'id'):
            if obj.character in duplicates:
                deleted_ids.append(obj.id)
            else:
                duplicates[obj.character] = obj.id
        if deleted_ids:
            count = queryset.model.objects.filter(id__in=deleted_ids).delete()[0]
            self.message_user(request, f"Deleted {count} duplicate Kanji entries and kept the first occurrence per character.")
        else:
            self.message_user(request, "No duplicate Kanji entries were found in the selection.")
    delete_duplicate_kanji.short_description = 'Delete duplicate Kanji entries (keep first per character)'

    def duplicate_kanji_view(self, request):
        duplicates = Kanji.objects.values('character').annotate(count=Count('id')).filter(count__gt=1).order_by('character')
        rows = []
        for dup in duplicates:
            character = dup['character']
            items = Kanji.objects.filter(character=character).order_by('id')
            rows.append((character, dup['count'], [
                f'<a href="{reverse("admin:content_kanji_change", args=[item.id])}">{item.id}</a> {item.meaning}'
                for item in items
            ]))

        html = '<h1>Duplicate Kanji</h1>'
        if not rows:
            html += '<p>No duplicate Kanji found.</p>'
        else:
            html += '<ul>'
            for character, count, items in rows:
                html += f'<li><strong>{character}</strong> ({count})<ul>'
                for item in items:
                    html += f'<li>{item}</li>'
                html += '</ul></li>'
            html += '</ul>'
        return HttpResponse(html)

@admin.register(Vocab)
class VocabAdmin(admin.ModelAdmin):
    list_display = ('word', 'reading', 'meaning', 'word_type', 'jlpt_level')
    list_filter = ('word_type', 'jlpt_level')
    search_fields = ('word', 'reading', 'meaning')
    ordering = ('jlpt_level', 'word')
    actions = [export_as_csv, 'delete_duplicate_vocab']

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('duplicates/', self.admin_site.admin_view(self.duplicate_vocab_view), name='content_vocab_duplicates'),
        ]
        return custom_urls + urls

    def delete_duplicate_vocab(self, request, queryset):
        duplicates = {}
        deleted_ids = []
        for obj in queryset.order_by('word', 'meaning', 'id'):
            key = (obj.word, obj.meaning)
            if key in duplicates:
                deleted_ids.append(obj.id)
            else:
                duplicates[key] = obj.id
        if deleted_ids:
            count = queryset.model.objects.filter(id__in=deleted_ids).delete()[0]
            self.message_user(request, f"Deleted {count} duplicate Vocab entries and kept the first occurrence per word and meaning.")
        else:
            self.message_user(request, "No duplicate Vocab entries were found in the selection.")
    delete_duplicate_vocab.short_description = 'Delete duplicate Vocab entries (keep first per word+meaning)'

    def duplicate_vocab_view(self, request):
        duplicates = Vocab.objects.values('word', 'meaning').annotate(count=Count('id')).filter(count__gt=1).order_by('word', 'meaning')
        rows = []
        for dup in duplicates:
            word = dup['word']
            meaning = dup['meaning']
            items = Vocab.objects.filter(word=word, meaning=meaning).order_by('id')
            rows.append((word, meaning, dup['count'], [
                f'<a href="{reverse("admin:content_vocab_change", args=[item.id])}">{item.id}</a> {item.meaning} (N{item.jlpt_level})'
                for item in items
            ]))

        html = '<h1>Duplicate Vocab</h1>'
        if not rows:
            html += '<p>No duplicate Vocab found.</p>'
        else:
            html += '<ul>'
            for word, count, items in rows:
                html += f'<li><strong>{word}</strong> ({count})<ul>'
                for item in items:
                    html += f'<li>{item}</li>'
                html += '</ul></li>'
            html += '</ul>'
        return HttpResponse(html)

@admin.register(Grammar)
class GrammarAdmin(admin.ModelAdmin):
    list_display = ('title', 'structure', 'jlpt_level', 'chapter')
    list_filter = ('jlpt_level', 'chapter')
    search_fields = ('title', 'structure', 'explanation')
    ordering = ('chapter', 'title')
    actions = [export_as_csv]

@admin.register(Blog)
class BlogAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'is_published', 'created_at')
    list_filter = ('is_published',)
    search_fields = ('title', 'content')
    prepopulated_fields = {'slug': ('title',)}

@admin.register(Particle)
class ParticleAdmin(admin.ModelAdmin):
    list_display = ('character', 'meaning', 'jlpt_level')
    list_filter = ('jlpt_level',)
    search_fields = ('character', 'meaning', 'explanation')

@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'type', 'is_active', 'show_as_popup', 'created_at')
    list_filter = ('type', 'is_active', 'show_as_popup')
    search_fields = ('title', 'content')
    ordering = ('-created_at',)

@admin.register(MinnaQuestion)
class MinnaQuestionAdmin(admin.ModelAdmin):
    list_display  = ('book', 'chapter', 'question_type', 'jlpt_level', 'question_jp_short', 'correct_answer')
    list_filter   = ('book', 'question_type', 'jlpt_level')
    search_fields = ('question_jp', 'question_id', 'shown_translation', 'correct_answer', 'explanation')
    ordering      = ('book', 'chapter', 'question_type')
    raw_id_fields = ('grammar', 'vocab')
    actions       = [export_as_csv]

    @admin.display(description='Kalimat Soal')
    def question_jp_short(self, obj):
        return obj.question_jp[:60] + ('…' if len(obj.question_jp) > 60 else '')
