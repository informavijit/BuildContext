import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      home: HomeScreen(),
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  Future<void> fetchData() async {
    final response = await http.get(Uri.parse('http://localhost:3000/api/v1/orders'));
    print(response.body);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Orders Flutter App')),
      body: Center(
        child: ElevatedButton(
          onPressed: fetchData,
          child: const Text('Fetch Orders'),
        ),
      ),
    );
  }
}
