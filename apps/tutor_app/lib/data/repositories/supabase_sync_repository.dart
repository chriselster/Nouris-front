import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/errors/app_error.dart';
import '../models/pending_action.dart';
import 'feces_log_repository.dart';
import 'sync_repository.dart';
import 'weight_log_repository.dart';

/// Implementação concreta de [SyncRepository].
/// Roteia cada [PendingAction] para o repositório correto.
final class SupabaseSyncRepository implements SyncRepository {
  const SupabaseSyncRepository({
    required this._weightLogRepository,
    required this._fecesLogRepository,
    required this._client,
  });

  // ignore: unused_field
  final WeightLogRepository _weightLogRepository;
  // ignore: unused_field
  final FecesLogRepository _fecesLogRepository;
  final SupabaseClient _client;

  @override
  Future<void> dispatch(PendingAction action) async {
    switch (action.type) {
      case PendingActionType.weightLog:
        await _dispatchWeightLog(action.payload);
      case PendingActionType.fecesLog:
        await _dispatchFecesLog(action.payload);
      case PendingActionType.dietComplianceLog:
        await _dispatchDietCompliance(action.payload);
    }
  }

  Future<void> _dispatchWeightLog(Map<String, dynamic> payload) async {
    try {
      await _client.from('weight_logs').insert(payload);
    } on PostgrestException catch (e) {
      throw ServerError(e.message);
    } catch (_) {
      throw const NetworkError();
    }
  }

  Future<void> _dispatchFecesLog(Map<String, dynamic> payload) async {
    try {
      await _client.from('feces_logs').insert(payload);
    } on PostgrestException catch (e) {
      throw ServerError(e.message);
    } catch (_) {
      throw const NetworkError();
    }
  }

  Future<void> _dispatchDietCompliance(Map<String, dynamic> payload) async {
    try {
      await _client.from('diet_compliance_logs').insert(payload);
    } on PostgrestException catch (e) {
      throw ServerError(e.message);
    } catch (_) {
      throw const NetworkError();
    }
  }
}
