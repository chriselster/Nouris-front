import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/errors/app_error.dart';

/// Abstrai todas as operações de autenticação do Supabase.
final class AuthRepository {
  const AuthRepository(this._client);
  final SupabaseClient _client;

  /// true para Windows, Linux e macOS (plataformas desktop).
  static bool get _isDesktop =>
      defaultTargetPlatform == TargetPlatform.windows ||
      defaultTargetPlatform == TargetPlatform.linux ||
      defaultTargetPlatform == TargetPlatform.macOS;

  User? get currentUser => _client.auth.currentUser;

  /// Emite [User] sempre que o Supabase confirma uma sessão (ex: retorno OAuth).
  Stream<User> get onSignedIn => _client.auth.onAuthStateChange
      .where((d) => d.event == AuthChangeEvent.signedIn && d.session != null)
      .map((d) => d.session!.user);

  /// Em desktop + debug, faz login com usuário de desenvolvimento via e-mail/senha
  /// em vez de abrir um fluxo OAuth (que exigiria deep link nativo).
  static bool get _useDevLogin => _isDesktop && kDebugMode;

  static const _devEmail = 'tutor@teste.com';
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
        redirectTo: 'com.nouris.tutor://login-callback',
        authScreenLaunchMode: LaunchMode.platformDefault,
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

  /// Garante que existe um registro em tutor_profiles para o usuário logado.
  /// Operação idempotente — segura de chamar a cada sessão confirmada.
  /// Usa ignoreDuplicates para não sobrescrever perfil já existente.
  Future<void> ensureTutorProfile() async {
    final user = _client.auth.currentUser;
    if (user == null) return;

    // Tenta extrair nome do provider OAuth (Google/Apple enviam em userMetadata).
    final displayName =
        (user.userMetadata?['full_name'] as String?)?.trim() ??
        (user.userMetadata?['name'] as String?)?.trim();

    await _client
        .from('tutor_profiles')
        .upsert(
          {
            'user_id': user.id,
            if (displayName != null && displayName.isNotEmpty)
              'display_name': displayName,
          },
          onConflict: 'user_id',
          ignoreDuplicates:
              true, // Não sobrescreve perfil já editado pelo usuário
        );
  }

  Future<void> signOut() async {
    await _client.auth.signOut();
  }
}
