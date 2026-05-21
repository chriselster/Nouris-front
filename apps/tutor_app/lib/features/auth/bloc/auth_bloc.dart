import 'package:bloc/bloc.dart';

import '../../../core/errors/app_error.dart';
import '../../../data/repositories/auth_repository.dart';
import 'auth_event.dart';

export 'auth_event.dart';

/// Gerencia o ciclo de autenticação do Tutor.
///
/// Fluxo OAuth:
/// 1. Dispara [signInWithOAuth] via [supabase_flutter] (abre WebView nativa).
/// 2. O Supabase redireciona de volta ao app via deep link (app_links).
/// 3. O [supabase_flutter] atualiza a sessão automaticamente.
/// 4. [AuthCheckSession] é chamado ao retornar ao app para confirmar o estado.
final class AuthBloc extends Bloc<AuthEvent, AuthState> {
  AuthBloc({required this._authRepository}) : super(const AuthInitial()) {
    on<AuthCheckSession>(_onCheckSession);
    on<AuthSignInWithGoogle>(_onSignInWithGoogle);
    on<AuthSignInWithApple>(_onSignInWithApple);
    on<AuthSignOut>(_onSignOut);
  }

  final AuthRepository _authRepository;

  Future<void> _onCheckSession(
    AuthCheckSession event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    final user = _authRepository.currentUser;
    if (user != null) {
      emit(AuthAuthenticated(user));
    } else {
      emit(const AuthUnauthenticated());
    }
  }

  Future<void> _onSignInWithGoogle(
    AuthSignInWithGoogle event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    try {
      await _authRepository.signInWithGoogle();
      // A sessão é confirmada pelo deep link; AuthCheckSession será chamado
      // após retorno ao app via app_links.
    } on AuthError catch (e) {
      emit(AuthFailure(e.message));
    } on AppError catch (e) {
      emit(AuthFailure(e.message));
    } catch (_) {
      emit(const AuthFailure('Erro ao fazer login com Google.'));
    }
  }

  Future<void> _onSignInWithApple(
    AuthSignInWithApple event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    try {
      await _authRepository.signInWithApple();
    } on AuthError catch (e) {
      emit(AuthFailure(e.message));
    } on AppError catch (e) {
      emit(AuthFailure(e.message));
    } catch (_) {
      emit(const AuthFailure('Erro ao fazer login com Apple.'));
    }
  }

  Future<void> _onSignOut(AuthSignOut event, Emitter<AuthState> emit) async {
    await _authRepository.signOut();
    emit(const AuthUnauthenticated());
  }
}
