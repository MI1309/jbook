import 'package:flutter/material.dart';
import '../../services/api_service.dart';

class AdminKotobaScreen extends StatefulWidget {
  final ApiService api;
  const AdminKotobaScreen({super.key, required this.api});

  @override
  State<AdminKotobaScreen> createState() => _AdminKotobaScreenState();
}

class _AdminKotobaScreenState extends State<AdminKotobaScreen> {
  List<dynamic> _list = [];
  bool _isLoading = true;
  String _search = '';

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final data = await widget.api.fetchAdminKotoba();
      setState(() => _list = data);
    } catch (e) { _showError('$e'); }
    finally { setState(() => _isLoading = false); }
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
  }

  void _showForm({Map<String, dynamic>? item}) {
    final isEdit = item != null;
    final wordCtrl = TextEditingController(text: item?['word'] ?? '');
    final readingCtrl = TextEditingController(text: item?['reading'] ?? '');
    final meaningCtrl = TextEditingController(text: item?['meaning'] ?? '');
    final furiganaCtrl = TextEditingController(text: item?['furigana'] ?? '');
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
                Text(isEdit ? 'Edit Kotoba' : 'Tambah Kotoba', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                _field(wordCtrl, 'Kata (e.g. 食べる)'),
                _field(readingCtrl, 'Reading (e.g. たべる)'),
                _field(meaningCtrl, 'Makna (e.g. to eat)'),
                _field(furiganaCtrl, 'Furigana (opsional)'),
                const Text('Level JLPT:', style: TextStyle(fontWeight: FontWeight.w500)),
                const SizedBox(height: 8),
                DropdownButtonFormField<int>(
                  value: selectedLevel,
                  decoration: InputDecoration(border: OutlineInputBorder(borderRadius: BorderRadius.circular(8))),
                  items: [1,2,3,4,5].map((l) => DropdownMenuItem(value: l, child: Text('N$l'))).toList(),
                  onChanged: (v) => setModalState(() => selectedLevel = v!),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.orange.shade700, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 14)),
                    onPressed: () async {
                      final data = {
                        'word': wordCtrl.text.trim(),
                        'reading': readingCtrl.text.trim(),
                        'meaning': meaningCtrl.text.trim(),
                        'furigana': furiganaCtrl.text.trim(),
                        'jlpt_level': selectedLevel,
                      };
                      try {
                        if (isEdit) await widget.api.updateKotoba(item!['id'].toString(), data);
                        else await widget.api.createKotoba(data);
                        if (mounted) Navigator.pop(ctx);
                        _load();
                      } catch (e) { _showError('$e'); }
                    },
                    child: Text(isEdit ? 'Simpan Perubahan' : 'Tambah Kotoba'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _field(TextEditingController ctrl, String label) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: TextField(controller: ctrl, decoration: InputDecoration(labelText: label, border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)))),
  );

  Future<void> _delete(dynamic item) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Hapus Kotoba'),
        content: Text('Yakin hapus "${item['word']}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Batal')),
          ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: Colors.red), onPressed: () => Navigator.pop(context, true), child: const Text('Hapus', style: TextStyle(color: Colors.white))),
        ],
      ),
    );
    if (confirm == true) {
      try { await widget.api.deleteKotoba(item['id'].toString()); _load(); }
      catch (e) { _showError('$e'); }
    }
  }

  List<dynamic> get _filtered => _search.isEmpty ? _list
      : _list.where((v) => v['word'].toString().contains(_search) || v['meaning'].toString().toLowerCase().contains(_search.toLowerCase())).toList();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Kelola Kotoba', style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.orange.shade700,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showForm(),
        backgroundColor: Colors.orange.shade700, foregroundColor: Colors.white,
        icon: const Icon(Icons.add), label: const Text('Tambah'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              decoration: InputDecoration(hintText: 'Cari Kotoba...', prefixIcon: const Icon(Icons.search), border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)), filled: true, fillColor: Colors.white),
              onChanged: (v) => setState(() => _search = v),
            ),
          ),
          Expanded(
            child: _isLoading ? const Center(child: CircularProgressIndicator())
                : RefreshIndicator(
                    onRefresh: _load,
                    child: ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      itemCount: _filtered.length,
                      itemBuilder: (_, i) {
                        final v = _filtered[i];
                        return Card(
                          margin: const EdgeInsets.symmetric(vertical: 4),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          child: ListTile(
                            leading: CircleAvatar(backgroundColor: Colors.orange.shade50, child: Text(v['word']?.toString().characters.first ?? '?', style: TextStyle(color: Colors.orange.shade700, fontWeight: FontWeight.bold))),
                            title: Text('${v['word']} (${v['reading']})', style: const TextStyle(fontWeight: FontWeight.w600)),
                            subtitle: Text('${v['meaning']} • N${v['jlpt_level']}'),
                            trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                              IconButton(icon: const Icon(Icons.edit, color: Colors.blue), onPressed: () => _showForm(item: v)),
                              IconButton(icon: const Icon(Icons.delete, color: Colors.red), onPressed: () => _delete(v)),
                            ]),
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