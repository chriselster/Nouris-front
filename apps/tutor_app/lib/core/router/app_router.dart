import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../data/repositories/pet_repository.dart';
import '../../features/auth/bloc/auth_bloc.dart';
import '../../features/auth/pages/link_qr_page.dart';
import '../../features/auth/pages/login_page.dart';
import '../../features/home/pages/home_shell_page.dart';
import '../../features/home/pages/home_tab_page.dart';
import '../../features/onboarding/pages/onboarding_pet_page.dart';
import '../../features/pets/cubit/pets_cubit.dart';
import '../../features/pets/pages/pets_tab_page.dart';
import '../../features/splash/pages/splash_page.dart';
import '../di/injection.dart';

abstract final class AppRouter {
  static final _rootNavigatorKey = GlobalKey<NavigatorState>();

  static GoRouter get router => GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/splash',
    redirect: _redirect,
    routes: [
      GoRoute(path: '/splash', builder: (context, state) => const SplashPage()),
      GoRoute(path: '/login', builder: (context, state) => const LoginPage()),
      GoRoute(
        path: '/onboarding/pet',
        builder: (context, state) => const OnboardingPetPage(),
      ),
      GoRoute(
        path: '/link-qr',
        builder: (context, state) => const LinkQrPage(),
      ),
      // Shell com BottomNavigationBar (3 abas + FAB)
      ShellRoute(
        builder: (context, state, child) => HomeShellPage(child: child),
        routes: [
          GoRoute(path: '/home', builder: (_, s) => const HomeTabPage()),
          GoRoute(
            path: '/pets',
            builder: (_, s) => BlocProvider(
              create: (_) => PetsCubit(sl<PetRepository>()),
              child: const PetsTabPage(),
            ),
          ),
          GoRoute(path: '/profile', builder: (_, s) => const _ProfileTab()),
        ],
      ),
    ],
  );

  /// Lógica de redirecionamento baseada no [AuthState].
  static String? _redirect(BuildContext context, GoRouterState state) {
    final authState = context.read<AuthBloc>().state;
    final location = state.matchedLocation;

    // Enquanto verifica sessão, mostra splash.
    if (authState is AuthInitial || authState is AuthLoading) {
      return location == '/splash' ? null : '/splash';
    }

    // Não autenticado → forçar login.
    if (authState is AuthUnauthenticated || authState is AuthFailure) {
      return location == '/login' ? null : '/login';
    }

    // Autenticado e está no splash/login → ir para home.
    if (authState is AuthAuthenticated) {
      if (location == '/splash' || location == '/login') {
        return '/home';
      }
    }

    return null;
  }
}

// Placeholders internos — substituídos quando as features forem implementadas.

class _ProfileTab extends StatelessWidget {
  const _ProfileTab();
  @override
  Widget build(BuildContext context) =>
      const Center(child: Text('Perfil — Em construção'));
}
