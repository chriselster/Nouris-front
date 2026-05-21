part of 'pets_cubit.dart';

enum PetsStatus { initial, loading, loaded, error }

final class PetsState extends Equatable {
  const PetsState({
    this.status = PetsStatus.initial,
    this.pets = const [],
    this.errorMessage,
  });

  final PetsStatus status;
  final List<PetSummary> pets;
  final String? errorMessage;

  PetsState copyWith({
    PetsStatus? status,
    List<PetSummary>? pets,
    String? errorMessage,
  }) {
    return PetsState(
      status: status ?? this.status,
      pets: pets ?? this.pets,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }

  @override
  List<Object?> get props => [status, pets, errorMessage];
}
