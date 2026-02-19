from django.core.management.base import BaseCommand
from content.models import Vocab

class Command(BaseCommand):
    help = 'Add example sentences to existing vocabulary'

    def handle(self, *args, **kwargs):
        examples_map = {
            '私': [
                {'sentence': '私は学生です。', 'meaning': 'Saya adalah seorang siswa.'},
                {'sentence': '私はコーヒーが好きです。', 'meaning': 'Saya suka kopi.'}
            ],
            '猫': [
                {'sentence': '猫が好きです。', 'meaning': 'Saya suka kucing.'},
                {'sentence': 'そこに猫がいます。', 'meaning': 'Ada kucing di sana.'}
            ],
            '犬': [
                {'sentence': '犬が走っています。', 'meaning': 'Anjing sedang berlari.'},
                {'sentence': '私の犬は大きいです。', 'meaning': 'Anjing saya besar.'}
            ],
            '本': [
                {'sentence': '本を読みます。', 'meaning': 'Membaca buku.'},
                {'sentence': 'これは私の本です。', 'meaning': 'Ini adalah buku saya.'}
            ],
            '学校': [
                {'sentence': '学校に行きます。', 'meaning': 'Pergi ke sekolah.'},
                {'sentence': '学校は近いです。', 'meaning': 'Sekolahnya dekat.'}
            ],
            '先生': [
                {'sentence': 'あの人は先生です。', 'meaning': 'Orang itu adalah guru.'},
                {'sentence': '先生に質問します。', 'meaning': 'Bertanya kepada guru.'}
            ],
            '学生': [
                {'sentence': '彼は真面目な学生です。', 'meaning': 'Dia adalah siswa yang rajin.'},
                {'sentence': '多くの学生がいます。', 'meaning': 'Ada banyak siswa.'}
            ],
            '食べる': [
                {'sentence': '朝ごはんを食べます。', 'meaning': 'Makan sarapan.'},
                {'sentence': '寿司を食べたいです。', 'meaning': 'Saya ingin makan sushi.'}
            ],
            '飲む': [
                {'sentence': '水を飲みます。', 'meaning': 'Minum air.'},
                {'sentence': 'お茶を飲みませんか。', 'meaning': 'Maukah minum teh?'}
            ],
            '行く': [
                {'sentence': '日本へ行きたいです。', 'meaning': 'Saya ingin pergi ke Jepang.'},
                {'sentence': '買い物に行きます。', 'meaning': 'Pergi berbelanja.'}
            ],
            '来る': [
                {'sentence': '明日、友達が来ます。', 'meaning': 'Besok, teman akan datang.'},
                {'sentence': 'こっちに来てください。', 'meaning': 'Tolong datang ke sini.'}
            ],
            '大きい': [
                {'sentence': '象は大きいです。', 'meaning': 'Gajah itu besar.'},
                {'sentence': '大きな家ですね。', 'meaning': 'Rumah yang besar ya.'}
            ],
            '小さい': [
                {'sentence': 'これは小さいです。', 'meaning': 'Ini kecil.'},
                {'sentence': '小さい声で話してください。', 'meaning': 'Tolong bicara dengan suara kecil.'}
            ],
            '新しい': [
                {'sentence': '新しい車を買いました。', 'meaning': 'Saya membeli mobil baru.'},
                {'sentence': 'これは新しい本です。', 'meaning': 'Ini buku baru.'}
            ],
            '古い': [
                {'sentence': 'この建物は古いです。', 'meaning': 'Bangunan ini tua.'},
                {'sentence': '古い友達に会いました。', 'meaning': 'Bertemu teman lama.'}
            ],
            '明日': [
                {'sentence': '明日は晴れるでしょう。', 'meaning': 'Besok mungkin akan cerah.'},
                {'sentence': '明日また会いましょう。', 'meaning': 'Sampai jumpa besok lagi.'}
            ],
            '今日': [
                {'sentence': '今日は暑いです。', 'meaning': 'Hari ini panas.'},
                {'sentence': '今日の予定は何ですか。', 'meaning': 'Apa rencana hari ini?'}
            ],
            '昨日': [
                {'sentence': '昨日は雨でした。', 'meaning': 'Kemarin hujan.'},
                {'sentence': '昨日、映画を見ました。', 'meaning': 'Kemarin saya menonton film.'}
            ],
            '家族': [
                {'sentence': '私の家族は四人です。', 'meaning': 'Keluarga saya ada 4 orang.'},
                {'sentence': '家族に手紙を書きます。', 'meaning': 'Menulis surat untuk keluarga.'}
            ],
            '友達': [
                {'sentence': '友達と遊びます。', 'meaning': 'Bermain dengan teman.'},
                {'sentence': '彼は私の親友です。', 'meaning': 'Dia adalah sahabat saya.'}
            ]
        }

        updated_count = 0
        for word, examples in examples_map.items():
            vocab = Vocab.objects.filter(word=word).first()
            if vocab:
                vocab.examples = examples
                vocab.save()
                updated_count += 1
                self.stdout.write(self.style.SUCCESS(f'Updated examples for {word}'))
            else:
                self.stdout.write(self.style.WARNING(f'Word not found: {word}'))

        self.stdout.write(self.style.SUCCESS(f'Successfully updated {updated_count} vocabs'))
