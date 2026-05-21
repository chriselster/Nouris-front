import 'package:equatable/equatable.dart';

/// Modelo leve usado na listagem de pets do tutor.
final class PetSummary extends Equatable {
  const PetSummary({
    required this.id,
    required this.name,
    required this.species,
    this.breed,
    this.vetName,
    required this.status,
  });

  final String id;
  final String name;
  final String species;
  final String? breed;

  /// Display name do veterinário vinculado; null = sem veterinário.
  final String? vetName;

  /// 'active' | 'inactive' | 'pending'
  final String status;

  bool get hasVet => vetName != null;

  /// "Cão • Golden Retriever" ou apenas "Cão"
  String get subtitle {
    if (breed != null && breed!.isNotEmpty) return '$species • $breed';
    return species;
  }

  @override
  List<Object?> get props => [id, name, species, breed, vetName, status];
}
