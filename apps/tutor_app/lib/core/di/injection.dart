import 'package:get_it/get_it.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../data/repositories/auth_repository.dart';
import '../../data/repositories/diet_repository.dart';
import '../../data/repositories/feces_log_repository.dart';
import '../../data/repositories/pet_repository.dart';
import '../../data/repositories/supabase_sync_repository.dart';
import '../../data/repositories/sync_repository.dart';
import '../../data/repositories/weight_log_repository.dart';

final GetIt sl = GetIt.instance;

Future<void> configureDependencies() async {
  // ── Supabase client (singleton já inicializado em main.dart) ──────
  sl.registerLazySingleton<SupabaseClient>(() => Supabase.instance.client);

  // ── Repositories (singletons) ─────────────────────────────────────
  sl.registerLazySingleton<AuthRepository>(
    () => AuthRepository(sl<SupabaseClient>()),
  );
  sl.registerLazySingleton<PetRepository>(
    () => PetRepository(sl<SupabaseClient>()),
  );
  sl.registerLazySingleton<WeightLogRepository>(
    () => WeightLogRepository(sl<SupabaseClient>()),
  );
  sl.registerLazySingleton<FecesLogRepository>(
    () => FecesLogRepository(sl<SupabaseClient>()),
  );
  sl.registerLazySingleton<DietRepository>(
    () => DietRepository(sl<SupabaseClient>()),
  );
  sl.registerLazySingleton<SyncRepository>(
    () => SupabaseSyncRepository(
      weightLogRepository: sl<WeightLogRepository>(),
      fecesLogRepository: sl<FecesLogRepository>(),
      client: sl<SupabaseClient>(),
    ),
  );
}
