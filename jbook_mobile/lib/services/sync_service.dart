import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../services/database_helper.dart';

/// Handles syncing master data (kanji, vocab, grammar) from the API
/// into the local SQLite database.
class SyncService {
  final ApiService _apiService = ApiService();

  Future<void> syncAllData({
    required String? token,
    required void Function(String message) onProgress,
  }) async {
    // Token hanya diperlukan untuk endpoint yang butuh auth.
    // Untuk konten publik (kanji, vocab, grammar), guest juga boleh sync.
    if (token != null && token.isNotEmpty) {
      _apiService.updateToken(token);
    } else {
      _apiService.updateToken(null);
    }

    onProgress('Mengambil data Kanji dari server...');
    final kanjiList = await _apiService.fetchKanji();
    await DatabaseHelper.instance.insertKanji(kanjiList);

    onProgress('Mengambil data Kosakata dari server...');
    final vocabList = await _apiService.fetchVocab();
    await DatabaseHelper.instance.insertVocab(vocabList);

    onProgress('Mengambil data Tata Bahasa dari server...');
    final grammarList = await _apiService.fetchGrammar();
    await DatabaseHelper.instance.insertGrammar(grammarList);

    final ts = DateTime.now().toIso8601String();
    await DatabaseHelper.instance.saveSyncMeta('last_synced_at', ts);
    onProgress('Sinkronisasi selesai. Data tersimpan di perangkat.');
  }

  Future<String?> getLastSyncedAt() {
    return DatabaseHelper.instance.getSyncMeta('last_synced_at');
  }
}

/// A full-screen sync dialog/sheet that shows real-time progress.
/// Usage:
///   await showSyncSheet(context);
Future<void> showSyncSheet(BuildContext context) {
  return showModalBottomSheet(
    context: context,
    isDismissible: false,
    enableDrag: false,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (_) => const _SyncSheet(),
  );
}

class _SyncSheet extends StatefulWidget {
  const _SyncSheet();

  @override
  State<_SyncSheet> createState() => _SyncSheetState();
}

class _SyncSheetState extends State<_SyncSheet> {
  final SyncService _syncService = SyncService();
  final List<_SyncStep> _steps = [];
  bool _isDone = false;
  bool _hasError = false;
  String? _lastSyncedAt;

  // All expected steps — gives the progress bar something to track
  static const _expectedSteps = 4;

  @override
  void initState() {
    super.initState();
    _startSync();
  }

  Future<void> _startSync() async {
    final token = context.read<AuthProvider>().token;

    try {
      await _syncService.syncAllData(
        token: token,
        onProgress: (msg) {
          if (mounted) {
            setState(() {
              _steps.add(_SyncStep(message: msg, isError: false));
            });
          }
        },
      );

      final ts = await _syncService.getLastSyncedAt();
      if (mounted) {
        setState(() {
          _isDone = true;
          _lastSyncedAt = ts;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _steps.add(_SyncStep(message: 'Error: $e', isError: true));
          _hasError = true;
          _isDone = true;
        });
      }
    }
  }

  double get _progress {
    if (_isDone && !_hasError) return 1.0;
    return (_steps.length / _expectedSteps).clamp(0.0, 0.95);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Handle bar
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),

          Row(
            children: [
              const Icon(Icons.sync_rounded, color: Colors.red, size: 28),
              const SizedBox(width: 12),
              Text(
                _isDone
                    ? (_hasError ? 'Sinkronisasi Gagal' : 'Sinkronisasi Selesai!')
                    : 'Sinkronisasi Data...',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: _isDone ? (_hasError ? null : 1.0) : _progress,
              minHeight: 8,
              backgroundColor: Colors.grey.shade200,
              valueColor: AlwaysStoppedAnimation<Color>(
                _hasError ? Colors.red : Colors.green,
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Step list
          ..._steps.map((s) => _StepTile(step: s)),

          if (_isDone && !_hasError) ...[
            const SizedBox(height: 8),
            _StepTile(
              step: _SyncStep(
                message: 'Terakhir sinkronisasi: ${_lastSyncedAt ?? '-'}',
                isError: false,
                isInfo: true,
              ),
            ),
          ],

          const SizedBox(height: 20),

          if (_isDone)
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(),
              style: ElevatedButton.styleFrom(
                backgroundColor: _hasError ? Colors.red : Colors.green,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: Text(_hasError ? 'Tutup' : 'Selesai'),
            )
          else
            const Center(
              child: Text(
                'Mohon tunggu, jangan tutup aplikasi...',
                style: TextStyle(color: Colors.grey, fontSize: 12),
              ),
            ),
        ],
      ),
    );
  }
}

class _SyncStep {
  final String message;
  final bool isError;
  final bool isInfo;

  const _SyncStep({
    required this.message,
    required this.isError,
    this.isInfo = false,
  });
}

class _StepTile extends StatelessWidget {
  final _SyncStep step;

  const _StepTile({required this.step});

  @override
  Widget build(BuildContext context) {
    final color = step.isError
        ? Colors.red
        : step.isInfo
            ? Colors.grey
            : Colors.green;
    final icon = step.isError
        ? Icons.error_outline
        : step.isInfo
            ? Icons.info_outline
            : Icons.check_circle_outline;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, color: color, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              step.message,
              style: TextStyle(fontSize: 13, color: color),
            ),
          ),
        ],
      ),
    );
  }
}

/// Compact sync status widget — embed in Dashboard/Settings
class SyncStatusCard extends StatefulWidget {
  const SyncStatusCard({super.key});

  @override
  State<SyncStatusCard> createState() => _SyncStatusCardState();
}

class _SyncStatusCardState extends State<SyncStatusCard> {
  final SyncService _syncService = SyncService();
  String? _lastSyncedAt;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final ts = await _syncService.getLastSyncedAt();
    if (mounted) setState(() => _lastSyncedAt = ts);
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: const CircleAvatar(
          backgroundColor: Colors.red,
          child: Icon(Icons.sync_rounded, color: Colors.white),
        ),
        title: const Text('Sinkronisasi Data', style: TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(
          _lastSyncedAt != null
              ? 'Terakhir: $_lastSyncedAt'
              : 'Belum pernah disinkronisasi',
          style: const TextStyle(fontSize: 12),
        ),
        trailing: ElevatedButton(
          onPressed: () async {
            await showSyncSheet(context);
            _load(); // refresh timestamp after sync
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.red,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
          child: const Text('Sinkron'),
        ),
      ),
    );
  }
}