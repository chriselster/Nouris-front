import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../features/qr_link/cubit/qr_link_cubit.dart';

/// Scanner de QR Code para vinculação do pet ao veterinário.
///
/// Fluxo:
///   1. Câmera detecta QR → [QrLinkCubit.onQrScanned]
///   2. Cubit busca pet + nome do vet no Supabase
///   3. Bottom sheet confirma o vínculo → [QrLinkCubit.confirmLink]
///   4. Sucesso → navega para /home
final class LinkQrPage extends StatefulWidget {
  const LinkQrPage({super.key});

  @override
  State<LinkQrPage> createState() => _LinkQrPageState();
}

class _LinkQrPageState extends State<LinkQrPage>
    with SingleTickerProviderStateMixin {
  // ── Cubit instanciado aqui para controlar ciclo de vida ────────────
  late final QrLinkCubit _cubit;
  late final MobileScannerController _scanner;
  late final AnimationController _lineCtrl;
  late final Animation<double> _lineAnim;

  bool _sheetVisible = false;

  static const _scanSize = 240.0;

  @override
  void initState() {
    super.initState();
    _cubit = QrLinkCubit(Supabase.instance.client);
    _scanner = MobileScannerController(autoStart: true);
    _lineCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat();
    _lineAnim = CurvedAnimation(parent: _lineCtrl, curve: Curves.linear);
  }

  @override
  void dispose() {
    _cubit.close();
    _scanner.dispose();
    _lineCtrl.dispose();
    super.dispose();
  }

  // ── Callbacks ────────────────────────────────────────────────────
  void _onDetect(BarcodeCapture capture) {
    if (_sheetVisible) return;
    final raw = capture.barcodes.firstOrNull?.rawValue;
    if (raw == null) return;
    _cubit.onQrScanned(raw);
  }

  /// Simula escaneamento com um UUID fixo — útil para testes em desktop/emulador.
  void _simulateScan() {
    // Substitua por um petId real do banco para testar
    const simulatedUrl =
        'https://app.nouris.com/vincular/00000000-0000-0000-0000-000000000001';
    _cubit.onQrScanned(simulatedUrl);
  }

  void _showVetBottomSheet(BuildContext ctx, QrLinkState state) {
    setState(() => _sheetVisible = true);
    _scanner.stop();

    showModalBottomSheet<bool>(
      context: ctx,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetCtx) => BlocProvider.value(
        value: _cubit,
        child: _VetFoundSheet(
          vetName: state.vetName ?? 'Veterinário',
          petName: state.petName ?? 'Pet',
        ),
      ),
    ).then((confirmed) {
      if (!mounted) return;
      if (confirmed == true) {
        context.go('/home');
      } else {
        // Usuário cancelou → reinicia scanner
        setState(() => _sheetVisible = false);
        _cubit.resetScan();
        _scanner.start();
      }
    });
  }

  // ── Build ────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: _cubit,
      child: BlocListener<QrLinkCubit, QrLinkState>(
        listener: (ctx, state) {
          if (state.status == QrLinkStatus.vetFound && !_sheetVisible) {
            _showVetBottomSheet(ctx, state);
          }
          if (state.status == QrLinkStatus.error) {
            ScaffoldMessenger.of(ctx).showSnackBar(
              SnackBar(
                content: Text(state.errorMessage ?? 'Erro desconhecido'),
                backgroundColor: Theme.of(ctx).colorScheme.error,
              ),
            );
            _cubit.resetScan();
          }
        },
        child: Scaffold(
          backgroundColor: Colors.black,
          appBar: AppBar(
            backgroundColor: Colors.transparent,
            foregroundColor: Colors.white,
            elevation: 0,
            centerTitle: false,
            automaticallyImplyLeading: false,
            title: const Text(
              'Escanear QR Code',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
              ),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.close, color: Colors.white),
                tooltip: 'Fechar',
                onPressed: () => context.pop(),
              ),
            ],
          ),
          body: Stack(
            fit: StackFit.expand,
            children: [
              Container(color: Colors.black),
              // 1. Câmera (full screen)
              Positioned.fill(
                child: MobileScanner(controller: _scanner, onDetect: _onDetect),
              ),

              // 2. Overlay escurecido + recorte + cantos
              Positioned.fill(
                child: CustomPaint(
                  painter: _OverlayPainter(scanSize: _scanSize),
                ),
              ),

              // 3. Linha de scan animada
              Positioned.fill(
                child: _AnimatedScanLine(
                  scanSize: _scanSize,
                  animation: _lineAnim,
                ),
              ),

              // 4. Loading indicator (lookingUp)
              BlocBuilder<QrLinkCubit, QrLinkState>(
                builder: (_, state) {
                  if (state.status != QrLinkStatus.lookingUp) {
                    return const SizedBox.shrink();
                  }
                  return const Center(
                    child: CircularProgressIndicator(color: Color(0xFF4CAF50)),
                  );
                },
              ),

              // // 5. Texto + botão de simulação
              Positioned(
                left: 24,
                right: 24,
                bottom: 60,
                child: _ScannerInstructions(onSimulate: _simulateScan),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// OVERLAY PAINTER — escurece tudo exceto o quadrado central
// ─────────────────────────────────────────────────────────────────────────────
class _OverlayPainter extends CustomPainter {
  const _OverlayPainter({required this.scanSize});

  final double scanSize;

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height * 0.42;
    final rect = Rect.fromCenter(
      center: Offset(cx, cy),
      width: scanSize,
      height: scanSize,
    );

    // Fundo escurecido com "buraco" no centro
    final overlayPaint = Paint()..color = const Color(0xAA000000);
    final path = Path()
      ..addRect(Rect.fromLTWH(0, 0, size.width, size.height))
      ..addRect(rect)
      ..fillType = PathFillType.evenOdd;
    canvas.drawPath(path, overlayPaint);

    // Cantos do quadrado
    final cornerPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.85)
      ..strokeWidth = 3.5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    const cl = 26.0; // comprimento do canto
    _drawCorner(canvas, cornerPaint, rect.topLeft, cl, 1, 1);
    _drawCorner(canvas, cornerPaint, rect.topRight, cl, -1, 1);
    _drawCorner(canvas, cornerPaint, rect.bottomLeft, cl, 1, -1);
    _drawCorner(canvas, cornerPaint, rect.bottomRight, cl, -1, -1);
  }

  void _drawCorner(
    Canvas c,
    Paint p,
    Offset origin,
    double len,
    double dx,
    double dy,
  ) {
    c.drawLine(origin, origin + Offset(dx * len, 0), p);
    c.drawLine(origin, origin + Offset(0, dy * len), p);
  }

  // Suppress: unnecessary underscores on private nested class params are intentional

  @override
  bool shouldRepaint(covariant _OverlayPainter old) => old.scanSize != scanSize;
}

// ─────────────────────────────────────────────────────────────────────────────
// LINHA DE SCAN ANIMADA
// ─────────────────────────────────────────────────────────────────────────────
class _AnimatedScanLine extends StatelessWidget {
  const _AnimatedScanLine({required this.scanSize, required this.animation});

  final double scanSize;
  final Animation<double> animation;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (_, constraints) {
        final cx = constraints.maxWidth / 2;
        final cy = constraints.maxHeight * 0.42;
        final left = cx - scanSize / 2;
        final top = cy - scanSize / 2;

        return AnimatedBuilder(
          animation: animation,
          builder: (context, child) {
            return Stack(
              children: [
                Positioned(
                  top: top + animation.value * scanSize,
                  left: left,
                  width: scanSize,
                  child: Container(
                    height: 2.5,
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.transparent,
                          Color(0xCC4CAF50),
                          Color(0xFF4CAF50),
                          Color(0xCC4CAF50),
                          Colors.transparent,
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INSTRUÇÕES + BOTÃO DE SIMULAÇÃO
// ─────────────────────────────────────────────────────────────────────────────
class _ScannerInstructions extends StatelessWidget {
  const _ScannerInstructions({required this.onSimulate});

  final VoidCallback onSimulate;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Aponte a câmera para o QR Code do\nseu veterinário',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'O código é exibido no painel web do veterinário',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.65),
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: onSimulate,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2A2A2A),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: const Text(
                    'Simular escaneamento',
                    style: TextStyle(fontWeight: FontWeight.w500),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BOTTOM SHEET — VETERINÁRIO ENCONTRADO
// ─────────────────────────────────────────────────────────────────────────────
class _VetFoundSheet extends StatelessWidget {
  const _VetFoundSheet({required this.vetName, required this.petName});

  final String vetName;
  final String petName;

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;

    return BlocListener<QrLinkCubit, QrLinkState>(
      listener: (ctx, state) {
        if (state.status == QrLinkStatus.success) {
          // Fecha o sheet retornando true → LinkQrPage navega para /home
          Navigator.of(ctx).pop(true);
        }
        if (state.status == QrLinkStatus.error) {
          ScaffoldMessenger.of(ctx).showSnackBar(
            SnackBar(
              content: Text(state.errorMessage ?? 'Erro ao vincular'),
              backgroundColor: cs.error,
            ),
          );
          Navigator.of(ctx).pop(false);
        }
      },
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Drag handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Ícone de sucesso
            Center(
              child: Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: cs.primaryContainer,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.verified_outlined,
                  color: cs.primary,
                  size: 30,
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Títulos
            Text(
              'Veterinário encontrado',
              textAlign: TextAlign.center,
              style: tt.titleLarge?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 6),
            Text(
              vetName,
              textAlign: TextAlign.center,
              style: tt.bodyMedium?.copyWith(color: Colors.grey.shade600),
            ),
            const SizedBox(height: 4),
            Text(
              'Pet: $petName',
              textAlign: TextAlign.center,
              style: tt.bodySmall?.copyWith(color: Colors.grey.shade500),
            ),
            const SizedBox(height: 32),

            // Botão confirmar
            BlocBuilder<QrLinkCubit, QrLinkState>(
              builder: (ctx, state) {
                final isLinking = state.status == QrLinkStatus.linking;
                return FilledButton(
                  onPressed: isLinking
                      ? null
                      : () => ctx.read<QrLinkCubit>().confirmLink(),
                  child: isLinking
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Text('Confirmar vínculo'),
                );
              },
            ),
            const SizedBox(height: 10),

            // Cancelar
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Cancelar'),
            ),
          ],
        ),
      ),
    );
  }
}
