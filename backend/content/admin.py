import csv
from django.contrib import admin
from django.http import HttpResponse
from .models import Kanji, Vocab, Grammar, Blog

@admin.action(description="Export selected items as CSV")
def export_as_csv(modeladmin, request, queryset):
    """
    Generic admin action to export selected objects to CSV.
    """
    opts = modeladmin.model._meta
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename={opts.verbose_name_plural}.csv'

    writer = csv.writer(response)
    
    # Get all field names of the model
    field_names = [field.name for field in opts.fields]
    writer.writerow(field_names)

    # Write data rows
    for obj in queryset:
        row = [getattr(obj, field) for field in field_names]
        writer.writerow(row)

    return response


@admin.register(Kanji)
class KanjiAdmin(admin.ModelAdmin):
    list_display = ('character', 'meaning', 'jlpt_level', 'strokes')
    list_filter = ('jlpt_level',)
    search_fields = ('character', 'meaning')
    ordering = ('jlpt_level', 'character')
    actions = [export_as_csv]

@admin.register(Vocab)
class VocabAdmin(admin.ModelAdmin):
    list_display = ('word', 'reading', 'meaning', 'jlpt_level')
    list_filter = ('jlpt_level',)
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
