import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'providers/auth_provider.dart';
import 'dart:io';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';

import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/kanji_list_screen.dart';
import 'screens/vocab_list_screen.dart';
import 'screens/grammar_list_screen.dart';
import 'screens/kana_screen.dart';
import 'screens/practice_setup_screen.dart';
import 'screens/welcome_screen.dart';
import 'screens/main_navigation_screen.dart';
import 'screens/forgot_password_screen.dart';
import 'screens/reset_password_screen.dart';
import 'screens/profile_screen.dart';

void main() {
  if (Platform.isWindows || Platform.isLinux) {
    sqfliteFfiInit();
    databaseFactory = databaseFactoryFfi;
  }
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: const JBookApp(),
    ),
  );
}

class JBookApp extends StatelessWidget {
  const JBookApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'JBook',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.red,
          primary: Colors.red.shade700,
          secondary: Colors.redAccent,
        ),
        useMaterial3: true,
        textTheme: GoogleFonts.interTextTheme(),
      ),
      home: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          if (auth.isAuthenticated || auth.isGuest) {
            return const MainNavigationScreen();
          }
          return const WelcomeScreen();
        },
      ),
      routes: {
        '/login': (context) => const LoginScreen(),
        '/register': (context) => const RegisterScreen(),
        '/forgot-password': (context) => const ForgotPasswordScreen(),
        '/reset-password-confirm': (context) {
          final email = ModalRoute.of(context)?.settings.arguments as String?;
          return ResetPasswordConfirmScreen(email: email);
        },
        '/dashboard': (context) => const DashboardScreen(),
        '/kanji': (context) => const KanjiListScreen(),
        '/vocab': (context) => const VocabListScreen(),
        '/grammar': (context) => const GrammarListScreen(),
        '/kana': (context) => const KanaScreen(),
        '/practice': (context) => const PracticeSetupScreen(),
        '/profile': (context) => const ProfileScreen(),
        '/welcome': (context) => const WelcomeScreen(),
      },
    );
  }
}