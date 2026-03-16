import 'dart:convert';
import 'package:http/http.dart' as http;
import '../utils/constants.dart';
import '../models/models.dart';

class ApiService {
  final String _baseUrl = AppConstants.baseUrl;
  String? _token;

  void updateToken(String? token) {
    _token = token;
  }

  Map<String, String> get _headers {
    final headers = {'Content-Type': 'application/json'};
    if (_token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }
    return headers;
  }

  // ─── Admin Stats & Search ─────────────────────────────────────────────────

Future<Map<String, dynamic>> fetchAdminStats() async {
  final response = await http.get(
    Uri.parse('$_baseUrl/admin/stats'),
    headers: _headers,
  );
  if (response.statusCode == 200) return jsonDecode(response.body);
  throw Exception('Failed to fetch admin stats (${response.statusCode})');
}

Future<List<dynamic>> adminSearch(String query) async {
  final response = await http.get(
    Uri.parse('$_baseUrl/admin/search?q=$query'),
    headers: _headers,
  );
  if (response.statusCode == 200) return jsonDecode(response.body);
  throw Exception('Failed to search');
}

// ─── Admin Kanji ──────────────────────────────────────────────────────────

Future<List<dynamic>> fetchAdminKanji() async {
  final response = await http.get(
    Uri.parse('$_baseUrl/admin/kanji'),
    headers: _headers,
  );
  if (response.statusCode == 200) return jsonDecode(response.body);
  throw Exception('Failed to fetch admin kanji');
}

Future<void> createKanji(Map<String, dynamic> data) async {
  final response = await http.post(
    Uri.parse('$_baseUrl/admin/kanji'),
    headers: _headers,
    body: jsonEncode(data),
  );
  if (response.statusCode != 200 && response.statusCode != 201) {
    throw Exception('Failed to create kanji: ${response.body}');
  }
}

Future<void> updateKanji(String id, Map<String, dynamic> data) async {
  final response = await http.put(
    Uri.parse('$_baseUrl/admin/kanji/$id'),
    headers: _headers,
    body: jsonEncode(data),
  );
  if (response.statusCode != 200) {
    throw Exception('Failed to update kanji: ${response.body}');
  }
}

Future<void> deleteKanji(String id) async {
  final response = await http.delete(
    Uri.parse('$_baseUrl/admin/kanji/$id'),
    headers: _headers,
  );
  if (response.statusCode != 200 && response.statusCode != 204) {
    throw Exception('Failed to delete kanji');
  }
}

// ─── Admin Vocab ──────────────────────────────────────────────────────────

Future<List<dynamic>> fetchAdminKotoba() async {
  final response = await http.get(
    Uri.parse('$_baseUrl/admin/vocab'),
    headers: _headers,
  );
  if (response.statusCode == 200) return jsonDecode(response.body);
  throw Exception('Failed to fetch admin vocab');
}

Future<void> createKotoba(Map<String, dynamic> data) async {
  final response = await http.post(
    Uri.parse('$_baseUrl/admin/vocab'),
    headers: _headers,
    body: jsonEncode(data),
  );
  if (response.statusCode != 200 && response.statusCode != 201) {
    throw Exception('Failed to create vocab: ${response.body}');
  }
}

Future<void> updateKotoba(String id, Map<String, dynamic> data) async {
  final response = await http.put(
    Uri.parse('$_baseUrl/admin/vocab/$id'),
    headers: _headers,
    body: jsonEncode(data),
  );
  if (response.statusCode != 200) {
    throw Exception('Failed to update vocab: ${response.body}');
  }
}

Future<void> deleteKotoba(String id) async {
  final response = await http.delete(
    Uri.parse('$_baseUrl/admin/vocab/$id'),
    headers: _headers,
  );
  if (response.statusCode != 200 && response.statusCode != 204) {
    throw Exception('Failed to delete vocab');
  }
}

// ─── Admin Bunpo ──────────────────────────────────────────────────────────

Future<List<dynamic>> fetchAdminBunpo() async {
  final response = await http.get(
    Uri.parse('$_baseUrl/admin/bunpo'),
    headers: _headers,
  );
  if (response.statusCode == 200) return jsonDecode(response.body);
  throw Exception('Failed to fetch admin bunpo');
}

Future<void> createBunpo(Map<String, dynamic> data) async {
  final response = await http.post(
    Uri.parse('$_baseUrl/admin/bunpo'),
    headers: _headers,
    body: jsonEncode(data),
  );
  if (response.statusCode != 200 && response.statusCode != 201) {
    throw Exception('Failed to create bunpo: ${response.body}');
  }
}

Future<void> updateBunpo(String id, Map<String, dynamic> data) async {
  final response = await http.put(
    Uri.parse('$_baseUrl/admin/bunpo/$id'),
    headers: _headers,
    body: jsonEncode(data),
  );
  if (response.statusCode != 200) {
    throw Exception('Failed to update bunpo: ${response.body}');
  }
}

Future<void> deleteBunpo(String id) async {
  final response = await http.delete(
    Uri.parse('$_baseUrl/admin/bunpo/$id'),
    headers: _headers,
  );
  if (response.statusCode != 200 && response.statusCode != 204) {
    throw Exception('Failed to delete bunpo');
  }
}

