import '../../core/errors/app_error.dart';
import '../models/pending_action.dart';

/// Despacha ações pendentes para o Supabase quando a conexão é restaurada.
///
/// Cada [PendingActionType] é roteado para o repositório específico.
/// Lança [AppError] em caso de falha — o [SyncBloc] gerencia retries.
abstract interface class SyncRepository {
  Future<void> dispatch(PendingAction action);
}
