import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../bloc/auth_bloc.dart';

/// Tela de login com Google e Apple Sign-In via Supabase OAuth.
final class LoginPage extends StatelessWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthFailure) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message),
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
          );
        }
        // AuthAuthenticated → o GoRouter redirect cuida da navegação.
      },
      child: Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Logo / título
                Text(
                  'Nouris',
                  style: Theme.of(context).textTheme.displayMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Nutrição e monitoramento para seu pet',
                  style: Theme.of(context).textTheme.bodyMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 48),

                // Botão Google
                BlocBuilder<AuthBloc, AuthState>(
                  builder: (context, state) {
                    final isLoading = state is AuthLoading;
                    return FilledButton.icon(
                      onPressed: isLoading
                          ? null
                          : () => context.read<AuthBloc>().add(
                              const AuthSignInWithGoogle(),
                            ),
                      icon: const Icon(Icons.login),
                      label: const Text('Entrar com Google'),
                    );
                  },
                ),
                const SizedBox(height: 12),

                // Botão Apple
                BlocBuilder<AuthBloc, AuthState>(
                  builder: (context, state) {
                    final isLoading = state is AuthLoading;
                    return FilledButton.tonal(
                      onPressed: isLoading
                          ? null
                          : () => context.read<AuthBloc>().add(
                              const AuthSignInWithApple(),
                            ),
                      child: const Text('Entrar com Apple'),
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
