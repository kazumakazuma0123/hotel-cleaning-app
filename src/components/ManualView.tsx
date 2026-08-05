import Link from "next/link";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import fs from "node:fs";
import path from "node:path";
import { parseVillaRules, type InlineToken } from "@/lib/parseVillaRules";

function renderInline(tokens: InlineToken[]) {
    return tokens.map((t, i) => {
        if (t.type === "highlight") {
            return (
                <span key={i} className="text-black bg-gray-200 px-2 py-0.5 rounded font-bold">
                    {t.value}
                </span>
            );
        }
        return <span key={i}>{t.value}</span>;
    });
}

type ManualViewProps = {
    /** src/content 配下のファイル名（例: "villa-rules.md"） */
    contentFile: string;
    /** ヘッダーに表示するタイトル（例: "Villa Rules"） */
    title: string;
};

export default function ManualView({ contentFile, title }: ManualViewProps) {
    const filePath = path.join(process.cwd(), "src/content", contentFile);
    const markdown = fs.readFileSync(filePath, "utf8");
    const { sections } = parseVillaRules(markdown);

    return (
        <div className="bg-[#fdfdfd] min-h-screen pb-32">
            {/* Top App Bar */}
            <div className="bg-[#fdfdfd] sticky top-0 z-40 px-6 h-16 flex items-center justify-between">
                <Link href="/manual" className="flex items-center text-black active:opacity-50 transition-opacity -ml-2">
                    <ChevronLeft className="w-8 h-8" strokeWidth={1.5} />
                </Link>
                <span className="font-bold text-black text-lg tracking-tight">
                    {title}
                </span>
                <div className="w-8"></div>
            </div>

            <div className="px-6 pt-4 space-y-6">
                {sections.map((section) => (
                    <section key={section.number} className="bg-[#f2f2f2] rounded-[32px] p-8">
                        <h2 className="text-2xl font-bold text-black tracking-tight mb-6 flex items-baseline gap-3">
                            <span className="text-gray-400 text-sm font-medium tracking-widest uppercase">
                                {section.number}
                            </span>
                            {section.title}
                        </h2>
                        <ul className="space-y-6">
                            {section.items.map((item, idx) => (
                                <li key={idx}>
                                    {item.title && (
                                        <h3 className="font-bold text-black text-base mb-2">{item.title}</h3>
                                    )}
                                    {item.bullets.length > 0 && (
                                        <ul
                                            className={`list-disc pl-5 text-sm text-gray-500 space-y-2 leading-relaxed ${
                                                item.images.length > 0 ? "mb-4" : ""
                                            }`}
                                        >
                                            {item.bullets.map((bullet, bi) => (
                                                <li
                                                    key={bi}
                                                    className={bullet.depth > 0 ? "list-[circle] text-gray-400" : ""}
                                                    style={bullet.depth > 0 ? { marginLeft: bullet.depth * 20 } : undefined}
                                                >
                                                    {renderInline(bullet.tokens)}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    {item.images.map((img, ii) => (
                                        <div key={ii} className={ii > 0 ? "mt-4" : ""}>
                                            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-2">
                                                <Image
                                                    src={img.src}
                                                    alt={img.caption}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <p className="text-xs text-center text-gray-400 font-medium">
                                                {img.caption}
                                            </p>
                                        </div>
                                    ))}
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
        </div>
    );
}
