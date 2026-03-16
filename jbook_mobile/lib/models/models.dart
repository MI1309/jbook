class User {
  final int id;
  final String username;
  final String email;
  final int levelTarget;
  final bool isAdmin;


  User({
    required this.id,
    required this.username,
    required this.email,
    required this.levelTarget,
    this.isAdmin = false,
  });


  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      username: json['username'],
      email: json['email'],
      levelTarget: json['level_target'] ?? 5,
      isAdmin: json['is_staff'] ?? false,
    );
  }


  Map<String, dynamic> toJson() => {
    'id': id,
    'username': username,
    'email': email,
    'level_target': levelTarget,
    'is_staff': isAdmin,
  };
}


class Kanji {
  final String id;
  final String character;
  final String meaning;
  final List<String> onyomi;
  final List<String> kunyomi;
  final int strokes;
  final int jlptLevel;

  Kanji({
    required this.id,
    required this.character,
    required this.meaning,
    required this.onyomi,
    required this.kunyomi,
    required this.strokes,
    required this.jlptLevel,
  });

  factory Kanji.fromJson(Map<String, dynamic> json) {
    return Kanji(
      id: json['id'],
      character: json['character'],
      meaning: json['meaning'],
      onyomi: List<String>.from(json['onyomi'] ?? []),
      kunyomi: List<String>.from(json['kunyomi'] ?? []),
      strokes: json['strokes'] ?? 0,
      jlptLevel: json['jlpt_level'] ?? 5,
    );
  }

  Map<String, dynamic> toMap() => {
    'id': id,
    'character': character,
    'meaning': meaning,
    'onyomi': onyomi.join(','),
    'kunyomi': kunyomi.join(','),
    'strokes': strokes,
    'jlpt_level': jlptLevel,
  };

  factory Kanji.fromMap(Map<String, dynamic> map) {
    return Kanji(
      id: map['id'],
      character: map['character'],
      meaning: map['meaning'],
      onyomi: (map['onyomi'] as String).isEmpty ? [] : (map['onyomi'] as String).split(','),
      kunyomi: (map['kunyomi'] as String).isEmpty ? [] : (map['kunyomi'] as String).split(','),
      strokes: map['strokes'],
      jlptLevel: map['jlpt_level'],
    );
  }
}

class Vocab {
  final String id;
  final String word;
  final String reading;
  final String? furigana;
  final String meaning;
  final int jlptLevel;

  Vocab({
    required this.id,
    required this.word,
    required this.reading,
    this.furigana,
    required this.meaning,
    required this.jlptLevel,
  });

  factory Vocab.fromJson(Map<String, dynamic> json) {
    return Vocab(
      id: json['id'],
      word: json['word'],
      reading: json['reading'],
      furigana: json['furigana'],
      meaning: json['meaning'],
      jlptLevel: json['jlpt_level'] ?? 5,
    );
  }

  Map<String, dynamic> toMap() => {
    'id': id,
    'word': word,
    'reading': reading,
    'furigana': furigana,
    'meaning': meaning,
    'jlpt_level': jlptLevel,
  };

  factory Vocab.fromMap(Map<String, dynamic> map) {
    return Vocab(
      id: map['id'],
      word: map['word'],
      reading: map['reading'],
      furigana: map['furigana'],
      meaning: map['meaning'],
      jlptLevel: map['jlpt_level'],
    );
  }
}

class Grammar {
  final String id;
  final String title;
  final String structure;
  final String explanation;
  final int chapter;
  final int jlptLevel;

  Grammar({
    required this.id,
    required this.title,
    required this.structure,
    required this.explanation,
    required this.chapter,
    required this.jlptLevel,
  });

  factory Grammar.fromJson(Map<String, dynamic> json) {
    return Grammar(
      id: json['id'],
      title: json['title'],
      structure: json['structure'],
      explanation: json['explanation'],
      chapter: json['chapter'] ?? 0,
      jlptLevel: json['jlpt_level'] ?? 5,
    );
  }

  Map<String, dynamic> toMap() => {
    'id': id,
    'title': title,
    'structure': structure,
    'explanation': explanation,
    'chapter': chapter,
    'jlpt_level': jlptLevel,
  };

  factory Grammar.fromMap(Map<String, dynamic> map) {
    return Grammar(
      id: map['id'],
      title: map['title'],
      structure: map['structure'],
      explanation: map['explanation'],
      chapter: map['chapter'],
      jlptLevel: map['jlpt_level'],
    );
  }
}

class QuizOption {
  final String text;
  final bool isCorrect;

  QuizOption({required this.text, required this.isCorrect});

  factory QuizOption.fromJson(Map<String, dynamic> json) {
    return QuizOption(
      text: json['text'],
      isCorrect: json['is_correct'],
    );
  }
}

class Question {
  final String id;
  final String character;
  final String type;
  final List<QuizOption> options;
  final String? reading;
  final String? meaning;

  Question({
    required this.id,
    required this.character,
    required this.type,
    required this.options,
    this.reading,
    this.meaning,
  });

  factory Question.fromJson(Map<String, dynamic> json) {
    return Question(
      id: json['id'],
      character: json['character'],
      type: json['type'],
      options: (json['options'] as List).map((o) => QuizOption.fromJson(o)).toList(),
      reading: json['reading'],
      meaning: json['meaning'],
    );
  }
}

class QuizResult {
  final String questionId;
  final String type;
  final bool isCorrect;
  final String? answerGiven;

  QuizResult({
    required this.questionId,
    required this.type,
    required this.isCorrect,
    this.answerGiven,
  });

  Map<String, dynamic> toJson() => {
    'question_id': questionId,
    'type': type,
    'is_correct': isCorrect,
    'answer_given': answerGiven,
  };
}
