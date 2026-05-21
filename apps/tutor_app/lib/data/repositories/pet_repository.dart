import 'package:supabase_flutter/supabase_flutter.dart';

/// Stub — será implementado na feature pet_profile.
final class PetRepository {
  const PetRepository(this._client);
  final SupabaseClient _client;

  /// Retorna true se o usuário autenticado possui ao menos um pet.
  Future<bool> currentUserHasPets() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return false;
    final result = await _client
        .from('pets')
        .select('id')
        .eq('owner_id', userId)
        .limit(1);
    return (result as List).isNotEmpty;
  }
}
