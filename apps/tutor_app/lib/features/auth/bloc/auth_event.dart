import 'package:equatable/equatable.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

// ── Events ────────────────────────────────────────────────────────────────────

sealed class AuthEvent extends Equatable {
  const AuthEvent();
  @override
  List<Object?> get props => [];
}

final class AuthCheckSession extends AuthEvent {
  const AuthCheckSession();
}

final class AuthSignInWithGoogle extends AuthEvent {
  const AuthSignInWithGoogle();
}

final class AuthSignInWithApple extends AuthEvent {
  const AuthSignInWithApple();
}

final class AuthSignOut extends AuthEvent {
  const AuthSignOut();
}

// ── States ────────────────────────────────────────────────────────────────────

sealed class AuthState extends Equatable {
  const AuthState();
  @override
  List<Object?> get props => [];
}

final class AuthInitial extends AuthState {
  const AuthInitial();
}

final class AuthLoading extends AuthState {
  const AuthLoading();
}

final class AuthAuthenticated extends AuthState {
  const AuthAuthenticated(this.user);
  final User user;
  @override
  List<Object?> get props => [user.id];
}

final class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated();
}

final class AuthFailure extends AuthState {
  const AuthFailure(this.message);
  final String message;
  @override
  List<Object?> get props => [message];
}
