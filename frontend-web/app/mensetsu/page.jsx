'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    Volume2, 
    ArrowLeft, 
    ChevronRight, 
    Briefcase,
    Info
} from 'lucide-react';

export default function MensetsuPage() {
    const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // Common Mensetsu questions & answers data
    const mensetsuData = [
        {
            id: 'jikoshoukai',
            title: 'Jikoshoukai (Perkenalan Diri)',
            questionJp: '自己紹介をしてください。',
            questionReading: 'じこしょうかいをしてください。 (Jikoshoukai wo shite kudasai.)',
            questionTranslation: 'Silakan perkenalkan diri Anda.',
            answerJp: 'はじめまして。私はアディと申します。インドネシアのジャカルタ dari 出身です。年齢は２４歳です。大学でＩＴを専攻し、プログラミングやネットワークについて学びました。性格は真面目で、新しいことを学ぶのが好きです。本日はどうぞよろしくお願いいたします。',
            answerReading: 'はじめまして。わたしはアディともうします。インドネシアのジャカルタからしゅっしんです。ねんれいはにじゅうよんさいです。だいがくでアイティーをせんこうし、プログラミングやネットワークについてまなびました。せいかくはまじめで、あたらしいことをまなぶのがすきです。ほんじつはどうぞよろしくおねがいいたします。 (Hajimemashite. Watashi wa Adi to moushimasu. Indonesia no Jakarta kara shusshin desu. Nenrei wa nijuuyonsai desu. Daigaku de aitee wo senkou shi, puroguramingu ya nettowaaku ni tsuite manabimashita. Seikaku wa majime de, atarashii koto wo manabu no ga suki desu. Honjitsu wa douzo yoroshiku onegai itashimasu.)',
            answerTranslation: 'Perkenalkan. Nama saya Adi. Saya berasal dari Jakarta, Indonesia. Umur saya 24 tahun. Di universitas saya mengambil jurusan TI, dan mempelajari tentang pemrograman serta jaringan. Kepribadian saya rajin, dan saya suka mempelajari hal-hal baru. Hari ini mohon bantuannya.',
            vocab: [
                { jp: '自己紹介 (jikoshoukai)', mean: 'Perkenalan diri' },
                { jp: '申します (moushimasu)', mean: 'Bernama (Bentuk Keigo/sopan dari "iu")' },
                { jp: '出身 (shusshin)', mean: 'Asal daerah/negara' },
                { jp: '専攻 (senkou)', mean: 'Jurusan kuliah' },
                { jp: '真面目 (majime)', mean: 'Rajin / serius' }
            ],
            tips: 'Jikoshoukai adalah kesan pertama Anda. Jawab dengan percaya diri, posisi punggung tegak, intonasi suara yang ceria dan jelas. Jangan bicara terlalu lambat atau terlalu cepat (sekitar 1-2 menit).'
        },
        {
            id: 'shibou-douki',
            title: 'Shibou Douki (Alasan Melamar)',
            questionJp: 'どうして日本で働きたいのですか。',
            questionReading: 'どうしてにほんではたらきたいのですか。 (Doushite Nihon de hatarakitai no desu ka?)',
            questionTranslation: 'Mengapa Anda ingin bekerja di Jepang?',
            answerJp: '日本の先進的な技術と強い仕事の倫理に深く感銘を受けたからです。日本で働くことで、自分の専門的な技術を向上させ、日本の素晴らしい仕事の文化を直接学びたいと考えております。また、将来は日本とインドネシアの架け橋となるようなエンジニアになりたいです。',
            answerReading: 'にほんのせんしんてきなぎじゅつとつよいしごとのりんりにふかくかんめいをうけたからです。にほんではたらくことで、じぶんのせんもんてきなぎじゅつをこうじょうさせ、にほんのすばらしいしごとのぶんかをちょくせつまなびたいとかんがえております。また、しょうらいはにほんとインドネシアのかけはしとなるようなエンジニアになりたいです。 (Nihon no senshinteki na gijutsu to tsuyoi shigoto no rinri ni fukaku kanmei wo uketa kara desu. Nihon de hataraku koto de, jibun no senmonteki na gijutsu wo koujou sase, Nihon no subarashii shigoto no bunka wo chokusetsu manabitai to kangaete orimasu. Mata, shourai wa Nihon to Indonesia no kakehashi to naru you na enjinia ni naritai desu.)',
            answerTranslation: 'Karena saya sangat terkesan dengan teknologi maju dan etos kerja yang kuat di Jepang. Dengan bekerja di Jepang, saya ingin meningkatkan keahlian profesional saya dan mempelajari budaya kerja Jepang yang luar biasa secara langsung. Selain itu, di masa depan saya ingin menjadi insinyur yang menjadi jembatan penghubung antara Jepang dan Indonesia.',
            vocab: [
                { jp: '先進的 (senshinteki)', mean: 'Maju / mutakhir' },
                { jp: '倫理 (rinri)', mean: 'Etika / etos' },
                { jp: '感銘を受ける (kanmei wo ukeru)', mean: 'Terkesan / terinspirasi' },
                { jp: '向上させる (koujou saseru)', mean: 'Meningkatkan' },
                { jp: '架け橋 (kakehashi)', mean: 'Jembatan penghubung' }
            ],
            tips: 'Tunjukkan motivasi yang positif. Fokus pada kontribusi apa yang ingin Anda berikan dan keahlian apa yang ingin Anda asah, alih-alih hanya berfokus pada gaji atau tunjangan.'
        },
        {
            id: 'chousho-tansho',
            title: 'Chousho to Tansho (Kelebihan & Kekurangan)',
            questionJp: 'あなたの長所と短所は何ですか。',
            questionReading: 'あなたのちょうしょとたんしょはなんですか。 (Anata no chousho to tansho wa nan desu ka?)',
            questionTranslation: 'Apa kelebihan dan kekurangan Anda?',
            answerJp: '私の長所は、忍耐強く、問題解決のために最後まで努力することです。短所は、一つのことに集中しすぎて、時間を忘れてしまうことがある点です。そのため、現在はタスクごとにタイマーを設定し、時間管理を徹底するよう努めております。',
            answerReading: 'わたしのちょうしょは、にんたいづよく、もんだいかいけつのためにさいごまでどりょくすることです。たんしょは、ひとつのことにしゅうちゅうしすぎて、じかんをわすれてしまうことがあるてんです。そのため、げんざいはタスクごとにタイマーを設定し、じかんかんりをてっていするようつとめております。 (Watashi no chousho wa, nintaizuyoku, mondai kaiketsu no tame ni saigo made doryoku suru koto desu. Tansho wa, hitotsu no koto ni shuuchuu shisugite, jikan wo wasurete shimau koto ga aru ten desu. Sono tame, genzai wa tasuku goto ni taimaa wo settei shi, jikan kanri wo tettei suru you tsutomete orimasu.)',
            answerTranslation: 'Kelebihan saya adalah penyabar dan selalu berusaha hingga akhir untuk memecahkan masalah. Kekurangan saya adalah terkadang terlalu fokus pada satu hal hingga melupakan waktu. Oleh karena itu, saat ini saya menetapkan pengingat untuk setiap tugas dan berusaha mengelola waktu dengan disiplin ketat.',
            vocab: [
                { jp: '長所 (chousho)', mean: 'Kelebihan / kekuatan' },
                { jp: '短所 (tansho)', mean: 'Kekurangan / kelemahan' },
                { jp: '忍耐強い (nintaizuyoku)', mean: 'Penyabar / memiliki ketahanan' },
                { jp: '時間管理 (jikan kanri)', mean: 'Manajemen waktu' },
                { jp: '徹底する (tettei suru)', mean: 'Melakukan secara tuntas/disiplin' }
            ],
            tips: 'Saat menceritakan kekurangan (tansho), selalu sertakan upaya nyata (action plan) yang sedang Anda lakukan untuk mengatasi kekurangan tersebut agar terlihat sebagai pribadi yang reflektif dan proaktif.'
        },
        {
            id: 'nihon-keikaku',
            title: 'Nihon de no Keikaku (Rencana di Jepang)',
            questionJp: '日本でどのくらい働きたいですか。将来の計画はありますか。',
            questionReading: 'にほんでどのくらいはたらきたいですか。しょうらいのけいかくはありますか。 (Nihon de dono kurai hatarakitai desu ka? Shourai no keikaku wa arimasu ka?)',
            questionTranslation: 'Berapa lama Anda ingin bekerja di Jepang? Apa rencana masa depan Anda?',
            answerJp: '少なくとも５年以上は日本で働き、技術を極めたいと考えております。将来の計画としては、日本でシニアエンジニアになり、チームをリードできるようになりたいです。そして将来インドネシアに帰国した際には、日本で得た知識を活かして、現地の若手エンジニアの育成に貢献したいです。',
            answerReading: 'すくなくともごねんいじょうはにほんではたらき、ぎじゅつをきわめたいとかんがえております。しょうらいのけいかくとしては、にほんでシニアエンジニアになり、チームをリードできるようになりたいです。そしてしょうらいインドネシアにきこくしたさいには、にほんでえたちしきをいかして、げんちのわかてエンジニアのいくせいにこうけんしたいです。 (Sukunakutomo gonen ijou wa Nihon de hataraki, gijutsu wo kiwametai to kangaete orimasu. Shourai no keikaku toshite wa, Nihon de shinia enjinia ni nari, chiimu wo riido dekiru you ni naritai desu. Soshite shourai Indonesia ni kikoku shita sai ni wa, Nihon de eta chishiki wo ikashite, genchi no wakate enjinia no ikusei ni kouken shitai desu.)',
            answerTranslation: 'Saya ingin bekerja di Jepang setidaknya selama 5 tahun atau lebih untuk mendalami keahlian saya. Untuk rencana masa depan, saya ingin menjadi insinyur senior di Jepang dan dapat memimpin tim. Dan saat saya kembali ke Indonesia nanti, saya ingin memanfaatkan pengetahuan yang didapat di Jepang untuk berkontribusi melatih insinyur muda setempat.',
            vocab: [
                { jp: '少なくとも (sukunakutomo)', mean: 'Setidaknya / minimal' },
                { jp: '極める (kiwameru)', mean: 'Mendalami / menguasai sepenuhnya' },
                { jp: '帰国 (kikoku)', mean: 'Pulang ke tanah air' },
                { jp: '育成 (ikusei)', mean: 'Pelatihan / pembinaan' },
                { jp: '貢献する (kouken suru)', mean: 'Berkontribusi' }
            ],
            tips: 'Menyebutkan komitmen jangka panjang (seperti 5 tahun atau lebih) sangat disukai perusahaan Jepang karena menunjukkan stabilitas Anda. Menunjukkan rencana karir yang jelas memberikan nilai tambah yang tinggi.'
        }
    ];

    const currentData = mensetsuData[selectedQuestionIndex];

    // Speech Synthesis
    const playSpeech = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop any active speech
            setIsPlaying(true);
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ja-JP';
            utterance.rate = 0.82; // Slightly slower for clear learning
            utterance.onend = () => setIsPlaying(false);
            utterance.onerror = () => setIsPlaying(false);
            window.speechSynthesis.speak(utterance);
        } else {
            alert('Speech Synthesis tidak didukung oleh browser Anda.');
        }
    };

    const stopSpeech = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setTimeout(() => {
                setIsPlaying(false);
            }, 0);
        }
    };

    useEffect(() => {
        // Stop playing speech if question tab changes
        stopSpeech();
    }, [selectedQuestionIndex]);

    return (
        <div className="relative min-h-screen washi-texture bg-background text-foreground transition-colors duration-300 pb-20">
            {/* Header / Navigation bar */}
            <div className="container mx-auto px-6 max-w-5xl pt-8">
                <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-accent-blue transition-colors mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    Kembali ke Homepage
                </Link>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-8 mb-10">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-accent-green uppercase tracking-widest font-japanese mb-2">
                            <Briefcase className="w-4 h-4" />
                            Bab II: Praktik Persiapan Kerja
                        </div>
                        <h1 className="text-4xl md:text-5xl font-japanese font-black tracking-tight leading-none">
                            面接練習 <span className="text-accent-green">Mensetsu Practice</span>
                        </h1>
                        <p className="text-sm text-gray-400 dark:text-gray-500 font-light mt-3 max-w-2xl">
                            Simulasi mandiri untuk melatih pelafalan, menyusun pola jawaban wawancara kerja di Jepang, dan menguasai sopan santun budaya kerja Jepang.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Panel: Question selector (4 cols) */}
                    <div className="lg:col-span-4 space-y-3">
                        <div className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2 font-japanese px-2">
                            Daftar Pertanyaan:
                        </div>
                        
                        {mensetsuData.map((item, idx) => (
                            <button
                                key={item.id}
                                onClick={() => setSelectedQuestionIndex(idx)}
                                className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 font-japanese flex items-center justify-between ${
                                    selectedQuestionIndex === idx
                                        ? 'bg-accent-green/10 border-accent-green text-accent-green font-bold shadow-lg shadow-accent-green/5'
                                        : 'bg-[var(--card-bg)] border-[var(--border-color)] text-gray-400 hover:border-gray-500 hover:text-foreground'
                                }`}
                            >
                                <div className="space-y-1">
                                    <div className="text-[10px] uppercase tracking-widest text-gray-400">Pertanyaan {idx + 1}</div>
                                    <div className="text-sm font-bold leading-tight">{item.title}</div>
                                </div>
                                <ChevronRight className={`w-4 h-4 ${selectedQuestionIndex === idx ? 'text-accent-green' : 'text-gray-400'}`} />
                            </button>
                        ))}

                        {/* Manners tip side card */}
                        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-[2rem] p-5 mt-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 select-none text-accent-green/10 text-6xl font-japanese font-black">
                                礼
                            </div>
                            <h4 className="text-xs font-black uppercase text-accent-green tracking-widest font-japanese border-b border-[var(--border-color)] pb-2 mb-3">
                                Tata Krama (Ojigi)
                            </h4>
                            <div className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed space-y-2">
                                <p>
                                    <strong className="text-foreground">Keirei (敬礼):</strong> Membungkuk 30 derajat saat memberikan salam pembuka (&ldquo;Yoroshiku onegai itashimasu&rdquo;) dan penutup (&ldquo;Shitsurei shimasu&rdquo;).
                                </p>
                                <p>
                                    Jaga pandangan tetap lurus ke bawah searah dengan kemiringan tubuh saat membungkuk, bukan melihat ke arah pewawancara.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Content simulation (8 cols) */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        {/* Simulation Card */}
                        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-[2.5rem] p-6 md:p-8 book-page-shadow relative">
                            {/* Accent Glow Icon */}
                            <div className="absolute top-6 right-6 w-12 h-12 bg-accent-green/10 rounded-full flex items-center justify-center text-accent-green">
                                <Volume2 className="w-5 h-5" />
                            </div>

                            {/* Section Header */}
                            <div className="border-b border-[var(--border-color)] pb-4 mb-6">
                                <div className="text-xs font-bold text-accent-green uppercase tracking-widest mb-1">
                                    Simulasi Wawancara - {currentData.title}
                                </div>
                                <h3 className="text-2xl font-japanese font-black text-foreground">
                                    {currentData.title}
                                </h3>
                            </div>

                            {/* Question Section */}
                            <div className="space-y-3 mb-8 bg-white/5 border border-[var(--border-color)] p-5 rounded-[1.5rem]">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase text-accent-green tracking-widest font-japanese">Pertanyaan Pewawancara</span>
                                    <button 
                                        onClick={() => playSpeech(currentData.questionJp)}
                                        className="inline-flex items-center gap-1 text-[10px] font-bold text-accent-green hover:underline"
                                    >
                                        Dengarkan Pertanyaan
                                    </button>
                                </div>
                                <p className="text-xl font-japanese font-black text-foreground">
                                    {currentData.questionJp}
                                </p>
                                <p className="text-xs text-gray-500 font-light italic">
                                    {currentData.questionReading}
                                </p>
                                <div className="h-px bg-[var(--border-color)] my-2"></div>
                                <p className="text-xs text-gray-400 font-bold">
                                    Terjemahan: <span className="font-medium italic">&quot;{currentData.questionTranslation}&quot;</span>
                                </p>
                            </div>

                            {/* Answer Section */}
                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase text-accent-blue tracking-widest font-japanese">Contoh Pola Jawaban</span>
                                    <div className="flex gap-2">
                                        {isPlaying ? (
                                            <button 
                                                onClick={stopSpeech}
                                                className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700 transition-all"
                                            >
                                                Hentikan Suara
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => playSpeech(currentData.answerJp)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent-green text-white rounded-lg text-[10px] font-bold hover:bg-accent-green/90 transition-all shadow-md shadow-accent-green/5"
                                            >
                                                <Volume2 className="w-3 h-3" />
                                                Putar Suara (TTS)
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="p-6 bg-white/5 border border-[var(--border-color)] rounded-[2rem] space-y-4">
                                    <p className="text-lg font-japanese font-medium leading-relaxed text-foreground">
                                        {currentData.answerJp}
                                    </p>
                                    <p className="text-xs text-gray-500 leading-relaxed font-light font-japanese">
                                        {currentData.answerReading}
                                    </p>
                                    <div className="h-px bg-[var(--border-color)] my-3"></div>
                                    <div className="text-xs text-gray-400 font-bold leading-relaxed">
                                        Terjemahan Jawaban:
                                        <p className="font-light italic text-gray-300 mt-1">&ldquo;{currentData.answerTranslation}&rdquo;</p>
                                    </div>
                                </div>
                            </div>

                            {/* Vocabulary Section */}
                            <div className="mb-8">
                                <span className="text-[10px] font-black uppercase text-accent-gold tracking-widest font-japanese block mb-3">Kosakata Penting (語彙)</span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {currentData.vocab.map((v, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 border border-[var(--border-color)] rounded-xl text-xs bg-white/5">
                                            <span className="font-japanese font-bold text-foreground">{v.jp}</span>
                                            <span className="text-gray-400 italic text-[10px]">{v.mean}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Tips Section */}
                            <div className="p-5 bg-accent-blue/5 border border-accent-blue/10 rounded-[1.5rem] flex items-start gap-3">
                                <Info className="w-5 h-5 text-accent-blue flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-xs font-bold text-accent-blue mb-1">Tip Ujian Mensetsu JBook:</h4>
                                    <p className="text-xs text-gray-400 leading-relaxed font-light">
                                        {currentData.tips}
                                    </p>
                                </div>
                            </div>

                        </div>

                        {/* Interactive shadow practice steps */}
                        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-[2.5rem] p-6 md:p-8">
                            <h3 className="text-sm font-black uppercase text-foreground tracking-wider mb-4 font-japanese">
                                Alur Berlatih yang Direkomendasikan
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <div className="w-8 h-8 rounded-full bg-accent-blue/10 text-accent-blue flex items-center justify-center text-xs font-bold">1</div>
                                    <h4 className="text-xs font-bold text-foreground">Dengarkan & Shadowing</h4>
                                    <p className="text-[10px] text-gray-400 font-light leading-relaxed">
                                        Putar audio pelafalan berkali-kali. Tirukan intonasi, cara penekanan, dan pemenggalan kalimat yang tepat.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <div className="w-8 h-8 rounded-full bg-accent-green/10 text-accent-green flex items-center justify-center text-xs font-bold">2</div>
                                    <h4 className="text-xs font-bold text-foreground">Sesuaikan Isi Jawaban</h4>
                                    <p className="text-[10px] text-gray-400 font-light leading-relaxed">
                                        Ganti detail data di dalam kurung/contoh (seperti nama, umur, jurusan, asal daerah) dengan data asli Anda sendiri.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <div className="w-8 h-8 rounded-full bg-accent-gold/10 text-accent-gold flex items-center justify-center text-xs font-bold">3</div>
                                    <h4 className="text-xs font-bold text-foreground">Berlatih Ojigi Terpadu</h4>
                                    <p className="text-[10px] text-gray-400 font-light leading-relaxed">
                                        Lakukan simulasi penuh di depan cermin. Berlatihlah membungkuk (ojigi) dengan sudut kemiringan punggung yang sesuai.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>

            </div>
        </div>
    );
}
