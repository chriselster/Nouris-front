import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

abstract final class AppTheme {
  static const Color _primary = Color(0xFF2E7D32); // verde-esmeralda
  static const Color _secondary = Color(0xFF66BB6A);
  static const Color _error = Color(0xFFD32F2F);

  static ThemeData get light {
    final base = ColorScheme.fromSeed(
      seedColor: _primary,
      secondary: _secondary,
      error: _error,
      brightness: Brightness.light,
    );
    return _buildTheme(base);
  }

  static ThemeData get dark {
    final base = ColorScheme.fromSeed(
      seedColor: _primary,
      secondary: _secondary,
      error: _error,
      brightness: Brightness.dark,
    );
    return _buildTheme(base);
  }

  static ThemeData _buildTheme(ColorScheme scheme) {
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      textTheme: GoogleFonts.poppinsTextTheme().apply(
        bodyColor: scheme.onSurface,
        displayColor: scheme.onSurface,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: scheme.surface,
        foregroundColor: scheme.onSurface,
        elevation: 0,
        centerTitle: false,
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        filled: true,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(48),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }
}
