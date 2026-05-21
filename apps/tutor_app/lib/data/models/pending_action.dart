import 'package:equatable/equatable.dart';
import 'package:uuid/uuid.dart';

/// Tipos de ação que podem ser enfileiradas para sincronização offline.
enum PendingActionType { weightLog, fecesLog, dietComplianceLog }

/// Representa uma ação do usuário pendente de sincronização com o Supabase.
///
/// Criada quando o app está offline e persistida via [HydratedBloc].
/// Processada pelo [SyncBloc] quando a conexão é restaurada.
final class PendingAction extends Equatable {
  PendingAction({
    String? id,
    required this.type,
    required this.payload,
    DateTime? createdAt,
    this.retryCount = 0,
  }) : id = id ?? const Uuid().v4(),
       createdAt = createdAt ?? DateTime.now().toUtc();

  /// Construtor de desserialização (JSON → PendingAction).
  factory PendingAction.fromJson(Map<String, dynamic> json) {
    return PendingAction(
      id: json['id'] as String,
      type: PendingActionType.values.byName(json['type'] as String),
      payload: Map<String, dynamic>.from(json['payload'] as Map),
      createdAt: DateTime.parse(json['createdAt'] as String),
      retryCount: json['retryCount'] as int? ?? 0,
    );
  }

  final String id;
  final PendingActionType type;
  final Map<String, dynamic> payload;
  final DateTime createdAt;
  final int retryCount;

  Map<String, dynamic> toJson() => {
    'id': id,
    'type': type.name,
    'payload': payload,
    'createdAt': createdAt.toIso8601String(),
    'retryCount': retryCount,
  };

  PendingAction copyWith({int? retryCount}) {
    return PendingAction(
      id: id,
      type: type,
      payload: payload,
      createdAt: createdAt,
      retryCount: retryCount ?? this.retryCount,
    );
  }

  @override
  List<Object?> get props => [id, type, payload, createdAt, retryCount];
}
