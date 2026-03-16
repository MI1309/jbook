import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/database_helper.dart';
import '../services/api_service.dart';

class GrammarListScreen extends StatefulWidget {
  const GrammarListScreen({super.key});

  @override
  State<GrammarListScreen> createState() => _GrammarListScreenState();
}

class _GrammarListScreenState extends State<GrammarListScreen> {
  List<Grammar> _grammarList = [];
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
    final data = await DatabaseHelper.instance.getGrammar(
      level: _selectedLevel,
      query: _searchQuery,
    );
    if (data.isNotEmpty || _hasTriedRemote) {
      setState(() {
        _grammarList = data;
        _isLoading = false;
      });
      return;
    }

    try {
      final api = ApiService();
      final remote = await api.fetchGrammar(level: _selectedLevel);
      if (remote.isNotEmpty) {
        await DatabaseHelper.instance.insertGrammar(remote);
        final refreshed = await DatabaseHelper.instance.getGrammar(
          level: _selectedLevel,
          query: _searchQuery,
        );
        setState(() {
          _grammarList = refreshed;
        });
      }
    } catch (_) {
      // ignore, keep empty
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
        title: const Text('Grammar'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(110),
          child: Padding(
            padding: const EdgeInsets.all(8.0),
            child: Column(
              children: [
                TextField(
                  decoration: const InputDecoration(
                    hintText: 'Cari Tata Bahasa...',
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
        : _grammarList.isEmpty
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.download_for_offline, size: 80, color: Colors.grey),
                  SizedBox(height: 16),
                  Text('Belum ada data Bunpo', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey)),
                  SizedBox(height: 8),
                  Text('Silakan login dan tekan tombol Sync\ndi halaman Dashboard untuk mengunduh data.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
                ],
              ),
            )
          : ListView.separated(

            padding: const EdgeInsets.all(12),
            itemCount: _grammarList.length,
            separatorBuilder: (_, __) => const Divider(),
            itemBuilder: (context, index) {
              final grammar = _grammarList[index];
              return ListTile(
                title: Text(grammar.title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                subtitle: Text(grammar.explanation, maxLines: 2, overflow: TextOverflow.ellipsis),
                trailing: Text('N${grammar.jlptLevel}', style: const TextStyle(color: Colors.red)),
                onTap: () => _showGrammarDetail(grammar),
              );
            },
          ),
    );
  }

  void _showGrammarDetail(Grammar grammar) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return DraggableScrollableSheet(
          initialChildSize: 0.6,
          maxChildSize: 0.9,
          minChildSize: 0.4,
          expand: false,
          builder: (context, scrollController) {
            return SingleChildScrollView(
              controller: scrollController,
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(grammar.title, style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text('JLPT N${grammar.jlptLevel} • Chapter ${grammar.chapter}', style: const TextStyle(color: Colors.red)),
                  const SizedBox(height: 24),
                  const Text('Struktur:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.symmetric(vertical: 8),
                    decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
                    child: Text(grammar.structure, style: const TextStyle(fontSize: 16)),
                  ),
                  const SizedBox(height: 16),
                  const Text('Penjelasan:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                  const SizedBox(height: 8),
                  Text(grammar.explanation, style: const TextStyle(fontSize: 16)),
                ],
              ),
            );
          },
        );
      },
    );
  }
}
