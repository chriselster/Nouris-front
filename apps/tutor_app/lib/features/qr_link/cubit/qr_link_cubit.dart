import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

part 'qr_link_state.dart';

/// Gerencia o fluxo de vinculação Tutor ↔ Pet/Veterinário via QR Code.
///
/// Fluxo:
///   1. [onQrScanned] → parse da URL → busca pet + vet no Supabase
///   2. Emite [QrLinkStatus.vetFound] com nome do vet
///   3. [confirmLink] → atualiza pets.tutor_user_id = auth.uid()
///   4. Emite [QrLinkStatus.success]
final class QrLinkCubit extends Cubit<QrLinkState> {
  QrLinkCubit(this._client) : super(const QrLinkState());

  final SupabaseClient _client;

  // URL gerada pelo painel vet: https://app.nouris.com/vincular/{petId}
  static final _uuidRegex = RegExp(
    r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
    caseSensitive: false,
  );

  /// Chamado quando o scanner lê um código QR.
  Future<void> onQrScanned(String rawValue) async {
    // Debounce: ignora se já estiver buscando
    if (state.status == QrLinkStatus.lookingUp ||
        state.status == QrLinkStatus.vetFound ||
        state.status == QrLinkStatus.linking) {
      return;
    }

    final petId = _extractPetId(rawValue);
    if (petId == null) {
      emit(
        state.copyWith(
          status: QrLinkStatus.error,
          errorMessage:
              'QR Code inválido. Use o QR gerado pelo painel do veterinário.',
        ),
      );
      return;
    }

    emit(state.copyWith(status: QrLinkStatus.lookingUp, petId: petId));

    try {
      // 1. Busca o pet para obter vet_id
      final petData = await _client
          .from('pets')
          .select('id, name, vet_id')
          .eq('id', petId)
          .maybeSingle();

      if (petData == null) {
        emit(
          state.copyWith(
            status: QrLinkStatus.error,
            errorMessage:
                'Pet não encontrado. Peça ao veterinário um QR atualizado.',
          ),
        );
        return;
      }

      // 2. Busca o perfil do veterinário
      final vetId = petData['vet_id'] as String?;
      String vetDisplayName = 'Veterinário';

      if (vetId != null) {
        final vetData = await _client
            .from('vet_profiles')
            .select('display_name')
            .eq('user_id', vetId)
            .maybeSingle();
        vetDisplayName =
            (vetData?['display_name'] as String?)?.trim().isNotEmpty == true
            ? vetData!['display_name'] as String
            : 'Veterinário';
      }

      emit(
        state.copyWith(
          status: QrLinkStatus.vetFound,
          petId: petId,
          petName: petData['name'] as String? ?? 'Pet',
          vetName: vetDisplayName,
        ),
      );
    } catch (e) {
      emit(
        state.copyWith(
          status: QrLinkStatus.error,
          errorMessage:
              'Erro ao buscar dados. Verifique sua conexão e tente novamente.',
        ),
      );
    }
  }

  /// Confirma o vínculo: atualiza pets.tutor_user_id = uid do tutor logado.
  Future<void> confirmLink() async {
    final petId = state.petId;
    if (petId == null || state.status != QrLinkStatus.vetFound) return;

    emit(state.copyWith(status: QrLinkStatus.linking));

    try {
      final userId = _client.auth.currentUser?.id;
      if (userId == null) throw Exception('Usuário não autenticado.');

      // Garante que tutor_profiles existe antes de vincular o pet,
      // pois pets.tutor_user_id tem FK para tutor_profiles.user_id.
      await _client
          .from('tutor_profiles')
          .upsert({'user_id': userId}, onConflict: 'user_id');

      await _client
          .from('pets')
          .update({'tutor_user_id': userId})
          .eq('id', petId);

      emit(state.copyWith(status: QrLinkStatus.success));
    } catch (e) {
      emit(
        state.copyWith(
          status: QrLinkStatus.error,
          errorMessage:
              'Não foi possível confirmar o vínculo. Tente novamente.',
        ),
      );
    }
  }

  /// Reinicia o estado para permitir uma nova leitura.
  void resetScan() => emit(const QrLinkState());

  String? _extractPetId(String raw) {
    final match = _uuidRegex.firstMatch(raw);
    return match?.group(0);
  }
}
