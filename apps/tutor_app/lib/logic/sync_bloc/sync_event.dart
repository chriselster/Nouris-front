import 'package:equatable/equatable.dart';

import '../../data/models/pending_action.dart';

// ── Events ────────────────────────────────────────────────────────────────────

abstract class SyncEvent extends Equatable {
  const SyncEvent();

  @override
  List<Object?> get props => [];
}

/// Enfileira uma nova ação para sincronização posterior.
final class SyncEnqueueAction extends SyncEvent {
  const SyncEnqueueAction(this.action);
  final PendingAction action;

  @override
  List<Object?> get props => [action];
}

/// Disparado pelo [connectivity_plus] ao detectar conexão de volta.
final class SyncConnectivityRestored extends SyncEvent {
  const SyncConnectivityRestored();
}

// ── State ─────────────────────────────────────────────────────────────────────

final class SyncState extends Equatable {
  const SyncState({
    this.queue = const [],
    this.deadLetterQueue = const [],
    this.isSyncing = false,
  });

  final List<PendingAction> queue;

  /// Ações que falharam após [SyncBloc._maxRetries] tentativas.
  /// Exibidas como banner de aviso ao usuário.
  final List<PendingAction> deadLetterQueue;

  final bool isSyncing;

  bool get hasPending => queue.isNotEmpty;
  bool get hasFailures => deadLetterQueue.isNotEmpty;

  SyncState copyWith({
    List<PendingAction>? queue,
    List<PendingAction>? deadLetterQueue,
    bool? isSyncing,
  }) {
    return SyncState(
      queue: queue ?? this.queue,
      deadLetterQueue: deadLetterQueue ?? this.deadLetterQueue,
      isSyncing: isSyncing ?? this.isSyncing,
    );
  }

  /// Serialização para [HydratedBloc].
  Map<String, dynamic> toJson() => {
    'queue': queue.map((a) => a.toJson()).toList(),
    'deadLetterQueue': deadLetterQueue.map((a) => a.toJson()).toList(),
  };

  factory SyncState.fromJson(Map<String, dynamic> json) {
    return SyncState(
      queue: (json['queue'] as List<dynamic>? ?? [])
          .map((e) => PendingAction.fromJson(e as Map<String, dynamic>))
          .toList(),
      deadLetterQueue: (json['deadLetterQueue'] as List<dynamic>? ?? [])
          .map((e) => PendingAction.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  @override
  List<Object?> get props => [queue, deadLetterQueue, isSyncing];
}
