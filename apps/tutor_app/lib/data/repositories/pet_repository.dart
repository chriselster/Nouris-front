import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/pet_summary.dart';

final class PetRepository {
  const PetRepository(this._client);
  final SupabaseClient _client;

  /// Retorna os pets do tutor autenticado com o nome do vet vinculado.
  Future<List<PetSummary>> getPetsForCurrentUser() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return [];

    // 1. Pets do tutor
    final petsData = await _client
        .from('pets')
        .select('id, name, species, breed, status, vet_id')
        .eq('tutor_user_id', userId)
        .order('created_at');

    final petsList = List<Map<String, dynamic>>.from(petsData as List);

    // 2. Busca os nomes dos vets em um único round-trip
    final vetIds = petsList
        .map((p) => p['vet_id'] as String?)
        .whereType<String>()
        .toSet()
        .toList();

    final vetNames = <String, String>{};
    if (vetIds.isNotEmpty) {
      final vetsData = await _client
          .from('vet_profiles')
          .select('user_id, display_name')
          .inFilter('user_id', vetIds);
      for (final v in List<Map<String, dynamic>>.from(vetsData as List)) {
        final uid = v['user_id'] as String;
        final name = v['display_name'] as String?;
        if (name != null && name.isNotEmpty) vetNames[uid] = name;
      }
    }

    return petsList.map((p) {
      final vetId = p['vet_id'] as String?;
      return PetSummary(
        id: p['id'] as String,
        name: p['name'] as String,
        species: p['species'] as String? ?? 'Animal',
        breed: p['breed'] as String?,
        vetName: vetId != null ? vetNames[vetId] : null,
        status: p['status'] as String? ?? 'active',
      );
    }).toList();
  }

  /// Retorna true se o tutor autenticado possui ao menos um pet.
  Future<bool> currentUserHasPets() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return false;
    final result = await _client
        .from('pets')
        .select('id')
        .eq('tutor_user_id', userId)
        .limit(1);
    return (result as List).isNotEmpty;
  }
}
