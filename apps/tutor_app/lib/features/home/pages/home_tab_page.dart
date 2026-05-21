import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Conteúdo da aba "Início" dentro do HomeShellPage.
/// Por enquanto usa dados mockados — será conectado ao HomeCubit/PetCubit
/// quando as features completas forem implementadas.
final class HomeTabPage extends StatelessWidget {
  const HomeTabPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF2F4F3),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.only(bottom: 120),
          children: [
            _HomeHeader(tutorName: 'Maria', petName: 'Bob'),
            // TODO: conectar ao SyncBloc para mostrar banner real
            const _SyncBanner(pendingCount: 2),
            const SizedBox(height: 8),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: _WeeklyStreakCard(
                // S T Q Q S S D (Segunda→Domingo)
                daysCompleted: [true, true, true, true, true, false, false],
                streak: 5,
              ),
            ),
            const SizedBox(height: 12),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: _PetSummaryCard(
                name: 'Bob',
                breed: 'Golden Retriever',
                weightKg: 4.2,
                lastRecordDays: 2,
                bcs: 3,
                dietName: 'Dieta Mista',
              ),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: _DietActionCard(
                onTap: () {
                  // TODO: navegar para /pet/:id/logs/diet/mark
                },
              ),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: _VetLinkCard(onTap: () => context.push('/link-qr')),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────────────────────────
class _HomeHeader extends StatelessWidget {
  const _HomeHeader({required this.tutorName, required this.petName});

  final String tutorName;
  final String petName;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 8, 8),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: cs.primary,
            child: Text(
              tutorName[0].toUpperCase(),
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Olá, $tutorName!',
                  style: tt.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                ),
                Text(
                  '$petName está sendo monitorado',
                  style: tt.bodySmall?.copyWith(color: Colors.grey.shade600),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {},
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BANNER DE SINCRONIZAÇÃO
// ─────────────────────────────────────────────────────────────────────────────
class _SyncBanner extends StatelessWidget {
  const _SyncBanner({required this.pendingCount});

  final int pendingCount;

  @override
  Widget build(BuildContext context) {
    if (pendingCount == 0) return const SizedBox.shrink();
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 4, 16, 4),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF3CD),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFFFFD54F).withValues(alpha: 0.7),
        ),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.cloud_sync_outlined,
            color: Color(0xFFF57F17),
            size: 20,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              '$pendingCount registro${pendingCount != 1 ? 's' : ''} aguardando sincronização',
              style: const TextStyle(color: Color(0xFF795548), fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD — CONSISTÊNCIA DA SEMANA
// ─────────────────────────────────────────────────────────────────────────────
class _WeeklyStreakCard extends StatelessWidget {
  const _WeeklyStreakCard({required this.daysCompleted, required this.streak});

  /// 7 bools: S T Q Q S S D (Segunda → Domingo)
  final List<bool> daysCompleted;
  final int streak;

  static const _labels = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Consistência da semana',
              style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: List.generate(
                7,
                (i) =>
                    _DayCircle(label: _labels[i], completed: daysCompleted[i]),
              ),
            ),
            const SizedBox(height: 12),
            Text.rich(
              TextSpan(
                children: [
                  const TextSpan(text: '🔥 '),
                  TextSpan(
                    text: '$streak dias seguidos',
                    style: TextStyle(
                      color: Colors.orange.shade700,
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DayCircle extends StatelessWidget {
  const _DayCircle({required this.label, required this.completed});

  final String label;
  final bool completed;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Column(
      children: [
        AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: completed ? cs.primary : Colors.transparent,
            border: completed
                ? null
                : Border.all(color: Colors.grey.shade300, width: 1.5),
          ),
          child: completed
              ? const Icon(Icons.check, color: Colors.white, size: 18)
              : null,
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD — RESUMO DO PET
// ─────────────────────────────────────────────────────────────────────────────
class _PetSummaryCard extends StatelessWidget {
  const _PetSummaryCard({
    required this.name,
    required this.breed,
    required this.weightKg,
    required this.lastRecordDays,
    required this.bcs,
    required this.dietName,
  });

  final String name;
  final String breed;
  final double weightKg;
  final int lastRecordDays;
  final int bcs;
  final String dietName;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Pet identity
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: cs.primary,
                  child: Text(
                    name[0].toUpperCase(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: tt.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      breed,
                      style: tt.bodySmall?.copyWith(
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 14),
            const Divider(height: 1, thickness: 1),
            const SizedBox(height: 14),
            // 2×2 stats grid
            Row(
              children: [
                Expanded(
                  child: _PetStat(
                    label: 'Peso atual',
                    value: '${weightKg.toStringAsFixed(1)} kg',
                  ),
                ),
                Expanded(
                  child: _PetStat(
                    label: 'Último registro',
                    value: 'Há $lastRecordDays dias',
                    valueColor: Colors.blue.shade700,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _PetStat(label: 'BCS', value: '$bcs/9'),
                ),
                Expanded(
                  child: _PetStat(
                    label: 'Dieta ativa',
                    value: dietName,
                    valueColor: cs.primary,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _PetStat extends StatelessWidget {
  const _PetStat({required this.label, required this.value, this.valueColor});

  final String label;
  final String value;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            color: valueColor ?? Theme.of(context).colorScheme.onSurface,
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD — MARCAR DIETA DO DIA
// ─────────────────────────────────────────────────────────────────────────────
class _DietActionCard extends StatelessWidget {
  const _DietActionCard({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: cs.primaryContainer.withValues(alpha: 0.35),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cs.primary.withValues(alpha: 0.18)),
      ),
      child: Row(
        children: [
          Icon(Icons.check_circle_outline_rounded, color: cs.primary, size: 28),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'Marcar dieta de hoje',
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
            ),
          ),
          FilledButton(
            onPressed: onTap,
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              textStyle: const TextStyle(fontWeight: FontWeight.w600),
            ),
            child: const Text('Marcar agora'),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD — VINCULAR VETERINÁRIO
// ─────────────────────────────────────────────────────────────────────────────
class _VetLinkCard extends StatelessWidget {
  const _VetLinkCard({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: cs.primaryContainer,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.qr_code_2_rounded,
                  color: cs.primary,
                  size: 28,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Vincular veterinário',
                      style: tt.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      'Escaneie o QR Code',
                      style: tt.bodySmall?.copyWith(
                        color: Colors.grey.shade500,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right_rounded, color: Colors.grey.shade400),
            ],
          ),
        ),
      ),
    );
  }
}
