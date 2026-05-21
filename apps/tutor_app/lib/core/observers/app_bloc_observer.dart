import 'package:bloc/bloc.dart';
import 'package:flutter/foundation.dart';

import '../errors/app_error.dart';

/// Observer global de BLoCs.
///
/// - Em desenvolvimento: loga eventos, transições e erros via [debugPrint].
/// - Em produção: integrar com Sentry/Crashlytics substituindo os [debugPrint].
final class AppBlocObserver extends BlocObserver {
  const AppBlocObserver();

  @override
  void onError(BlocBase<dynamic> bloc, Object error, StackTrace stackTrace) {
    debugPrint('[BLoC ERROR] ${bloc.runtimeType} ─ $error');
    if (error is AppError) {
      // Erros de domínio são esperados; log de baixa severidade.
      debugPrint('  └─ AppError: ${error.message}');
    } else {
      // Erros inesperados: em prod, enviar para Crashlytics aqui.
      debugPrint('  └─ Unexpected error\n$stackTrace');
    }
    super.onError(bloc, error, stackTrace);
  }

  @override
  void onTransition(
    Bloc<dynamic, dynamic> bloc,
    Transition<dynamic, dynamic> transition,
  ) {
    debugPrint(
      '[BLoC] ${bloc.runtimeType}: '
      '${transition.currentState.runtimeType} → '
      '${transition.nextState.runtimeType}',
    );
    super.onTransition(bloc, transition);
  }
}
