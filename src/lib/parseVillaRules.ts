export type InlineToken =
    | { type: "text"; value: string }
    | { type: "highlight"; value: string };

export type Bullet = {
    tokens: InlineToken[];
    /** 字下げの深さ（0 = トップレベル、1 = サブ項目 …） */
    depth: number;
};

export type SubsectionItem = {
    title: string;
    bullets: Bullet[];
    images: { src: string; caption: string }[];
};

export type Section = {
    number: string;
    title: string;
    items: SubsectionItem[];
};

export type VillaRules = {
    sections: Section[];
};

function parseInline(line: string): InlineToken[] {
    const tokens: InlineToken[] = [];
    const regex = /==([^=]+)==/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(line)) !== null) {
        if (match.index > lastIndex) {
            tokens.push({ type: "text", value: line.slice(lastIndex, match.index) });
        }
        tokens.push({ type: "highlight", value: match[1] });
        lastIndex = regex.lastIndex;
    }
    if (lastIndex < line.length) {
        tokens.push({ type: "text", value: line.slice(lastIndex) });
    }
    return tokens;
}

export function parseVillaRules(markdown: string): VillaRules {
    const lines = markdown.split(/\r?\n/);
    const sections: Section[] = [];
    let currentSection: Section | null = null;
    let currentItem: SubsectionItem | null = null;

    const pushItem = () => {
        if (currentItem && currentSection) {
            currentSection.items.push(currentItem);
        }
        currentItem = null;
    };

    const pushSection = () => {
        pushItem();
        if (currentSection) sections.push(currentSection);
        currentSection = null;
    };

    for (const rawLine of lines) {
        const line = rawLine.trimEnd();

        const h2 = line.match(/^##\s+(\S+)\s+(.+)$/);
        if (h2) {
            pushSection();
            currentSection = { number: h2[1], title: h2[2].trim(), items: [] };
            continue;
        }

        const h3 = line.match(/^###\s+(.+)$/);
        if (h3) {
            pushItem();
            currentItem = { title: h3[1].trim(), bullets: [], images: [] };
            continue;
        }

        const bullet = line.match(/^(\s*)-\s+(.+)$/);
        if (bullet && currentItem) {
            // タブ or スペース2つを1段の字下げとして深さを算出（最大2段）
            const indentWidth = bullet[1].replace(/\t/g, "  ").length;
            const depth = Math.min(Math.floor(indentWidth / 2), 2);
            currentItem.bullets.push({ tokens: parseInline(bullet[2]), depth });
            continue;
        }

        const image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        if (image && currentSection) {
            const target = currentItem ?? { title: "", bullets: [], images: [] };
            target.images.push({ src: image[2], caption: image[1] });
            if (!currentItem) {
                currentSection.items.push(target);
            }
            continue;
        }
    }

    pushSection();
    return { sections };
}
