import 'package:flutter/material.dart';
import '../../services/api_service.dart';

class AdminBunpoScreen extends StatefulWidget {
  final ApiService api;
  const AdminBunpoScreen({super.key, required this.api});

  @override
  State<AdminBunpoScreen> createState() => _AdminBunpoScreenState();
}

class _AdminBunpoScreenState extends State<AdminBunpoScreen> {
  List<dynamic> _list = [];
  bool _isLoading = true;
  String _search = '';

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final data = await widget.api.fetchAdminBunpo();
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
    final titleCtrl = TextEditingController(text: item?['title'] ?? '');
    final structCtrl = TextEditingController(text: item?['structure'] ?? '');
    final explainCtrl = TextEditingController(text: item?['explanation'] ?? '');
    final chapterCtrl = TextEditingController(text: item?['chapter']?.toString() ?? '');
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
                Text(isEdit ? 'Edit Bunpo' : 'Tambah Bunpo', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                _field(titleCtrl, 'Judul (e.g. ～てください)'),
                _field(structCtrl, 'Struktur'),
                _field(explainCtrl, 'Penjelasan', maxLines: 3),
                _field(chapterCtrl, 'Chapter', isNumber: true),
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
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.blue.shade700, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 14)),
                    onPressed: () async {
                      final data = {
                        'title': titleCtrl.text.trim(),
                        'structure': structCtrl.text.trim(),
                        'explanation': explainCtrl.text.trim(),
                        'chapter': int.tryParse(chapterCtrl.text.trim()) ?? 0,
                        'jlpt_level': selectedLevel,
                      };
                      try {
                        if (isEdit) await widget.api.updateBunpo(item!['id'].toString(), data);
                        else await widget.api.createBunpo(data);
                        if (mounted) Navigator.pop(ctx);
                        _load();
                      } catch (e) { _showError('$e'); }
                    },
                    child: Text(isEdit ? 'Simpan Perubahan' : 'Tambah Bunpo'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _field(TextEditingController ctrl, String label, {bool isNumber = false, int maxLines = 1}) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: TextField(
      controller: ctrl,
      maxLines: maxLines,
      keyboardType: isNumber ? TextInputType.number : TextInputType.multiline,
      decoration: InputDecoration(labelText: label, border: OutlineInputBorder(borderRadius: BorderRadius.circular(8))),
    ),
  );

  Future<void> _delete(dynamic item) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Hapus Bunpo'),
        content: Text('Yakin hapus "${item['title']}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Batal')),
          ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: Colors.red), onPressed: () => Navigator.pop(context, true), child: const Text('Hapus', style: TextStyle(color: Colors.white))),
        ],
      ),
    );
    if (confirm == true) {
      try { await widget.api.deleteBunpo(item['id'].toString()); _load(); }
      catch (e) { _showError('$e'); }
    }
  }

  List<dynamic> get _filtered => _search.isEmpty ? _list
      : _list.where((b) => b['title'].toString().toLowerCase().contains(_search.toLowerCase()) || b['explanation'].toString().toLowerCase().contains(_search.toLowerCase())).toList();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Kelola Bunpo', style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.blue.shade700,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showForm(),
        backgroundColor: Colors.blue.shade700, foregroundColor: Colors.white,
        icon: const Icon(Icons.add), label: const Text('Tambah'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              decoration: InputDecoration(hintText: 'Cari bunpo...', prefixIcon: const Icon(Icons.search), border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)), filled: true, fillColor: Colors.white),
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
                        final b = _filtered[i];
                        return Card(
                          margin: const EdgeInsets.symmetric(vertical: 4),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          child: ListTile(
                            leading: CircleAvatar(backgroundColor: Colors.blue.shade50, child: Text('N${b['jlpt_level']}', style: TextStyle(color: Colors.blue.shade700, fontWeight: FontWeight.bold, fontSize: 12))),
                            title: Text(b['title'] ?? '-', style: const TextStyle(fontWeight: FontWeight.w600)),
                            subtitle: Text('Ch.${b['chapter']} • ${b['structure']}', maxLines: 1, overflow: TextOverflow.ellipsis),
                            trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                              IconButton(icon: const Icon(Icons.edit, color: Colors.blue), onPressed: () => _showForm(item: b)),
                              IconButton(icon: const Icon(Icons.delete, color: Colors.red), onPressed: () => _delete(b)),
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