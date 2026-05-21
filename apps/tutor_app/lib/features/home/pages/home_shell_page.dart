import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Shell com BottomNavigationBar (3 abas) + FAB de log rápido.
final class HomeShellPage extends StatefulWidget {
  const HomeShellPage({super.key, required this.child});
  final Widget child;

  @override
  State<HomeShellPage> createState() => _HomeShellPageState();
}

class _HomeShellPageState extends State<HomeShellPage> {
  static const _tabs = ['/home', '/pets', '/profile'];
  static const _icons = [
    Icons.home_outlined,
    Icons.pets_outlined,
    Icons.person_outline,
  ];
  static const _labels = ['Início', 'Pets', 'Perfil'];

  int _currentIndex = 0;

  void _onTap(int index) {
    setState(() => _currentIndex = index);
    context.go(_tabs[index]);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: widget.child,
      floatingActionButton: FloatingActionButton(
        tooltip: 'Registrar',
        onPressed: () => _showLogBottomSheet(context),
        child: const Icon(Icons.add),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      bottomNavigationBar: BottomAppBar(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            for (int i = 0; i < _tabs.length; i++) ...[
              // Espaço central para o FAB
              if (i == 1) const SizedBox(width: 64),
              IconButton(
                icon: Icon(_icons[i]),
                isSelected: _currentIndex == i,
                tooltip: _labels[i],
                onPressed: () => _onTap(i),
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _showLogBottomSheet(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      builder: (_) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ListTile(
            leading: const Icon(Icons.monitor_weight_outlined),
            title: const Text('Registrar peso'),
            onTap: () {
              Navigator.pop(context);
              // TODO: ir para /pet/:petId/logs/weight/add
            },
          ),
          ListTile(
            leading: const Icon(Icons.camera_alt_outlined),
            title: const Text('Registrar fezes'),
            onTap: () {
              Navigator.pop(context);
              // TODO: ir para /pet/:petId/logs/feces/add
            },
          ),
          ListTile(
            leading: const Icon(Icons.check_circle_outline),
            title: const Text('Marcar dieta do dia'),
            onTap: () {
              Navigator.pop(context);
              // TODO: ir para /pet/:petId/diet/compliance
            },
          ),
        ],
      ),
    );
  }
}
