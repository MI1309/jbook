import 'package:flutter/material.dart';
import '../data/kana_data.dart';

class KanaScreen extends StatefulWidget {
  const KanaScreen({super.key});

  @override
  State<KanaScreen> createState() => _KanaScreenState();
}

class _KanaScreenState extends State<KanaScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Hiragana & Katakana'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Hiragana'),
            Tab(text: 'Katakana'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _KanaGrid(gojuon: hiraganaGojuon, dakuon: hiraganaDakuon, yoon: hiraganaYoon),
          _KanaGrid(gojuon: katakanaGojuon, dakuon: katakanaDakuon, yoon: katakanaYoon),
        ],
      ),
    );
  }
}

class _KanaGrid extends StatelessWidget {
  final List<Map<String, String>> gojuon;
  final List<Map<String, String>> dakuon;
  final List<Map<String, String>> yoon;

  const _KanaGrid({required this.gojuon, required this.dakuon, required this.yoon});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const _SectionHeader(title: 'Gojuon (Huruf Dasar)'),
        _buildGrid(gojuon, 5),
        const SizedBox(height: 32),
        const _SectionHeader(title: 'Dakuon & Handakuon'),
        _buildGrid(dakuon, 5),
        const SizedBox(height: 32),
        const _SectionHeader(title: 'Yoon (Huruf Gabungan)'),
        _buildGrid(yoon, 3),
      ],
    );
  }

  Widget _buildGrid(List<Map<String, String>> data, int columns) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: columns,
        childAspectRatio: 1,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
      ),
      itemCount: data.length,
      itemBuilder: (context, index) {
        final item = data[index];
        if (item['kana']!.isEmpty) return const SizedBox.shrink();
        
        return Card(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(color: Colors.grey.shade200),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(item['kana']!, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              Text(item['romaji']!, style: const TextStyle(fontSize: 12, color: Colors.red, fontWeight: FontWeight.bold)),
            ],
          ),
        );
      },
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
    );
  }
}
