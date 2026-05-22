import 'dart:io';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:device_preview/device_preview.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hydrated_bloc/hydrated_bloc.dart';
import 'package:path_provider/path_provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'core/di/injection.dart';
import 'core/observers/app_bloc_observer.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'data/repositories/auth_repository.dart';
import 'data/repositories/sync_repository.dart';
import 'features/auth/bloc/auth_bloc.dart';
import 'logic/sync_bloc/sync_bloc.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // ── HydratedBloc storage ──────────────────────────────────────────
  final storageDir = await getApplicationDocumentsDirectory();
  HydratedBloc.storage = await HydratedStorage.build(
    storageDirectory: HydratedStorageDirectory(storageDir.path),
  );

  // ── BLoC Observer global ──────────────────────────────────────────
  Bloc.observer = const AppBlocObserver();

  // ── Supabase ──────────────────────────────────────────────────────
  await Supabase.initialize(
    url: const String.fromEnvironment(
      'SUPABASE_URL',
      defaultValue: 'https://jjbyuvvcksvvhglocfrw.supabase.co',
    ),
    anonKey: const String.fromEnvironment(
      'SUPABASE_ANON_KEY',
      defaultValue: 'sb_publishable_TjqZEG7NAXntkYfvQFctrg_vGm7us_e',
    ),
  );

  // ── Dependency Injection ──────────────────────────────────────────
  await configureDependencies();

  runApp(
    DevicePreview(
      enabled: !kReleaseMode && !(Platform.isAndroid || Platform.isIOS),
      builder: (context) => const NourisApp(),
    ),
  );
}

final class NourisApp extends StatelessWidget {
  const NourisApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<AuthBloc>(
          create: (_) => AuthBloc(authRepository: sl<AuthRepository>()),
        ),
        BlocProvider<SyncBloc>(
          create: (_) => SyncBloc(
            syncRepository: sl<SyncRepository>(),
            connectivity: Connectivity(),
          ),
        ),
      ],
      child: MaterialApp.router(
        title: 'Nouris',
        theme: AppTheme.light,
        darkTheme: AppTheme.dark,
        themeMode: ThemeMode.system,
        routerConfig: AppRouter.router,
        debugShowCheckedModeBanner: false,
        locale: DevicePreview.locale(context),
        builder: DevicePreview.appBuilder,
      ),
    );
  }
}
