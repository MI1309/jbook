import 'package:flutter/material.dart';
import 'practice_quiz_screen.dart';

class PracticeSetupScreen extends StatefulWidget {
  const PracticeSetupScreen({super.key});

  @override
  State<PracticeSetupScreen> createState() => _PracticeSetupScreenState();
}

class _PracticeSetupScreenState extends State<PracticeSetupScreen> {
  String _selectedType = 'kanji';
  int? _selectedLevel = 5;
  int _questionCount = 10;
  int? _timeLimitMinutes; // null = tanpa batas

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Latihan')),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Pilih Materi:', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Wrap(
              spacing: 12,
              children: [
                _TypeChip(label: 'Kanji', value: 'kanji', selected: _selectedType == 'kanji', onSelected: (s) => setState(() => _selectedType = 'kanji')),
                _TypeChip(label: 'Vocab', value: 'vocab', selected: _selectedType == 'vocab', onSelected: (s) => setState(() => _selectedType = 'vocab')),
                _TypeChip(label: 'Grammar', value: 'grammar', selected: _selectedType == 'grammar', onSelected: (s) => setState(() => _selectedType = 'grammar')),
              ],
            ),
            const SizedBox(height: 32),
            const Text('Pilih Level JLPT:', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Wrap(
              spacing: 12,
              children: [5, 4, 3, 2, 1].map((n) {
                return ChoiceChip(
                  label: Text('N$n'),
                  selected: _selectedLevel == n,
                  onSelected: (s) => setState(() => _selectedLevel = s ? n : null),
                );
              }).toList(),
            ),
            const SizedBox(height: 32),
            const Text('Jumlah Soal:', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            DropdownButtonFormField<int>(
              value: _questionCount,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
              items: const [5, 10, 15, 20, 30].map((n) {
                return DropdownMenuItem<int>(
                  value: n,
                  child: Text('$n soal'),
                );
              }).toList(),
              onChanged: (val) {
                if (val != null) setState(() => _questionCount = val);
              },
            ),
            const SizedBox(height: 24),
            const Text('Batas Waktu (opsional):', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            DropdownButtonFormField<int>(
              value: _timeLimitMinutes,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
              items: <int?>[null, 5, 10, 15, 20].map((m) {
                if (m == null) {
                  return const DropdownMenuItem<int>(
                    value: null,
                    child: Text('Tanpa batas waktu'),
                  );
                }
                return DropdownMenuItem<int>(
                  value: m,
                  child: Text('$m menit'),
                );
              }).toList(),
              onChanged: (val) {
                setState(() => _timeLimitMinutes = val);
              },
            ),
            const Spacer(),
            ElevatedButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => PracticeQuizScreen(
                      type: _selectedType,
                      level: _selectedLevel,
                      questionCount: _questionCount,
                      timeLimitMinutes: _timeLimitMinutes,
                    ),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('MULAI LATIHAN', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}

class _TypeChip extends StatelessWidget {
  final String label;
  final String value;
  final bool selected;
  final Function(bool) onSelected;

  const _TypeChip({required this.label, required this.value, required this.selected, required this.onSelected});

  @override
  Widget build(BuildContext context) {
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      onSelected: onSelected,
      selectedColor: Colors.red.shade100,
      labelStyle: TextStyle(color: selected ? Colors.red.shade900 : Colors.black),
    );
  }
}
