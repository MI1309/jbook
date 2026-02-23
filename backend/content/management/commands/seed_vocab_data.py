from django.core.management.base import BaseCommand
from content.models import Vocab, JLPTLevel

class Command(BaseCommand):
    help = 'Seeds the database with JLPT N5-N1 vocabulary'

    def handle(self, *args, **kwargs):
        vocab_data = {
            JLPTLevel.N5: [
                {"word": "私", "reading": "わたし", "meaning": "Saya", "examples": [{"sentence": "私は学生です。", "meaning": "Saya adalah siswa."}]},
                {"word": "猫", "reading": "ねこ", "meaning": "Kucing", "examples": [{"sentence": "猫が好きです。", "meaning": "Saya suka kucing."}]},
                {"word": "犬", "reading": "いぬ", "meaning": "Anjing", "examples": [{"sentence": "犬がいます。", "meaning": "Ada anjing."}]},
                {"word": "本", "reading": "ほん", "meaning": "Buku", "examples": [{"sentence": "本を読みます。", "meaning": "Membaca buku."}]},
                {"word": "食べる", "reading": "たべる", "meaning": "Makan", "examples": [{"sentence": "ご飯を食べます。", "meaning": "Makan nasi."}]},
                {"word": "飲む", "reading": "のむ", "meaning": "Minum", "examples": [{"sentence": "水を飲みます。", "meaning": "Minum air."}]},
                {"word": "見る", "reading": "みる", "meaning": "Melihat", "examples": [{"sentence": "テレビを見ます。", "meaning": "Menonton TV."}]},
                {"word": "行く", "reading": "いく", "meaning": "Pergi", "examples": [{"sentence": "学校へ行きます。", "meaning": "Pergi ke sekolah."}]},
                {"word": "来る", "reading": "くる", "meaning": "Datang", "examples": [{"sentence": "友達が来ます。", "meaning": "Teman datang."}]},
                {"word": "大きい", "reading": "おおきい", "meaning": "Besar", "examples": [{"sentence": "大きい家です。", "meaning": "Rumah besar."}]},
                {"word": "小さい", "reading": "ちいさい", "meaning": "Kecil", "examples": [{"sentence": "小さい車です。", "meaning": "Mobil kecil."}]},
                {"word": "新しい", "reading": "あたらしい", "meaning": "Baru", "examples": [{"sentence": "新しい本です。", "meaning": "Buku baru."}]},
                {"word": "古い", "reading": "ふるい", "meaning": "Lama/Tua", "examples": [{"sentence": "古い時計です。", "meaning": "Jam lama."}]},
                {"word": "今日", "reading": "きょう", "meaning": "Hari ini", "examples": [{"sentence": "今日は暑いです。", "meaning": "Hari ini panas."}]},
                {"word": "明日", "reading": "あした", "meaning": "Besok", "examples": [{"sentence": "明日また会いましょう。", "meaning": "Sampai jumpa besok."}]},
                {"word": "昨日", "reading": "きのう", "meaning": "Kemarin", "examples": [{"sentence": "昨日は雨でした。", "meaning": "Kemarin hujan."}]},
                {"word": "学校", "reading": "がっこう", "meaning": "Sekolah", "examples": [{"sentence": "学校で勉強します。", "meaning": "Belajar di sekolah."}]},
                {"word": "先生", "reading": "せんせい", "meaning": "Guru", "examples": [{"sentence": "先生、質問があります。", "meaning": "Guru, saya ada pertanyaan."}]},
                {"word": "学生", "reading": "がくせい", "meaning": "Siswa", "examples": [{"sentence": "彼は留学生です。", "meaning": "Dia adalah pelajar asing."}]},
                {"word": "友達", "reading": "ともだち", "meaning": "Teman", "examples": [{"sentence": "友達と遊びます。", "meaning": "Bermain dengan teman."}]},
            ],
            JLPTLevel.N4: [
                {"word": "会議", "reading": "かいぎ", "meaning": "Rapat", "examples": [{"sentence": "会議があります。", "meaning": "Ada rapat."}]},
                {"word": "準備", "reading": "じゅんび", "meaning": "Persiapan", "examples": [{"sentence": "旅行の準備をします。", "meaning": "Melakukan persiapan perjalanan."}]},
                {"word": "手伝う", "reading": "てつだう", "meaning": "Membantu", "examples": [{"sentence": "母を手伝います。", "meaning": "Membantu ibu."}]},
                {"word": "送る", "reading": "おくる", "meaning": "Mengirim", "examples": [{"sentence": "荷物を送ります。", "meaning": "Mengirim paket."}]},
                {"word": "急ぐ", "reading": "いそぐ", "meaning": "Buru-buru", "examples": [{"sentence": "急いでください。", "meaning": "Tolong buru-buru."}]},
                {"word": "特別", "reading": "とくべつ", "meaning": "Spesial/Khusus", "examples": [{"sentence": "特別な日です。", "meaning": "Hari yang spesial."}]},
                {"word": "特に", "reading": "とくに", "meaning": "Terutama", "examples": [{"sentence": "特に理由はありません。", "meaning": "Tidak ada alasan khusus."}]},
                {"word": "見つける", "reading": "みつける", "meaning": "Menemukan", "examples": [{"sentence": "鍵を見つけました。", "meaning": "Saya menemukan kunci."}]},
                {"word": "決める", "reading": "きめる", "meaning": "Memutuskan", "examples": [{"sentence": "予定を決めます。", "meaning": "Menentukan jadwal."}]},
                {"word": "止まる", "reading": "とまる", "meaning": "Berhenti", "examples": [{"sentence": "時計が止まりました。", "meaning": "Jamnya berhenti."}]},
                {"word": "住所", "reading": "じゅうしょ", "meaning": "Alamat", "examples": [{"sentence": "住所を教えてください。", "meaning": "Tolong beritahu alamatnya."}]},
                {"word": "経験", "reading": "けいけん", "meaning": "Pengalaman", "examples": [{"sentence": "良い経験になりました。", "meaning": "Menjadi pengalaman yang baik."}]},
                {"word": "習慣", "reading": "しゅうかん", "meaning": "Kebiasaan", "examples": [{"sentence": "早起きは良い習慣です。", "meaning": "Bangun pagi adalah kebiasaan baik."}]},
                {"word": "生産", "reading": "せいさん", "meaning": "Produksi", "examples": [{"sentence": "車の生産が増えました。", "meaning": "Produksi mobil meningkat."}]},
                {"word": "経済", "reading": "けいざい", "meaning": "Ekonomi", "examples": [{"sentence": "経済のニュースを見ます。", "meaning": "Melihat berita ekonomi."}]},
            ],
            JLPTLevel.N3: [
                {"word": "情報", "reading": "じょうほう", "meaning": "Informasi", "examples": [{"sentence": "情報を集めます。", "meaning": "Mengumpulkan informasi."}]},
                {"word": "自然", "reading": "しぜん", "meaning": "Alam", "examples": [{"sentence": "自然を大切にします。", "meaning": "Menjaga alam."}]},
                {"word": "環境", "reading": "かんきょう", "meaning": "Lingkungan", "examples": [{"sentence": "環境問題について考えます。", "meaning": "Berpikir tentang masalah lingkungan."}]},
                {"word": "表現", "reading": "ひょうげん", "meaning": "Ekspresi", "examples": [{"sentence": "自由な表現。", "meaning": "Ekspresi bebas."}]},
                {"word": "技術", "reading": "ぎじゅつ", "meaning": "Teknologi/Teknik", "examples": [{"sentence": "新しい技術を学びます。", "meaning": "Mempelajari teknologi baru."}]},
                {"word": "成功", "reading": "せいこう", "meaning": "Sukses", "examples": [{"sentence": "実験は成功しました。", "meaning": "Eksperimennya sukses."}]},
                {"word": "失敗", "reading": "しっぱい", "meaning": "Gagal", "examples": [{"sentence": "失敗から学びます。", "meaning": "Belajar dari kegagalan."}]},
                {"word": "可能性", "reading": "かのうせい", "meaning": "Kemungkinan", "examples": [{"sentence": "その可能性は高いです。", "meaning": "Kemungkinannya tinggi."}]},
                {"word": "開発", "reading": "かいはつ", "meaning": "Pengembangan", "examples": [{"sentence": "新製品を開発します。", "meaning": "Mengembangkan produk baru."}]},
                {"word": "調査", "reading": "ちょうさ", "meaning": "Investigasi/Survei", "examples": [{"sentence": "アンケート調査を行います。", "meaning": "Melakukan survei angket."}]},
                {"word": "国際", "reading": "こくさい", "meaning": "Internasional", "examples": [{"sentence": "国際的な会議。", "meaning": "Konferensi internasional."}]},
                {"word": "関係", "reading": "かんけい", "meaning": "Hubungan", "examples": [{"sentence": "良い関係を築きます。", "meaning": "Membangun hubungan baik."}]},
                {"word": "変化", "reading": "へんか", "meaning": "Perubahan", "examples": [{"sentence": "大きな変化がありました。", "meaning": "Ada perubahan besar."}]},
                {"word": "健康", "reading": "けんこう", "meaning": "Kesehatan", "examples": [{"sentence": "健康が一番大切です。", "meaning": "Kesehatan adalah yang terpenting."}]},
                {"word": "愛", "reading": "あい", "meaning": "Cinta", "examples": [{"sentence": "愛こそすべて。", "meaning": "Cinta adalah segalanya."}]},
            ],
            JLPTLevel.N2: [
                {"word": "影響", "reading": "えいきょう", "meaning": "Pengaruh", "examples": [{"sentence": "良い影響を与えます。", "meaning": "Memberikan pengaruh baik."}]},
                {"word": "効果", "reading": "こうか", "meaning": "Efek", "examples": [{"sentence": "薬の効果が出ました。", "meaning": "Efek obatnya muncul."}]},
                {"word": "現実", "reading": "げんじつ", "meaning": "Kenyataan", "examples": [{"sentence": "現実を受け入れなさい。", "meaning": "Terimalah kenyataan."}]},
                {"word": "価値", "reading": "かち", "meaning": "Nilai", "examples": [{"sentence": "価値のある仕事。", "meaning": "Pekerjaan yang bernilai."}]},
                {"word": "理想", "reading": "りそう", "meaning": "Ideal", "examples": [{"sentence": "理想と現実は違います。", "meaning": "Ideal dan kenyataan berbeda."}]},
                {"word": "解決", "reading": "かいけつ", "meaning": "Penyelesaian", "examples": [{"sentence": "問題が解決しました。", "meaning": "Masalah terpecahkan."}]},
                {"word": "提供", "reading": "ていきょう", "meaning": "Menyediakan", "examples": [{"sentence": "サービスを提供します。", "meaning": "Menyediakan layanan."}]},
                {"word": "管理", "reading": "かんり", "meaning": "Manajemen/Kontrol", "examples": [{"sentence": "スケジュールを管理します。", "meaning": "Mengatur jadwal."}]},
                {"word": "判断", "reading": "はんだん", "meaning": "Keputusan/Penilaian", "examples": [{"sentence": "正しい判断をしてください。", "meaning": "Tolong buat keputusan yang benar."}]},
                {"word": "予測", "reading": "よそく", "meaning": "Prediksi", "examples": [{"sentence": "予測が当たりました。", "meaning": "Prediksinya benar."}]},
                {"word": "傾向", "reading": "けいこう", "meaning": "Kecenderungan", "examples": [{"sentence": "若者の傾向を調べます。", "meaning": "Meneliti kecenderungan anak muda."}]},
                {"word": "意識", "reading": "いしき", "meaning": "Kesadaran", "examples": [{"sentence": "意識を高く持ちましょう。", "meaning": "Mari miliki kesadaran yang tinggi."}]},
                {"word": "組織", "reading": "そしき", "meaning": "Organisasi", "examples": [{"sentence": "組織の一員として働きます。", "meaning": "Bekerja sebagai anggota organisasi."}]},
                {"word": "議論", "reading": "ぎろん", "meaning": "Diskusi/Debat", "examples": [{"sentence": "活発な議論が行われました。", "meaning": "Dilakukan diskusi yang aktif."}]},
                {"word": "尊重", "reading": "そんちょう", "meaning": "Menghormati", "examples": [{"sentence": "相手の意見を尊重します。", "meaning": "Menghormati pendapat lawan bicara."}]},
            ],
            JLPTLevel.N1: [
                {"word": "概念", "reading": "がいねん", "meaning": "Konsep", "examples": [{"sentence": "新しい概念を提唱する。", "meaning": "Mengusulkan konsep baru."}]},
                {"word": "哲学", "reading": "てつがく", "meaning": "Filosofi", "examples": [{"sentence": "彼の人生哲学は興味深い。", "meaning": "Filosofi hidupnya menarik."}]},
                {"word": "矛盾", "reading": "むじゅん", "meaning": "Kontradiksi", "examples": [{"sentence": "言っていることに矛盾がある。", "meaning": "Ada kontradiksi pada yang diucapkan."}]},
                {"word": "画期的", "reading": "かっきてき", "meaning": "Inovatif/Groundbreaking", "examples": [{"sentence": "画期的な発明だ。", "meaning": "Ini penemuan yang inovatif."}]},
                {"word": "包括的", "reading": "ほうかつてき", "meaning": "Komprehensif", "examples": [{"sentence": "包括的なアプローチが必要だ。", "meaning": "Diperlukan pendekatan yang komprehensif."}]},
                {"word": "顕著", "reading": "けんちょ", "meaning": "Menonjol/Nyata", "examples": [{"sentence": "顕著な効果が見られた。", "meaning": "Terlihat efek yang nyata."}]},
                {"word": "迅速", "reading": "じんそく", "meaning": "Cepat/Segera", "examples": [{"sentence": "迅速な対応を求める。", "meaning": "Meminta respon cepat."}]},
                {"word": "懸念", "reading": "けねん", "meaning": "Kekhawatiran", "examples": [{"sentence": "安全性が懸念されている。", "meaning": "Keamanannya dikhawatirkan."}]},
                {"word": "撤回", "reading": "てっかい", "meaning": "Penarikan", "examples": [{"sentence": "発言を撤回する。", "meaning": "Menarik kembali ucapan."}]},
                {"word": "妥協", "reading": "だきょう", "meaning": "Kompromi", "examples": [{"sentence": "妥協点を見つける。", "meaning": "Menemukan titik kompromi."}]},
                {"word": "抑制", "reading": "よくせい", "meaning": "Menekan/Menahan", "examples": [{"sentence": "インフレを抑制する。", "meaning": "Menekan inflasi."}]},
                {"word": "促進", "reading": "そくしん", "meaning": "Mempromosikan/Mendorong", "examples": [{"sentence": "健康を促進する。", "meaning": "Mendorong kesehatan."}]},
                {"word": "模索", "reading": "もさく", "meaning": "Meraba-raba/Mencari", "examples": [{"sentence": "解決策を模索する。", "meaning": "Mencari solusi."}]},
                {"word": "還元", "reading": "かんげん", "meaning": "Mengembalikan (Profit dsb)", "examples": [{"sentence": "利益を社会に還元する。", "meaning": "Mengembalikan keuntungan ke masyarakat."}]},
                {"word": "享受", "reading": "きょうじゅ", "meaning": "Menikmati (Benefit)", "examples": [{"sentence": "自由を享受する。", "meaning": "Menikmati kebebasan."}]},
            ],
        }

        total_created = 0
        total_updated = 0

        for level, words in vocab_data.items():
            self.stdout.write(f"Processing Level N{level}...")
            for data in words:
                obj, created = Vocab.objects.update_or_create(
                    word=data['word'],
                    defaults={
                        'reading': data['reading'],
                        'meaning': data['meaning'],
                        'jlpt_level': level,
                        'examples': data.get('examples', [])
                    }
                )
                if created:
                    total_created += 1
                else:
                    total_updated += 1

        self.stdout.write(self.style.SUCCESS(f"Finished! Created: {total_created}, Updated: {total_updated}"))
