import 'package:flutter/material.dart';
import '../../services/api_service.dart';

class AdminKanjiScreen extends StatefulWidget {
  final ApiService api;
  const AdminKanjiScreen({super.key, required this.api});

  @override
  State<AdminKanjiScreen> createState() => _AdminKanjiScreenState();
}

class _AdminKanjiScreenState extends State<AdminKanjiScreen> {
  List<dynamic> _list = [];
  bool _isLoading = true;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final data = await widget.api.fetchAdminKanji();
      setState(() => _list = data);
    } catch (e) {
      _showError('$e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
  }

  void _showForm({Map<String, dynamic>? item}) {
    final isEdit = item != null;
    final charCtrl = TextEditingController(text: item?['character'] ?? '');
    final meaningCtrl = TextEditingController(text: item?['meaning'] ?? '');
    final onyomiCtrl = TextEditingController(text: (item?['onyomi'] as List?)?.join(', ') ?? '');
    final kunyomiCtrl = TextEditingController(text: (item?['kunyomi'] as List?)?.join(', ') ?? '');
    final strokesCtrl = TextEditingController(text: item?['strokes']?.toString() ?? '');
    int selectedLevel = item?['jlpt_level'] ?? 5;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(left: 24, right: 24, top: 24, bottom: MediaQuery.of(ctx).viewInsets.bottom + 24),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(isEdit ? 'Edit Kanji' : 'Tambah Kanji', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                _field(charCtrl, 'Karakter (e.g. 日)'),
                _field(meaningCtrl, 'Makna (e.g. sun, day)'),
                _field(onyomiCtrl, 'Onyomi (pisah koma: ニチ, ジツ)'),
                _field(kunyomiCtrl, 'Kunyomi (pisah koma: ひ, か)'),
                _field(strokesCtrl, 'Jumlah Stroke', isNumber: true),
                const Text('Level JLPT:', style: TextStyle(fontWeight: FontWeight.w500)),
                const SizedBox(height: 8),
                DropdownButtonFormField<int>(
                  value: selectedLevel,
                  decoration: InputDecoration(border: OutlineInputBorder(borderRadius: BorderRadius.circular(8))),
                  items: [1, 2, 3, 4, 5].map((l) => DropdownMenuItem(value: l, child: Text('N$l'))).toList(),
                  onChanged: (v) => setModalState(() => selectedLevel = v!),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.red.shade700, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 14)),
                    onPressed: () async {
                      final data = {
                        'character': charCtrl.text.trim(),
                        'meaning': meaningCtrl.text.trim(),
                        'onyomi': onyomiCtrl.text.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList(),
                        'kunyomi': kunyomiCtrl.text.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList(),
                        'strokes': int.tryParse(strokesCtrl.text.trim()) ?? 0,
                        'jlpt_level': selectedLevel,
                      };
                      try {
                        if (isEdit) {
                          await widget.api.updateKanji(item!['id'].toString(), data);
                        } else {
                          await widget.api.createKanji(data);
                        }
                        if (mounted) Navigator.pop(ctx);
                        _load();
                      } catch (e) {
                        _showError('$e');
                      }
                    },
                    child: Text(isEdit ? 'Simpan Perubahan' : 'Tambah Kanji'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _field(TextEditingController ctrl, String label, {bool isNumber = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: ctrl,
        keyboardType: isNumber ? TextInputType.number : TextInputType.text,
        decoration: InputDecoration(labelText: label, border: OutlineInputBorder(borderRadius: BorderRadius.circular(8))),
      ),
    );
  }

  Future<void> _delete(dynamic item) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Hapus Kanji'),
        content: Text('Yakin hapus "${item['character']}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Batal')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Hapus', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (confirm == true) {
      try {
        await widget.api.deleteKanji(item['id'].toString());
        _load();
      } catch (e) {
        _showError('$e');
      }
    }
  }

  List<dynamic> get _filtered => _search.isEmpty
      ? _list
      : _list.where((k) =>
          k['character'].toString().contains(_search) ||
          k['meaning'].toString().toLowerCase().contains(_search.toLowerCase())).toList();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Kelola Kanji', style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.red.shade700,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showForm(),
        backgroundColor: Colors.red.shade700,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Tambah'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Cari kanji...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                filled: true, fillColor: Colors.white,
              ),
              onChanged: (v) => setState(() => _search = v),
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : RefreshIndicator(
                    onRefresh: _load,
                    child: ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      itemCount: _filtered.length,
                      itemBuilder: (_, i) {
                        final k = _filtered[i];
                        return Card(
                          margin: const EdgeInsets.symmetric(vertical: 4),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: Colors.red.shade50,
                              child: Text(k['character'] ?? '', style: TextStyle(color: Colors.red.shade700, fontWeight: FontWeight.bold)),
                            ),
                            title: Text('${k['character']} — ${k['meaning']}', style: const TextStyle(fontWeight: FontWeight.w600)),
                            subtitle: Text('N${k['jlpt_level']} • ${k['strokes']} stroke'),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                IconButton(icon: const Icon(Icons.edit, color: Colors.blue), onPressed: () => _showForm(item: k)),
                                IconButton(icon: const Icon(Icons.delete, color: Colors.red), onPressed: () => _delete(k)),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}