  // ─── Auth ────────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> login(String identifier, String password) async {
    final response = await http.post(
      Uri.parse('$_baseUrl${AppConstants.loginEndpoint}'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'identifier': identifier, 'password': password}),
    );
    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> register(
      String username, String email, String password, int levelTarget) async {
    final response = await http.post(
      Uri.parse('$_baseUrl${AppConstants.registerEndpoint}'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'username': username,
        'email': email,
        'password': password,
        'level_target': levelTarget,
      }),
    );
    return jsonDecode(response.body);
  }

  /// Fetch current user profile from backend (requires auth)
  Future<Map<String, dynamic>> fetchMe() async {
    final response = await http.get(
      Uri.parse('$_baseUrl${AppConstants.meEndpoint}'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to fetch profile (${response.statusCode})');
  }

  Future<Map<String, dynamic>> googleLogin(String googleToken) async {
    final response = await http.post(
      Uri.parse('$_baseUrl${AppConstants.googleLoginEndpoint}'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'token': googleToken}),
    );
    return jsonDecode(response.body);
  }

  /// Step 1 — Request password reset email
  Future<Map<String, dynamic>> requestPasswordReset(String email) async {
    final response = await http.post(
      Uri.parse('$_baseUrl${AppConstants.passwordResetEndpoint}'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email}),
    );
    return jsonDecode(response.body);
  }

  /// Step 2 — Confirm reset with OTP + new password
  Future<Map<String, dynamic>> resetPasswordWithOtp({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    final response = await http.post(
      Uri.parse('$_baseUrl${AppConstants.passwordResetOtpConfirmEndpoint}'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'otp': otp,
        'new_password': newPassword,
      }),
    );
    return jsonDecode(response.body);
  }

  // ─── Kanji ───────────────────────────────────────────────────────────────

  Future<List<Kanji>> fetchKanji({int? level}) async {
    String url = '$_baseUrl${AppConstants.kanjiEndpoint}?limit=1000';
    if (level != null) url += '&level=$level';

    final response = await http
        .get(Uri.parse(url), headers: _headers)
        .timeout(const Duration(seconds: 30));
    if (response.statusCode == 200) {
      List data = jsonDecode(response.body);
      return data.map((item) => Kanji.fromJson(item)).toList();
    }
    throw Exception('Failed to fetch Kanji (${response.statusCode})');
  }

  // ─── Vocab ───────────────────────────────────────────────────────────────

  Future<List<Vocab>> fetchVocab({int? level}) async {
    String url = '$_baseUrl${AppConstants.vocabEndpoint}?limit=1000';
    if (level != null) url += '&level=$level';

    final response = await http
        .get(Uri.parse(url), headers: _headers)
        .timeout(const Duration(seconds: 30));
    if (response.statusCode == 200) {
      List data = jsonDecode(response.body);
      return data.map((item) => Vocab.fromJson(item)).toList();
    }
    throw Exception('Failed to fetch Vocab (${response.statusCode})');
  }

  // ─── Grammar ─────────────────────────────────────────────────────────────

  Future<List<Grammar>> fetchGrammar({int? level}) async {
    String url = '$_baseUrl${AppConstants.grammarEndpoint}?limit=1000';
    if (level != null) url += '&level=$level';

    final response = await http
        .get(Uri.parse(url), headers: _headers)
        .timeout(const Duration(seconds: 30));
    if (response.statusCode == 200) {
      List data = jsonDecode(response.body);
      return data.map((item) => Grammar.fromJson(item)).toList();
    }
    throw Exception('Failed to fetch Grammar (${response.statusCode})');
  }

  // ─── Practice ────────────────────────────────────────────────────────────

  Future<List<Question>> fetchQuiz({
    int? level,
    String type = 'kanji',
    int limit = 10,
  }) async {
    String url =
        '$_baseUrl${AppConstants.practiceGenerateEndpoint}?type=$type&limit=$limit';
    if (level != null) url += '&level=$level';

    final response =
        await http.get(Uri.parse(url), headers: _headers);
    if (response.statusCode == 200) {
      List data = jsonDecode(response.body);
      return data.map((item) => Question.fromJson(item)).toList();
    }
    throw Exception('Failed to generate quiz');
  }

  Future<void> submitQuiz(List<QuizResult> results) async {
    final response = await http.post(
      Uri.parse('$_baseUrl${AppConstants.practiceSubmitEndpoint}'),
      headers: _headers,
      body: jsonEncode({
        'results': results.map((r) => r.toJson()).toList(),
      }),
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to submit quiz');
    }
  }

  // ─── Analytics ───────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> fetchAnalytics() async {
    final response = await http.get(
      Uri.parse('$_baseUrl${AppConstants.analyticsEndpoint}'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to fetch analytics');
  }
}