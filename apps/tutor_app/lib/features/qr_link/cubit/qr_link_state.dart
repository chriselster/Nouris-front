part of 'qr_link_cubit.dart';

enum QrLinkStatus { idle, lookingUp, vetFound, linking, success, error }

final class QrLinkState extends Equatable {
  const QrLinkState({
    this.status = QrLinkStatus.idle,
    this.petId,
    this.petName,
    this.vetName,
    this.errorMessage,
  });

  final QrLinkStatus status;
  final String? petId;
  final String? petName;
  final String? vetName;
  final String? errorMessage;

  QrLinkState copyWith({
    QrLinkStatus? status,
    String? petId,
    String? petName,
    String? vetName,
    String? errorMessage,
  }) {
    return QrLinkState(
      status: status ?? this.status,
      petId: petId ?? this.petId,
      petName: petName ?? this.petName,
      vetName: vetName ?? this.vetName,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }

  @override
  List<Object?> get props => [status, petId, petName, vetName, errorMessage];
}
