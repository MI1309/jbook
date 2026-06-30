import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import '../models/models.dart';
import '../services/api_service.dart';
import '../providers/auth_provider.dart';

class PracticeQuizScreen extends StatefulWidget {
  final String type;
  final int? level;
  final int questionCount;
  final int? timeLimitMinutes;

  const PracticeQuizScreen({
    super.key,
    required this.type,
    this.level,
    required this.questionCount,
    this.timeLimitMinutes,
  });

  @override
  State<PracticeQuizScreen> createState() => _PracticeQuizScreenState();
}

class _PracticeQuizScreenState extends State<PracticeQuizScreen> {
  final ApiService _apiService = ApiService();
  List<Question> _questions = [];
  int _currentIndex = 0;
  List<QuizResult> _results = [];
  bool _isLoading = true;
  bool _isAnswered = false;
  int? _selectedIndex;
  int? _secondsLeft;
  Timer? _timer;
  Timer? _autoAdvanceTimer;

  @override
  void initState() {
    super.initState();
    _loadQuiz();
    _initTimer();
  }

  void _initTimer() {
    if (widget.timeLimitMinutes == null) return;
    _secondsLeft = widget.timeLimitMinutes! * 60;
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted || _secondsLeft == null) {
        timer.cancel();
        return;
      }
      if (_secondsLeft! <= 1) {
        timer.cancel();
        setState(() => _secondsLeft = 0);
        _onTimeUp();
      } else {
        setState(() => _secondsLeft = _secondsLeft! - 1);
      }
    });
  }

  Future<void> _loadQuiz() async {
    try {
      final token = Provider.of<AuthProvider>(context, listen: false).token;
      _apiService.updateToken(token);
      final questions = await _apiService.fetchQuiz(
        type: widget.type,
        level: widget.level,
        limit: widget.questionCount,
      );
      setState(() {
        _questions = questions;
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
        Navigator.pop(context);
      }
    }
  }

  void _handleAnswer(int index) {
    if (_secondsLeft != null && _secondsLeft == 0) return;
    if (_isAnswered) return;
    setState(() {
      _isAnswered = true;
      _selectedIndex = index;
    });

    final question = _questions[_currentIndex];
    final selectedOption = question.options[index];
    _results.add(QuizResult(
      questionId: question.id,
      type: question.type,
      isCorrect: selectedOption.isCorrect,
      answerGiven: selectedOption.text,
    ));

    _autoAdvanceTimer?.cancel();
    _autoAdvanceTimer = Timer(const Duration(seconds: 8), () {
      if (mounted) _nextQuestion();
    });
  }

  void _nextQuestion() {
    _autoAdvanceTimer?.cancel();
    _autoAdvanceTimer = null;
    if (_currentIndex < _questions.length - 1) {
      setState(() {
        _currentIndex++;
        _isAnswered = false;
        _selectedIndex = null;
      });
    } else {
      _showResults();
    }
  }

  void _onTimeUp() {
    // Saat waktu habis, langsung tampilkan hasil dari jawaban yang sudah ada
    if (!_isLoading && _questions.isNotEmpty) {
      _showResults(timeUp: true);
    }
  }

  Future<void> _showResults({bool timeUp = false}) async {
    setState(() => _isLoading = true);
    try {
      await _apiService.submitQuiz(_results);
    } catch (e) {
      print('Score submission failed: $e');
    }

    if (!mounted) return;
    
    final correctCount = _results.where((r) => r.isCorrect).length;
    
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Latihan Selesai!'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Skor Anda: $correctCount / ${_questions.length}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Text('Akurasi: ${(correctCount / _questions.length * 100).toStringAsFixed(1)}%'),
            if (timeUp) ...[
              const SizedBox(height: 12),
              const Text('Waktu habis. Hasil diambil dari jawaban yang sudah terisi.', textAlign: TextAlign.center),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context); // Close dialog
              Navigator.pop(context); // Exit quiz
            },
            child: const Text('KEMBALI KE DASHBOARD'),
          ),
        ],
      ),
    );
  }

  String _formatTime(int seconds) {
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  void dispose() {
    _timer?.cancel();
    _autoAdvanceTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_questions.isEmpty) return const Scaffold(body: Center(child: Text('Tidak ada pertanyaan tersedia.')));

    final question = _questions[_currentIndex];
    final progress = (_currentIndex + 1) / _questions.length;

    return Scaffold(
      appBar: AppBar(
        title: Text('Pertanyaan ${_currentIndex + 1} / ${_questions.length}'),
        actions: [
          if (_secondsLeft != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Center(
                child: Text(
                  _formatTime(_secondsLeft!),
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: LinearProgressIndicator(value: progress, backgroundColor: Colors.red.shade100, color: Colors.red),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    question.character,
                    style: TextStyle(
                      fontSize: question.character.length > 10 
                        ? 28 
                        : (widget.type == 'kanji' ? 80 : 44),
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  if (_isAnswered && (question.reading != null || question.meaning != null)) ...[
                    const SizedBox(height: 16),
                    if (question.type != 'kanji' && question.reading != null && question.reading!.isNotEmpty) ...[
                      Text(question.reading ?? '', style: const TextStyle(fontSize: 20, color: Colors.grey)),
                      const SizedBox(height: 8),
                    ],
                    Text(question.meaning ?? '', style: const TextStyle(fontSize: 18)),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 32),
            ...List.generate(question.options.length, (index) {
              final option = question.options[index];
              Color? btnColor;
              if (_isAnswered) {
                if (option.isCorrect) btnColor = Colors.green.shade400;
                else if (_selectedIndex == index) btnColor = Colors.red.shade400;
              }

              return Padding(
                padding: const EdgeInsets.only(bottom: 12.0),
                child: ElevatedButton(
                  onPressed: _isAnswered ? null : () => _handleAnswer(index),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: btnColor,
                    disabledBackgroundColor: btnColor ?? Colors.grey.shade200,
                    foregroundColor: btnColor != null ? Colors.white : Colors.black,
                    disabledForegroundColor: btnColor != null ? Colors.white : Colors.black54,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text(option.text, style: const TextStyle(fontSize: 16)),
                ),
              );
            }),
            const SizedBox(height: 24),
            if (_isAnswered)
              ElevatedButton(
                onPressed: _nextQuestion,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: Text(_currentIndex < _questions.length - 1
                    ? 'LANJUT (atau tunggu 8 detik)'
                    : 'LIHAT HASIL'),
              ),
          ],
        ),
      ),
    );
  }
}
