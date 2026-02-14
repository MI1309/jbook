from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from .models import QuizAttempt
from content.models import Kanji
import random

class PracticeKanjiViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def generate(self, request):
        # Get 10 random Kanji
        # In a real app, this should specific logic (e.g. SRS based)
        items = list(Kanji.objects.all())
        if len(items) < 4:
             return Response({"error": "Not enough Kanji content"}, status=400)
        
        selected_kanji = random.sample(items, min(len(items), 5)) # Take 5 for now
        
        questions = []
        for kanji in selected_kanji:
            # Get 3 distractors
            distractors = random.sample([k for k in items if k.id != kanji.id], 3)
            options = [
                {"text": kanji.meaning, "is_correct": True},
                *[{"text": d.meaning, "is_correct": False} for d in distractors]
            ]
            random.shuffle(options)
            
            questions.append({
                "kanji_id": kanji.id,
                "character": kanji.character,
                "options": options
            })
            
        return Response(questions)

    @action(detail=False, methods=['post'])
    def submit(self, request):
        user = request.user
        results = request.data.get('results', [])
        
        attempts = []
        for res in results:
            attempts.append(QuizAttempt(
                user=user,
                kanji_id=res['kanji_id'],
                is_correct=res['is_correct'],
                answer_given=res.get('answer_given')
            ))
            
        QuizAttempt.objects.bulk_create(attempts)
        return Response({"status": "saved", "count": len(attempts)})

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        user = request.user
        qs = QuizAttempt.objects.filter(user=user)
        
        total_attempts = qs.count()
        correct_count = qs.filter(is_correct=True).count()
        accuracy = (correct_count / total_attempts * 100) if total_attempts > 0 else 0
        
        # Top 5 mistaken kanji
        wrong_stats = qs.filter(is_correct=False).values('kanji__character')\
            .annotate(count=Count('id')).order_by('-count')[:5]
            
        return Response({
            "total_attempts": total_attempts,
            "accuracy": round(accuracy, 1),
            "wrong_stats": wrong_stats
        })
