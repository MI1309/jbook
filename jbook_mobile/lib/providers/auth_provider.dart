import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';
import 'package:google_sign_in_all_platforms/google_sign_in_all_platforms.dart';
import '../models/models.dart';


import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  User? _user;
  String? _token;
  bool _isLoading = false;
  bool _isGuest = true; // default: tampilkan mode tamu di awal

  final GoogleSignIn _googleSignIn = GoogleSignIn(
    params: const GoogleSignInParams(
      clientId: '257700695810-f7auvqn6f37pqtlslqo40o9q1r0jue6t.apps.googleusercontent.com',
      scopes: ['email', 'profile', 'openid'],
      redirectPort: 8000,
    ),

  );




  User? get user => _user;
  String? get token => _token;
  bool get isLoading => _isLoading;
  bool get isGuest => _isGuest;
  bool get isAuthenticated => _token != null && !JwtDecoder.isExpired(_token!);


  AuthProvider() {
    _loadSession();
  }

  Future<void> _loadSession() async {
    try {
      final file = await _getSessionFile();
      if (await file.exists()) {
        final content = await file.readAsString();
        final data = jsonDecode(content);
        _token = data['token'];
        _user = User.fromJson(data['user']);
        _isGuest = false;
        _apiService.updateToken(_token);
        notifyListeners();
      }
    } catch (e) {
      print('Failed to load session: $e');
    }
  }

  Future<void> _saveSession(String token, Map<String, dynamic> userJson) async {
    final file = await _getSessionFile();
    await file.writeAsString(jsonEncode({
      'token': token,
      'user': userJson,
    }));
  }

  Future<File> _getSessionFile() async {
    final dir = await getApplicationDocumentsDirectory();
    return File('${dir.path}/session.json');
  }

  Future<bool> login(String identifier, String password) async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _apiService.login(identifier, password);

      if (response.containsKey('access')) {
        _token = response['access'];
        _user = User.fromJson(response['user']);
        _isGuest = false;
        _apiService.updateToken(_token);
        await _saveSession(_token!, response['user']);
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      print('Login error: $e');
    }
    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> register(String username, String email, String password, int levelTarget) async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _apiService.register(username, email, password, levelTarget);
      if (response.containsKey('access')) {
        _token = response['access'];
        _user = User.fromJson(response['user']);
        _isGuest = false;
        _apiService.updateToken(_token);
        await _saveSession(_token!, response['user']);
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      print('Register error: $e');
    }
    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<void> logout() async {
    _token = null;
    _user = null;
    _isGuest = true;
    _apiService.updateToken(null);
    try {
      await _googleSignIn.signOut();
    } catch (_) {}
    final file = await _getSessionFile();
    if (await file.exists()) await file.delete();
    notifyListeners();
  }

  Future<bool> loginWithGoogle() async {
    _isLoading = true;
    notifyListeners();
    try {
      final GoogleSignInCredentials? googleToken = await _googleSignIn.signIn();

      if (googleToken == null) {
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final String idToken = googleToken.idToken ?? '';
      if (idToken.isEmpty) {
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final response = await _apiService.googleLogin(idToken);
      if (response.containsKey('access')) {
        _token = response['access'];
        _user = User.fromJson(response['user']);
        _apiService.updateToken(_token);
        await _saveSession(_token!, response['user']);
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e, stack) {
      print('Google login error: $e');
      print('Stack trace: $stack');
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }



  void setGuestMode(bool value) {
    _isGuest = value;
    notifyListeners();
  }

  /// Sync user profile from backend and update local state
  Future<bool> refreshProfile() async {
    if (_token == null) return false;
    try {
      _apiService.updateToken(_token);
      final data = await _apiService.fetchMe();
      _user = User.fromJson(data);
      await _saveSession(_token!, data);
      notifyListeners();
      return true;
    } catch (e) {
      print('Refresh profile error: $e');
      return false;
    }
  }
}

