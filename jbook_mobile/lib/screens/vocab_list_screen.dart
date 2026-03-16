import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/database_helper.dart';
import '../services/api_service.dart';

class VocabListScreen extends StatefulWidget {
  const VocabListScreen({super.key});

  @override
  State<VocabListScreen> createState() => _VocabListScreenState();
}

class _VocabListScreenState extends State<VocabListScreen> {
  List<Vocab> _vocabList = [];
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
    final data = await DatabaseHelper.instance.getVocab(
      level: _selectedLevel,
      query: _searchQuery,
    );
    if (data.isNotEmpty || _hasTriedRemote) {
      setState(() {
        _vocabList = data;
        _isLoading = false;
      });
      return;
    }

    try {
      final api = ApiService();
      final remote = await api.fetchVocab(level: _selectedLevel);
      if (remote.isNotEmpty) {
        await DatabaseHelper.instance.insertVocab(remote);
        final refreshed = await DatabaseHelper.instance.getVocab(
          level: _selectedLevel,
          query: _searchQuery,
        );
        setState(() {
          _vocabList = refreshed;
        });
      }
    } catch (_) {
      // ignore error, show empty state text
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
        title: const Text('Kotoba'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(110),
          child: Padding(
            padding: const EdgeInsets.all(8.0),
            child: Column(
              children: [
                TextField(
                  decoration: const InputDecoration(
                    hintText: 'Cari Kosakata...',
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
        : _vocabList.isEmpty
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.download_for_offline, size: 80, color: Colors.grey),
                  SizedBox(height: 16),
                  Text('Belum ada data Kotoba', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey)),
                  SizedBox(height: 8),
                  Text('Silakan login dan tekan tombol Sync\ndi halaman Dashboard untuk mengunduh data.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
                ],
              ),
            )
          : ListView.separated(

            padding: const EdgeInsets.all(12),
            itemCount: _vocabList.length,
            separatorBuilder: (_, __) => const Divider(),
            itemBuilder: (context, index) {
              final vocab = _vocabList[index];
              return ListTile(
                title: Text(vocab.word, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                subtitle: Text('${vocab.reading} • ${vocab.meaning}'),
                trailing: Text('N${vocab.jlptLevel}', style: const TextStyle(color: Colors.red)),
                onTap: () => _showVocabDetail(vocab),
              );
            },
          ),
    );
  }

  void _showVocabDetail(Vocab vocab) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(vocab.word, style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold)),
              Text(vocab.reading, style: const TextStyle(fontSize: 18, color: Colors.grey)),
              const SizedBox(height: 16),
              const Text('Arti:', style: TextStyle(fontWeight: FontWeight.bold)),
              Text(vocab.meaning, style: const TextStyle(fontSize: 18)),
              if (vocab.furigana != null && vocab.furigana!.isNotEmpty) ...[
                const SizedBox(height: 16),
                const Text('Furigana:', style: TextStyle(fontWeight: FontWeight.bold)),
                Text(vocab.furigana!, style: const TextStyle(fontSize: 18)),
              ],
              const SizedBox(height: 16),
              Text('JLPT N${vocab.jlptLevel}', style: const TextStyle(color: Colors.red)),
            ],
          ),
        );
      },
    );
  }
}
