import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/models.dart';

class DatabaseHelper {
  static final DatabaseHelper instance = DatabaseHelper._init();
  static Database? _database;

  DatabaseHelper._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('jbook.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 2,
      onCreate: _createDB,
      onUpgrade: _onUpgrade,
    );
  }

  Future _onUpgrade(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      await db.execute('''
CREATE TABLE IF NOT EXISTS sync_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
)
''');
    }
  }

  Future _createDB(Database db, int version) async {
    const idType = 'TEXT PRIMARY KEY';
    const textType = 'TEXT NOT NULL';
    const boolType = 'BOOLEAN NOT NULL';
    const integerType = 'INTEGER NOT NULL';
    const nullableTextType = 'TEXT';

    await db.execute('''
CREATE TABLE kanji (
  id $idType,
  character $textType,
  meaning $textType,
  onyomi $textType,
  kunyomi $textType,
  strokes $integerType,
  jlpt_level $integerType
)
''');

    await db.execute('''
CREATE TABLE vocab (
  id $idType,
  word $textType,
  reading $textType,
  furigana $nullableTextType,
  meaning $textType,
  jlpt_level $integerType
)
''');

    await db.execute('''
CREATE TABLE grammar (
  id $idType,
  title $textType,
  structure $textType,
  explanation $textType,
  chapter $integerType,
  jlpt_level $integerType
)
''');

    await db.execute('''
CREATE TABLE sync_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
)
''');
  }

  // Kanji CRUD
  Future<void> insertKanji(List<Kanji> kanjiList) async {
    final db = await instance.database;
    final batch = db.batch();
    for (var kanji in kanjiList) {
      batch.insert('kanji', kanji.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  Future<List<Kanji>> getKanji({int? level, String? query}) async {
    final db = await instance.database;
    String whereClause = '';
    List<dynamic> whereArgs = [];

    if (level != null) {
      whereClause += 'jlpt_level = ?';
      whereArgs.add(level);
    }

    if (query != null && query.isNotEmpty) {
      if (whereClause.isNotEmpty) whereClause += ' AND ';
      whereClause += '(character LIKE ? OR meaning LIKE ?)';
      whereArgs.add('%$query%');
      whereArgs.add('%$query%');
    }

    final result = await db.query(
      'kanji',
      where: whereClause.isEmpty ? null : whereClause,
      whereArgs: whereArgs.isEmpty ? null : whereArgs,
      orderBy: 'jlpt_level, strokes',
    );

    return result.map((json) => Kanji.fromMap(json)).toList();
  }

  // Vocab CRUD
  Future<void> insertVocab(List<Vocab> vocabList) async {
    final db = await instance.database;
    final batch = db.batch();
    for (var vocab in vocabList) {
      batch.insert('vocab', vocab.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  Future<List<Vocab>> getVocab({int? level, String? query}) async {
    final db = await instance.database;
    String whereClause = '';
    List<dynamic> whereArgs = [];

    if (level != null) {
      whereClause += 'jlpt_level = ?';
      whereArgs.add(level);
    }

    if (query != null && query.isNotEmpty) {
      if (whereClause.isNotEmpty) whereClause += ' AND ';
      whereClause += '(word LIKE ? OR reading LIKE ? OR meaning LIKE ?)';
      whereArgs.add('%$query%');
      whereArgs.add('%$query%');
      whereArgs.add('%$query%');
    }

    final result = await db.query(
      'vocab',
      where: whereClause.isEmpty ? null : whereClause,
      whereArgs: whereArgs.isEmpty ? null : whereArgs,
      orderBy: 'word',
    );

    return result.map((json) => Vocab.fromMap(json)).toList();
  }

  // Grammar CRUD
  Future<void> insertGrammar(List<Grammar> grammarList) async {
    final db = await instance.database;
    final batch = db.batch();
    for (var grammar in grammarList) {
      batch.insert('grammar', grammar.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  Future<List<Grammar>> getGrammar({int? level, String? query}) async {
    final db = await instance.database;
    String whereClause = '';
    List<dynamic> whereArgs = [];

    if (level != null) {
      whereClause += 'jlpt_level = ?';
      whereArgs.add(level);
    }

    if (query != null && query.isNotEmpty) {
      if (whereClause.isNotEmpty) whereClause += ' AND ';
      whereClause += '(title LIKE ? OR explanation LIKE ?)';
      whereArgs.add('%$query%');
      whereArgs.add('%$query%');
    }

    final result = await db.query(
      'grammar',
      where: whereClause.isEmpty ? null : whereClause,
      whereArgs: whereArgs.isEmpty ? null : whereArgs,
      orderBy: 'chapter, title',
    );

    return result.map((json) => Grammar.fromMap(json)).toList();
  }

  // Sync Meta
  Future<void> saveSyncMeta(String key, String value) async {
    final db = await instance.database;
    await db.insert(
      'sync_meta',
      {'key': key, 'value': value},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<String?> getSyncMeta(String key) async {
    final db = await instance.database;
    final result = await db.query('sync_meta', where: 'key = ?', whereArgs: [key]);
    if (result.isEmpty) return null;
    return result.first['value'] as String?;
  }

  Future close() async {
    final db = await instance.database;
    db.close();
  }
}
