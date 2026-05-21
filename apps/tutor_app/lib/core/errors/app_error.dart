/// Hierarquia de erros de domínio do app Nouris.
///
/// Todos os repositórios retornam (ou lançam) subtipos de [AppError].
/// O [AppBlocObserver] captura e loga os erros globalmente.
sealed class AppError implements Exception {
  const AppError(this.message);
  final String message;

  @override
  String toString() => '$runtimeType: $message';
}

/// Sem conexão com a internet ou timeout de rede.
final class NetworkError extends AppError {
  const NetworkError([super.message = 'Sem conexão com a internet.']);
}

/// Sessão expirada, credenciais inválidas ou acesso negado.
final class AuthError extends AppError {
  const AuthError([super.message = 'Sessão inválida. Faça login novamente.']);
}

/// Dados inválidos fornecidos pelo usuário ou pelo cliente.
final class ValidationError extends AppError {
  const ValidationError(super.message);
}

/// Erro retornado pelo servidor (4xx/5xx não mapeados).
final class ServerError extends AppError {
  const ServerError([super.message = 'Erro no servidor. Tente novamente.']);
  const ServerError.withCode(int statusCode)
    : super('Erro no servidor (HTTP $statusCode).');
}

/// Limite do plano Freemium atingido no lado do veterinário.
final class FreemiumLimitError extends AppError {
  const FreemiumLimitError()
    : super(
        'Seu veterinário atingiu o limite de pacientes do plano gratuito. '
        'Peça a ele para atualizar o plano.',
      );
}
