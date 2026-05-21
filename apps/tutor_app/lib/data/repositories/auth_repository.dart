import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/errors/app_error.dart';

/// Abstrai todas as operações de autenticação do Supabase.
final class AuthRepository {
  const AuthRepository(this._client);
  final SupabaseClient _client;

  /// Deep link registrado no app para mobile (iOS/Android).
  static const _mobileRedirectUrl = String.fromEnvironment(
    'SUPABASE_REDIRECT_URL',
  );

  /// true para Windows, Linux e macOS (plataformas desktop).
  static bool get _isDesktop =>
      defaultTargetPlatform == TargetPlatform.windows ||
      defaultTargetPlatform == TargetPlatform.linux ||
      defaultTargetPlatform == TargetPlatform.macOS;
  static String? get _redirectTo {
    if (kIsWeb || _isDesktop || _mobileRedirectUrl.isEmpty) return null;
    return _mobileRedirectUrl;
  }

  User? get currentUser => _client.auth.currentUser;

  /// Em desktop + debug, faz login com usuário de desenvolvimento via e-mail/senha
  /// em vez de abrir um fluxo OAuth (que exigiria deep link nativo).
  static bool get _useDevLogin => _isDesktop && kDebugMode;

  static const _devEmail = 'dev@teste.com';
  static const _devPassword = '1234';

  /// Login com Google via OAuth do Supabase (sem SDK nativo do Google).
  Future<void> signInWithGoogle() => _signIn(OAuthProvider.google);

  /// Login com Apple via OAuth do Supabase (sem SDK nativo da Apple).
  Future<void> signInWithApple() => _signIn(OAuthProvider.apple);

  Future<void> _signIn(OAuthProvider provider) async {
    if (_useDevLogin) {
      await _signInWithDevCredentials();
      return;
    }

    try {
      await _client.auth.signInWithOAuth(
        provider,
        redirectTo: _redirectTo,
        authScreenLaunchMode: kIsWeb
            ? LaunchMode.platformDefault
            : LaunchMode.externalApplication,
      );
    } on AuthException catch (e) {
      throw AuthError(e.message);
    } catch (_) {
      throw const NetworkError();
    }
  }

  /// Autentica com e-mail/senha usando o usuário de dev (somente desktop + debug).
  Future<void> _signInWithDevCredentials() async {
    try {
      await _client.auth.signInWithPassword(
        email: _devEmail,
        password: _devPassword,
      );
    } on AuthException catch (e) {
      throw AuthError(e.message);
    } catch (_) {
      throw const NetworkError();
    }
  }

  Future<void> signOut() async {
    await _client.auth.signOut();
  }
}
