import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../providers/auth_provider.dart';
import '../services/sync_service.dart';
import '../services/api_service.dart';
import '../services/database_helper.dart';
import 'admin/admin_dashboard_screen.dart';


class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiService _apiService = ApiService();
  final SyncService _syncService = SyncService();
  bool _isSyncing = false;
  String _syncStatus = '';
  String? _lastSyncedAt;
  Map<String, dynamic>? _analytics;
  bool _isLoadingAnalytics = true;

  @override
  void initState() {
    super.initState();
    _loadAnalytics();
    _loadLastSynced();
    // Untuk guest, coba sinkronisasi awal supaya data kanji/kotoba/bunpo tersedia seperti di web.
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      if (auth.isGuest) {
        await _handleSync();
      }
    });
  }

  Future<void> _loadLastSynced() async {
    final ts = await DatabaseHelper.instance.getSyncMeta('last_synced_at');
    if (mounted) setState(() => _lastSyncedAt = ts);
  }

  Future<void> _loadAnalytics() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    if (auth.isGuest) {
      setState(() => _isLoadingAnalytics = false);
      return;
    }
    
    setState(() => _isLoadingAnalytics = true);
    try {
      final token = auth.token;
      _apiService.updateToken(token);
      final data = await _apiService.fetchAnalytics();
      setState(() => _analytics = data);
    } catch (e) {
      print('Failed to load analytics: $e');
    } finally {
      setState(() => _isLoadingAnalytics = false);
    }
  }


  Future<void> _handleSync() async {
    // Check internet first
    final connectivityResult = await Connectivity().checkConnectivity();
    final isOnline = !connectivityResult.contains(ConnectivityResult.none);
    if (!isOnline) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Row(
              children: [
                Icon(Icons.wifi_off, color: Colors.white),
                SizedBox(width: 12),
                Text('Tidak ada koneksi internet. Sinkronisasi dibatalkan.'),
              ],
            ),
            backgroundColor: Colors.red,
            duration: Duration(seconds: 3),
          ),
        );
      }
      return;
    }

    final auth = Provider.of<AuthProvider>(context, listen: false);
    setState(() {
      _isSyncing = true;
      _syncStatus = 'Memulai sinkronisasi...';
    });
    try {
      await _syncService.syncAllData(
        token: auth.token,
        onProgress: (status) {
          if (mounted) setState(() => _syncStatus = status);
        },
      );
      await _loadLastSynced();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Row(children: [Icon(Icons.check, color: Colors.white), SizedBox(width: 12), Text('Sinkronisasi berhasil! Data disimpan ke lokal.')]),
          backgroundColor: Colors.green,
        ));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Sinkronisasi gagal: $e'), backgroundColor: Colors.red));
      }
    } finally {
      if (mounted) setState(() => _isSyncing = false);
    }
  }

  Future<void> _refreshAll() async {
    await _handleSync();
    await _loadAnalytics();
  }


  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('JBook Dashboard'),
        actions: [
          if (!auth.isGuest) ...[
            IconButton(
              icon: _isSyncing ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.sync),
              onPressed: _isSyncing ? null : _handleSync,
            ),
          ],
          IconButton(
            icon: _isSyncing 
              ? SizedBox(
                  width: 20, 
                  height: 20, 
                  child: CircularProgressIndicator(
                    strokeWidth: 2, 
                    color: Colors.red.shade900,
                  ),
                ) 
              : Icon(auth.isGuest ? Icons.login : Icons.logout),
            onPressed: _isSyncing
                ? null
                : () {
                    if (auth.isGuest) {
                      Navigator.pushNamed(context, '/login');
                    } else {
                      auth.logout();
                    }
                  },
          ),
        ],
      ),
      body: Stack(
        children: [
          RefreshIndicator(
            onRefresh: _refreshAll,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Halo, ${user?.username ?? "User"}!',
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),

              const SizedBox(height: 8),
              Text(
                auth.isGuest ? 'Mode Tamu' : 'Level Target: N${user?.levelTarget ?? 5}',
                style: TextStyle(color: Colors.grey.shade600),
              ),
              const SizedBox(height: 24),
              if (auth.isGuest)
                _GuestPrompt()
              else
                _AnalyticsCard(analytics: _analytics, isLoading: _isLoadingAnalytics),
              const SizedBox(height: 24),


              const Text('Mulai Belajar', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                children: [
                   _MenuCard(
                    title: 'Kanji',
                    icon: Icons.translate,
                    color: Colors.red,
                    onTap: () => Navigator.pushNamed(context, '/kanji'),
                  ),
                  _MenuCard(
                    title: 'Kotoba',
                    icon: Icons.menu_book,
                    color: Colors.orange,
                    onTap: () => Navigator.pushNamed(context, '/vocab'),
                  ),
                  _MenuCard(
                    title: 'Bunpo',
                    icon: Icons.history_edu,
                    color: Colors.blue,
                    onTap: () => Navigator.pushNamed(context, '/grammar'),
                  ),
                  _MenuCard(
                    title: 'Kana',
                    icon: Icons.grid_view,
                    color: Colors.green,
                    onTap: () => Navigator.pushNamed(context, '/kana'),
                  ),
                ],
              ),
              if (user != null && user.isAdmin) ...[
                const SizedBox(height: 32),
                const Text('Panel Admin', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                Card(
                  color: Colors.red.shade900,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: ListTile(
                    leading: const Icon(Icons.admin_panel_settings, color: Colors.white, size: 32),
                    title: const Text('Kelola Konten & User', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    subtitle: const Text('Akses penuh ke semua data JBook', style: TextStyle(color: Colors.white70)),
                    trailing: const Icon(Icons.arrow_forward_ios, color: Colors.white, size: 16),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const AdminDashboardScreen()),
                      );
                    },
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
      if (_isSyncing)
        Positioned(
          bottom: 100,
          left: 24,
          right: 24,
          child: Card(
            elevation: 8,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Row(
                children: [
                  const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      _syncStatus,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
    ],
  ),


      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          await Navigator.pushNamed(context, '/practice');
          if (!mounted) return;
          await _loadAnalytics();
        },
        label: const Text('Latihan'),
        icon: const Icon(Icons.play_arrow),
        backgroundColor: Colors.red,
        foregroundColor: Colors.white,
      ),

    );
  }
}

class _AnalyticsCard extends StatelessWidget {
  final Map<String, dynamic>? analytics;
  final bool isLoading;
  const _AnalyticsCard({this.analytics, required this.isLoading});

  @override
  Widget build(BuildContext context) {
    final total = analytics?['total_attempts']?.toString() ?? '0';
    final accuracy = analytics?['accuracy']?.toString() ?? '0.0';

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            const Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Progres Belajar', style: TextStyle(fontWeight: FontWeight.bold)),
                Icon(Icons.trending_up, color: Colors.green),
              ],
            ),
            const SizedBox(height: 20),
            if (isLoading)
              const Center(child: CircularProgressIndicator())
            else
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _StatItem(label: 'Total Latihan', value: total),
                  _StatItem(label: 'Akurasi', value: '$accuracy%'),
                ],
              ),
          ],
        ),
      ),
    );
  }
}


class _StatItem extends StatelessWidget {
  final String label;
  final String value;
  const _StatItem({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
        Text(label, style: const TextStyle(color: Colors.grey)),
      ],
    );
  }
}

class _MenuCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _MenuCard({required this.title, required this.icon, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Card(
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 48, color: color),
            const SizedBox(height: 12),
            Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}

class _GuestPrompt extends StatelessWidget {
  const _GuestPrompt();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      margin: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.red.shade100),
      ),
      child: Column(
        children: [
          const Text(
            'Belajar tanpa batas dengan membuat akun!',
            textAlign: TextAlign.center,
            style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red, fontSize: 16),
          ),
          const SizedBox(height: 12),
          const Text(
            'Simpan progres belajarmu, akses analitik, dan sinkronisasi data ke cloud.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey),
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: () => Navigator.pushNamed(context, '/login'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 48),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('LOGIN / DAFTAR SEKARANG', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}

