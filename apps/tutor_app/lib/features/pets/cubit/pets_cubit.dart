import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';

import '../../../data/models/pet_summary.dart';
import '../../../data/repositories/pet_repository.dart';

part 'pets_state.dart';

/// Carrega e expõe a lista de pets do tutor autenticado.
final class PetsCubit extends Cubit<PetsState> {
  PetsCubit(this._repo) : super(const PetsState());

  final PetRepository _repo;

  Future<void> loadPets() async {
    emit(state.copyWith(status: PetsStatus.loading));
    try {
      final pets = await _repo.getPetsForCurrentUser();
      emit(state.copyWith(status: PetsStatus.loaded, pets: pets));
    } catch (_) {
      emit(
        state.copyWith(
          status: PetsStatus.error,
          errorMessage: 'Não foi possível carregar os pets. Tente novamente.',
        ),
      );
    }
  }
}
