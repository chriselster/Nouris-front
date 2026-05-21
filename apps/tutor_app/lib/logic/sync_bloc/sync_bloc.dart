import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:hydrated_bloc/hydrated_bloc.dart';

import '../../core/errors/app_error.dart';
import '../../data/models/pending_action.dart';
import '../../data/repositories/sync_repository.dart';
import 'sync_event.dart';

export 'sync_event.dart';

// ── Internal events (privados a este arquivo) ────────────────────────────────

final class _SyncItemSucceeded extends SyncEvent {
  const _SyncItemSucceeded(this.actionId);
  final String actionId;
  @override
  List<Object?> get props => [actionId];
}

final class _SyncItemFailed extends SyncEvent {
  const _SyncItemFailed(this.actionId);
  final String actionId;
  @override
  List<Object?> get props => [actionId];
}

/// Número máximo de tentativas antes de mover para a dead letter queue.
const int _maxRetries = 3;

/// Gerencia a fila de ações offline e sincroniza com o Supabase
/// quando a conectividade é restaurada.
///
/// Estado persistido via [HydratedBloc] — sobrevive a reinicializações do app.
final class SyncBloc extends HydratedBloc<SyncEvent, SyncState> {
  SyncBloc({required this._syncRepository, required Connectivity connectivity})
    : super(const SyncState()) {
    on<SyncEnqueueAction>(_onEnqueue);
    on<SyncConnectivityRestored>(_onConnectivityRestored);
    on<_SyncItemSucceeded>(_onItemSucceeded);
    on<_SyncItemFailed>(_onItemFailed);

    _connectivitySub = connectivity.onConnectivityChanged.listen((results) {
      final isOnline = results.any(
        (r) =>
            r == ConnectivityResult.mobile ||
            r == ConnectivityResult.wifi ||
            r == ConnectivityResult.ethernet,
      );
      if (isOnline && state.hasPending) {
        add(const SyncConnectivityRestored());
      }
    });
  }

  final SyncRepository _syncRepository;
  late final StreamSubscription<List<ConnectivityResult>> _connectivitySub;

  // ── Handlers ────────────────────────────────────────────────────────────────

  void _onEnqueue(SyncEnqueueAction event, Emitter<SyncState> emit) {
    emit(state.copyWith(queue: [...state.queue, event.action]));
  }

  Future<void> _onConnectivityRestored(
    SyncConnectivityRestored event,
    Emitter<SyncState> emit,
  ) async {
    if (state.isSyncing || state.queue.isEmpty) return;
    emit(state.copyWith(isSyncing: true));

    // Processa a fila em ordem FIFO, um item por vez.
    for (final action in List<PendingAction>.from(state.queue)) {
      try {
        await _syncRepository.dispatch(action);
        add(_SyncItemSucceeded(action.id));
      } on AppError {
        add(_SyncItemFailed(action.id));
      } catch (_) {
        add(_SyncItemFailed(action.id));
      }
    }

    emit(state.copyWith(isSyncing: false));
  }

  void _onItemSucceeded(_SyncItemSucceeded event, Emitter<SyncState> emit) {
    emit(
      state.copyWith(
        queue: state.queue.where((a) => a.id != event.actionId).toList(),
      ),
    );
  }

  void _onItemFailed(_SyncItemFailed event, Emitter<SyncState> emit) {
    final action = state.queue.firstWhere((a) => a.id == event.actionId);
    final updated = action.copyWith(retryCount: action.retryCount + 1);

    if (updated.retryCount >= _maxRetries) {
      // Move para dead letter queue
      emit(
        state.copyWith(
          queue: state.queue.where((a) => a.id != event.actionId).toList(),
          deadLetterQueue: [...state.deadLetterQueue, updated],
        ),
      );
    } else {
      // Recoloca no final da fila para retry
      emit(
        state.copyWith(
          queue: [...state.queue.where((a) => a.id != event.actionId), updated],
        ),
      );
    }
  }

  // ── HydratedBloc serialization ───────────────────────────────────────────────

  @override
  SyncState? fromJson(Map<String, dynamic> json) => SyncState.fromJson(json);

  @override
  Map<String, dynamic>? toJson(SyncState state) => state.toJson();

  @override
  Future<void> close() {
    _connectivitySub.cancel();
    return super.close();
  }
}
