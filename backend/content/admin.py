import csv
from django.contrib import admin
from django.http import HttpResponse
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
    actions = [export_as_csv]

@admin.register(Vocab)
class VocabAdmin(admin.ModelAdmin):
    list_display = ('word', 'reading', 'meaning', 'word_type', 'jlpt_level')
    list_filter = ('word_type', 'jlpt_level')
    search_fields = ('word', 'reading', 'meaning')
    ordering = ('jlpt_level', 'word')
    actions = [export_as_csv]

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
