class AppConstants {
  /// Configure API URL at build/run time:
  /// `flutter run --dart-define=API_BASE_URL=http://127.0.0.1:8000/api`
  /// Fallback keeps the current production URL.
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://imronm.pythonanywhere.com/api',
  );
  
  // Auth endpoints
  static const String loginEndpoint = '/auth/login';
  static const String registerEndpoint = '/auth/register';
  static const String googleLoginEndpoint = '/auth/google';
  static const String meEndpoint = '/auth/me';

  
  // Content endpoints
  static const String kanjiEndpoint = '/content/kanji';
  static const String vocabEndpoint = '/content/vocab';
  static const String grammarEndpoint = '/content/grammar';
  
  // Practice endpoints
  static const String practiceGenerateEndpoint = '/learning/practice/generate';
  static const String practiceSubmitEndpoint = '/learning/practice/submit';
  static const String analyticsEndpoint = '/learning/practice/analytics';

  // Password Reset (OTP)
  static const String passwordResetEndpoint = '/auth/password-reset';
  static const String passwordResetOtpConfirmEndpoint = '/auth/password-reset-otp';
}
