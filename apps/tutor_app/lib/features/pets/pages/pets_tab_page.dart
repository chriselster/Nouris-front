import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../data/models/pet_summary.dart';
import '../cubit/pets_cubit.dart';

/// Aba "Meus Pets" dentro do HomeShellPage.
final class PetsTabPage extends StatefulWidget {
  const PetsTabPage({super.key});

  @override
  State<PetsTabPage> createState() => _PetsTabPageState();
}

class _PetsTabPageState extends State<PetsTabPage> {
  @override
  void initState() {
    super.initState();
    context.read<PetsCubit>().loadPets();
  }

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: const Color(0xFFF2F4F3),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Header ────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 16, 16),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'Meus Pets',
                      style: tt.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: () => _onAddPet(context),
                    child: Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: cs.primary,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.add,
                        color: Colors.white,
                        size: 22,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // ── Lista ─────────────────────────────────────────────────
            Expanded(
              child: BlocBuilder<PetsCubit, PetsState>(
                builder: (context, state) {
                  if (state.status == PetsStatus.loading ||
                      state.status == PetsStatus.initial) {
                    return const Center(child: CircularProgressIndicator());
                  }

                  if (state.status == PetsStatus.error) {
                    return Center(
                      child: Padding(
                        padding: const EdgeInsets.all(32),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.cloud_off_outlined,
                              size: 48,
                              color: Colors.grey.shade400,
                            ),
                            const SizedBox(height: 12),
                            Text(
                              state.errorMessage ?? 'Erro desconhecido',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: Colors.grey.shade600),
                            ),
                            const SizedBox(height: 20),
                            FilledButton.tonal(
                              onPressed: () =>
                                  context.read<PetsCubit>().loadPets(),
                              child: const Text('Tentar novamente'),
                            ),
                          ],
                        ),
                      ),
                    );
                  }

                  return RefreshIndicator(
                    onRefresh: () => context.read<PetsCubit>().loadPets(),
                    child: ListView(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      children: [
                        if (state.pets.isEmpty)
                          _EmptyStateHint()
                        else
                          ...state.pets.map(
                            (pet) => Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: _PetCard(pet: pet),
                            ),
                          ),
                        const SizedBox(height: 12),
                        _AddPetCard(onTap: () => _onAddPet(context)),
                        const SizedBox(height: 120),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _onAddPet(BuildContext context) {
    // TODO: navegar para /pets/new — cadastro de pet
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Cadastro de pet — em breve!')),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PET CARD
// ─────────────────────────────────────────────────────────────────────────────
class _PetCard extends StatelessWidget {
  const _PetCard({required this.pet});

  final PetSummary pet;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () {
          // TODO: navegar para /pets/${pet.id}
        },
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              // Avatar
              CircleAvatar(
                radius: 24,
                backgroundColor: cs.primary,
                child: Text(
                  pet.name[0].toUpperCase(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                  ),
                ),
              ),
              const SizedBox(width: 14),

              // Infos
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      pet.name,
                      style: tt.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      pet.subtitle,
                      style: tt.bodySmall?.copyWith(
                        color: Colors.grey.shade600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    _VetBadge(vetName: pet.vetName),
                  ],
                ),
              ),

              const SizedBox(width: 8),
              Icon(Icons.chevron_right_rounded, color: Colors.grey.shade400),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// VET BADGE
// ─────────────────────────────────────────────────────────────────────────────
class _VetBadge extends StatelessWidget {
  const _VetBadge({this.vetName});

  final String? vetName;

  @override
  Widget build(BuildContext context) {
    final linked = vetName != null;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: linked ? const Color(0xFFE8F5E9) : Colors.grey.shade100,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: linked ? const Color(0xFF81C784) : Colors.grey.shade300,
          width: 0.8,
        ),
      ),
      child: Text(
        linked ? 'Vinculado ao $vetName' : 'Sem veterinário',
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: linked ? const Color(0xFF2E7D32) : Colors.grey.shade500,
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD ADICIONAR PET (borda tracejada)
// ─────────────────────────────────────────────────────────────────────────────
class _AddPetCard extends StatelessWidget {
  const _AddPetCard({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: CustomPaint(
        painter: _DashedRectPainter(
          color: Colors.grey.shade400,
          radius: 16,
          dashLength: 7,
          gapLength: 5,
        ),
        child: SizedBox(
          width: double.infinity,
          height: 90,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.add, size: 28, color: Colors.grey.shade500),
              const SizedBox(height: 6),
              Text(
                'Cadastrar novo pet',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: Colors.grey.shade600,
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
// ESTADO VAZIO
// ─────────────────────────────────────────────────────────────────────────────
class _EmptyStateHint extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Column(
        children: [
          Icon(Icons.pets_outlined, size: 52, color: Colors.grey.shade400),
          const SizedBox(height: 12),
          Text(
            'Nenhum pet vinculado ainda',
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Cadastre um pet ou peça ao seu\nveterinário para vinculá-lo via QR.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13, color: Colors.grey.shade500),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM PAINTER — borda tracejada arredondada
// ─────────────────────────────────────────────────────────────────────────────
class _DashedRectPainter extends CustomPainter {
  const _DashedRectPainter({
    required this.color,
    required this.radius,
    required this.dashLength,
    required this.gapLength,
  });

  final Color color;
  final double radius;
  final double dashLength;
  final double gapLength;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;

    final rrect = RRect.fromRectAndRadius(
      Offset.zero & size,
      Radius.circular(radius),
    );
    final path = Path()..addRRect(rrect);
    canvas.drawPath(_dashedPath(path), paint);
  }

  Path _dashedPath(Path source) {
    final dest = Path();
    for (final metric in source.computeMetrics()) {
      var distance = 0.0;
      while (distance < metric.length) {
        final end = (distance + dashLength).clamp(0.0, metric.length);
        dest.addPath(metric.extractPath(distance, end), Offset.zero);
        distance += dashLength + gapLength;
      }
    }
    return dest;
  }

  @override
  bool shouldRepaint(covariant _DashedRectPainter old) =>
      old.color != color ||
      old.radius != radius ||
      old.dashLength != dashLength ||
      old.gapLength != gapLength;
}
