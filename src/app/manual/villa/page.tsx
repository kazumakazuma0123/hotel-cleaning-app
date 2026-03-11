import Link from "next/link";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";

export default function VillaManual() {
    return (
        <div className="bg-[#fdfdfd] min-h-screen pb-32">
            {/* Top App Bar */}
            <div className="bg-[#fdfdfd] sticky top-0 z-40 px-6 h-16 flex items-center justify-between">
                <Link href="/manual" className="flex items-center text-black active:opacity-50 transition-opacity -ml-2">
                    <ChevronLeft className="w-8 h-8" strokeWidth={1.5} />
                </Link>
                <span className="font-bold text-black text-lg tracking-tight">
                    Villa Rules
                </span>
                <div className="w-8"></div> {/* Spacer */}
            </div>

            <div className="px-6 pt-4 space-y-6">

                {/* Section 1 */}
                <section className="bg-[#f2f2f2] rounded-[32px] p-8">
                    <h2 className="text-2xl font-bold text-black tracking-tight mb-6 flex items-baseline gap-3">
                        <span className="text-gray-400 text-sm font-medium tracking-widest uppercase">01</span>
                        入室と準備
                    </h2>
                    <ul className="space-y-6">
                        <li>
                            <h3 className="font-bold text-black text-base mb-2">入室マナーと安全確認</h3>
                            <ul className="list-disc pl-5 text-sm text-gray-500 space-y-2 leading-relaxed">
                                <li>ドアを3回ノックし、声をかけてから入室する。</li>
                                <li>照明・エアコンを全て稼働し、電球切れや設備（エアコン、換気扇）の不具合がないか確認する。</li>
                            </ul>
                        </li>
                        <li>
                            <h3 className="font-bold text-black text-base mb-2">換気の実施</h3>
                            <ul className="list-disc pl-5 text-sm text-gray-500 space-y-2 leading-relaxed">
                                <li>窓を全開にして空気の入れ替えを行う。</li>
                                <li>カーテンを開け、汚れやフックの外れがないか確認する。</li>
                            </ul>
                        </li>
                    </ul>
                </section>

                {/* Section 2 */}
                <section className="bg-[#f2f2f2] rounded-[32px] p-8">
                    <h2 className="text-2xl font-bold text-black tracking-tight mb-6 flex items-baseline gap-3">
                        <span className="text-gray-400 text-sm font-medium tracking-widest uppercase">02</span>
                        剥ぎ取り・ゴミ回収
                    </h2>
                    <ul className="space-y-6">
                        <li>
                            <h3 className="font-bold text-black text-base mb-2">忘れ物の確認</h3>
                            <ul className="list-disc pl-5 text-sm text-gray-500 space-y-2 leading-relaxed">
                                <li>ベッドと壁の間全ての引き出し・コンセント・冷蔵庫の中を確認する。</li>
                                <li>忘れ物発見時は、発見場所と日時を記録し、倉庫に保管。</li>
                            </ul>
                        </li>
                        <li>
                            <h3 className="font-bold text-black text-base mb-2">ゴミの回収と分別</h3>
                            <ul className="list-disc pl-5 text-sm text-gray-500 space-y-2 leading-relaxed">
                                <li>全てのゴミを回収し、ゴミ箱の内部に汚れがあれば拭き取る。</li>
                                <li>新しいゴミ袋をシワがないようにセットする。</li>
                            </ul>
                        </li>
                        <li>
                            <h3 className="font-bold text-black text-base mb-2">使用済みリネンの剥ぎ取り</h3>
                            <ul className="list-disc pl-5 text-sm text-gray-500 space-y-2 leading-relaxed">
                                <li>シーツ、枕カバー、デュベカバー（掛け布団カバー）を剥がす。</li>
                                <li>使用済みのタオル類、バスマット、ガウンを回収する。</li>
                                <li>回収時に血液や大きなシミがないか確認し、汚損がある場合は別袋に入れる。</li>
                            </ul>
                        </li>
                        <li>
                            <h3 className="font-bold text-black text-base mb-2">使用済み食器類の回収</h3>
                            <ul className="list-disc pl-5 text-sm text-gray-500 space-y-2 leading-relaxed">
                                <li><span className="text-black bg-gray-200 px-2 py-0.5 rounded font-bold">ヴィラ1のみキッチン用品は回収せずに洗う。</span></li>
                                <li>使用済みうがい用グラス・ティー用カップを回収する。</li>
                            </ul>
                        </li>
                    </ul>
                </section>

                {/* Section 3 */}
                <section className="bg-[#f2f2f2] rounded-[32px] p-8">
                    <h2 className="text-2xl font-bold text-black tracking-tight mb-6 flex items-baseline gap-3">
                        <span className="text-gray-400 text-sm font-medium tracking-widest uppercase">03</span>
                        水回りの清掃
                    </h2>
                    <ul className="space-y-6">
                        <li>
                            <h3 className="font-bold text-black text-base mb-2">バスルーム</h3>
                            <ul className="list-disc pl-5 text-sm text-gray-500 space-y-2 leading-relaxed">
                                <li>浴槽をバス用ブラシで洗浄する。</li>
                                <li>排水溝の髪の毛を取り除き、ブラシで磨く。</li>
                                <li>水づまりがないかを確認し、詰まりがある場合はパイプユニッシュを実施する。</li>
                            </ul>
                        </li>
                        <li>
                            <h3 className="font-bold text-black text-base mb-2">洗面台の洗浄とアメニティ</h3>
                            <ul className="list-disc pl-5 text-sm text-gray-500 space-y-2 leading-relaxed mb-4">
                                <li>洗面、壁面、床面をスポンジで洗浄し、水で流す。</li>
                                <li>排水口の髪の毛を取り除き、受け皿を洗浄する。</li>
                                <li>金属部分（蛇口、シャワーヘッド）と鏡を磨き、水垢を完全に除去する。</li>
                                <li>鏡の汚れを拭き後が残らないように拭き取る。</li>
                            </ul>
                            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-2">
                                <Image
                                    src="/images/manual/amenities.jpg"
                                    alt="洗面台のアメニティ配置"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <p className="text-xs text-center text-gray-400 font-medium">指定の配置でアメニティをセット</p>
                        </li>
                        <li>
                            <h3 className="font-bold text-black text-base mb-2">トイレの清掃</h3>
                            <ul className="list-disc pl-5 text-sm text-gray-500 space-y-2 leading-relaxed">
                                <li>便器の内側（縁裏含む）をブラシで洗浄する。</li>
                                <li>便座、蓋、レバー、温水洗浄便座のノズルを丁寧に拭き上げる。</li>
                                <li>トイレットペーパーを補充する（ホルダー1＋予備1）。</li>
                                <li>トイレ清掃完了後、清掃済みの証としてトイレットペーパーを三角に折る。</li>
                            </ul>
                        </li>
                        <li>
                            <h3 className="font-bold text-black text-base mb-2">乾燥と仕上げ</h3>
                            <ul className="list-disc pl-5 text-sm text-gray-500 space-y-2 leading-relaxed">
                                <li>乾いた布（ダスター）で、水滴が一点も残らないよう完全に拭き上げる。</li>
                                <li>鏡やクローム部分を、曇りがないよう「光らせる」仕上げを行う。</li>
                            </ul>
                        </li>
                    </ul>
                </section>

                {/* Section 4 */}
                 <section className="bg-[#f2f2f2] rounded-[32px] p-8">
                    <h2 className="text-2xl font-bold text-black tracking-tight mb-6 flex items-baseline gap-3">
                        <span className="text-gray-400 text-sm font-medium tracking-widest uppercase">04</span>
                        ベッドメイキング
                    </h2>
                    <ul className="space-y-6">
                        <li>
                            <h3 className="font-bold text-black text-base mb-2">4-1. ベースメイキング</h3>
                            <ul className="list-disc pl-5 text-sm text-gray-500 space-y-2 leading-relaxed">
                                <li>マットレスのズレを修正し、防水マットを整える。</li>
                                <li>シーツのセンターを合わせ、縦から横の順にシワなく折り込む。</li>
                            </ul>
                        </li>
                        <li>
                            <h3 className="font-bold text-black text-base mb-2">4-2. デュベ（掛け布団）と枕</h3>
                            <ul className="list-disc pl-5 text-sm text-gray-500 space-y-2 leading-relaxed">
                                <li>カバーをかけた掛け布団をセットし、表面にシワが寄らないよう伸ばす。</li>
                                <li>枕の形を整え、ケースの折口を下向きで配置する。</li>
                            </ul>
                        </li>
                    </ul>
                </section>

                {/* Section 5 */}
                <section className="bg-[#f2f2f2] rounded-[32px] p-8">
                    <h2 className="text-2xl font-bold text-black tracking-tight mb-6 flex items-baseline gap-3">
                        <span className="text-gray-400 text-sm font-medium tracking-widest uppercase">05</span>
                        拭き上げと備品管理
                    </h2>
                    <ul className="space-y-6">
                        <li>
                            <h3 className="font-bold text-black text-base mb-2">埃取り</h3>
                            <ul className="list-disc pl-5 text-sm text-gray-500 space-y-2 leading-relaxed">
                                <li>高い場所（鴨居、棚の上）から低い場所へ順に埃を払う。</li>
                                <li>テレビ画面、リモコン、電話機を専用の布で拭き上げる。</li>
                                <li>粘着ローラー（コロコロ）をかけ、髪の毛や糸くずを完全に取り除く。</li>
                            </ul>
                        </li>
                        <li>
                            <h3 className="font-bold text-black text-base mb-2">除菌と整理</h3>
                            <ul className="list-disc pl-5 text-sm text-gray-500 space-y-2 leading-relaxed mb-4">
                                <li>ゲストが頻繁に触れる箇所（ドアノブ、スイッチ、リモコン）をアルコール除菌する。</li>
                                <li>手で触れる部分を水拭きするテーブル・デスクを青いダスターを使用。</li>
                                <li>テッシュケース・リモコン・ガイドブックを規定の位置に整列させる。</li>
                            </ul>
                            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-2">
                                <Image
                                    src="/images/manual/hairdryer.jpg"
                                    alt="ドライヤーの配置"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <p className="text-xs text-center text-gray-400 font-medium mb-6">ドライヤーはカゴに収納しコードをまとめる</p>
                        </li>
                        <li>
                            <h3 className="font-bold text-black text-base mb-2">クローゼット</h3>
                            <ul className="list-disc pl-5 text-sm text-gray-500 space-y-2 leading-relaxed mb-4">
                                <li>ハンガーの数と種類が規定通りか確認する。</li>
                                <li>ハンガー同士の間隔を均等に整える。</li>
                            </ul>
                            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-2">
                                <Image
                                    src="/images/manual/hangers.jpg"
                                    alt="クローゼットのハンガー配置"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <p className="text-xs text-center text-gray-400 font-medium pb-2">ハンガーは同じ向きに揃える</p>
                        </li>
                        <li>
                            <h3 className="font-bold text-black text-base mb-2">ティーセット・冷蔵庫</h3>
                            <ul className="list-disc pl-5 text-sm text-gray-500 space-y-2 leading-relaxed">
                                <li>使用済みのカップやグラスを洗浄し、水滴を拭き取ってセットする。</li>
                                <li>冷蔵庫内の忘れ物がないか確認する。</li>
                                <li>電気ケトルの水を捨て、内部を清掃して空にする。</li>
                                <li>ペッドボトルの水を人数分セットする。</li>
                            </ul>
                        </li>
                        <li>
                            <h3 className="font-bold text-black text-base mb-2">ソファーのセット</h3>
                            <ul className="list-disc pl-5 text-sm text-gray-500 space-y-2 leading-relaxed">
                                <li>ソファーの座面を掃除機でかける。</li>
                                <li>細かい汚れはテープで貼り付けて回収する。</li>
                                <li>シワを伸ばしながらソファーカバーを張る。</li>
                            </ul>
                        </li>
                    </ul>
                </section>

                {/* Section 6 */}
                <section className="bg-[#f2f2f2] rounded-[32px] p-8">
                    <h2 className="text-2xl font-bold text-black tracking-tight mb-6 flex items-baseline gap-3">
                        <span className="text-gray-400 text-sm font-medium tracking-widest uppercase">06</span>
                        床清掃と最終確認
                    </h2>
                    <ul className="space-y-6">
                        <li>
                            <h3 className="font-bold text-black text-base mb-2">掃除機がけ</h3>
                            <ul className="list-disc pl-5 text-sm text-gray-500 space-y-2 leading-relaxed">
                                <li>部屋の奥（窓際）から入口に向かってバックしながら掃除機をかける。</li>
                                <li>家具の下、部屋の四隅、クローゼットの中も漏れなく吸い取る。</li>
                            </ul>
                        </li>
                    </ul>
                </section>

            </div>
        </div>
    );
}
