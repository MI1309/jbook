import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/database_helper.dart';
import '../services/api_service.dart';

class KanjiListScreen extends StatefulWidget {
  const KanjiListScreen({super.key});

  @override
  State<KanjiListScreen> createState() => _KanjiListScreenState();
}

class _KanjiListScreenState extends State<KanjiListScreen> {
  List<Kanji> _kanjiList = [];
  bool _isLoading = true;
  String _searchQuery = '';
  int? _selectedLevel;
  bool _hasTriedRemote = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final data = await DatabaseHelper.instance.getKanji(
      level: _selectedLevel,
      query: _searchQuery,
    );
    if (data.isNotEmpty || _hasTriedRemote) {
      setState(() {
        _kanjiList = data;
        _isLoading = false;
      });
      return;
    }

    // Jika database kosong dan belum pernah coba ambil dari API, fetch dulu lalu simpan.
    try {
      final api = ApiService();
      final remote = await api.fetchKanji(level: _selectedLevel);
      if (remote.isNotEmpty) {
        await DatabaseHelper.instance.insertKanji(remote);
        final refreshed = await DatabaseHelper.instance.getKanji(
          level: _selectedLevel,
          query: _searchQuery,
        );
        setState(() {
          _kanjiList = refreshed;
        });
      }
    } catch (_) {
      // diamkan saja; UI akan tetap menampilkan pesan kosong
    } finally {
      _hasTriedRemote = true;
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Kanji'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(110),
          child: Padding(
            padding: const EdgeInsets.all(8.0),
            child: Column(
              children: [
                TextField(
                  decoration: const InputDecoration(
                    hintText: 'Cari Kanji...',
                    prefixIcon: Icon(Icons.search),
                    border: OutlineInputBorder(),
                    filled: true,
                    fillColor: Colors.white,
                  ),
                  onChanged: (val) {
                    setState(() => _searchQuery = val);
                    _loadData();
                  },
                ),
                const SizedBox(height: 8),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [null, 5, 4, 3, 2, 1].map((level) {
                      return Padding(
                        padding: const EdgeInsets.only(right: 8.0),
                        child: ChoiceChip(
                          label: Text(level == null ? 'Semua' : 'N$level'),
                          selected: _selectedLevel == level,
                          onSelected: (selected) {
                            setState(() => _selectedLevel = selected ? level : null);
                            _loadData();
                          },
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : _kanjiList.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.download_for_offline, size: 80, color: Colors.grey),
                  const SizedBox(height: 16),
                  const Text('Belum ada data Kanji', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey)),
                  const SizedBox(height: 8),
                  const Text('Silakan login dan tekan tombol Sync\ndi halaman Dashboard untuk mengunduh data.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
                ],
              ),
            )
          : GridView.builder(

            padding: const EdgeInsets.all(12),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              childAspectRatio: 0.8,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
            ),
            itemCount: _kanjiList.length,
            itemBuilder: (context, index) {
              final kanji = _kanjiList[index];
              return Card(
                child: InkWell(
                  onTap: () => _showKanjiDetail(kanji),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(kanji.character, style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text(kanji.meaning, textAlign: TextAlign.center, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12)),
                      Text('N${kanji.jlptLevel}', style: const TextStyle(fontSize: 10, color: Colors.red)),
                    ],
                  ),
                ),
              );
            },
          ),
    );
  }

  void _showKanjiDetail(Kanji kanji) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(kanji.character, style: const TextStyle(fontSize: 64, fontWeight: FontWeight.bold)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(color: Colors.red, borderRadius: BorderRadius.circular(12)),
                    child: Text('JLPT N${kanji.jlptLevel}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Text('Arti:', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
              Text(kanji.meaning, style: const TextStyle(fontSize: 20)),
              const SizedBox(height: 16),
              const Text('Onyomi:', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
              Text(kanji.onyomi.join(', '), style: const TextStyle(fontSize: 16)),
              const SizedBox(height: 8),
              const Text('Kunyomi:', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
              Text(kanji.kunyomi.join(', '), style: const TextStyle(fontSize: 16)),
              const SizedBox(height: 8),
              Text('Strokes: ${kanji.strokes}', style: const TextStyle(color: Colors.grey)),
              const SizedBox(height: 32),
            ],
          ),
        );
      },
    );
  }
}
