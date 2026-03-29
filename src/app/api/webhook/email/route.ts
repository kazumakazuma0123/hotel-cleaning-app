import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
    try {
        const secret = req.headers.get("X-Webhook-Secret");
        if (secret !== process.env.WEBHOOK_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let subject = "";
        let body = "";
        const contentType = req.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            const json = await req.json().catch(() => ({}));
            subject = json.subject || "";
            body = json.body || "";
        } else {
            const formData = await req.formData().catch(() => null);
            if (formData) {
                subject = (formData.get("subject") as string) || "";
                body = (formData.get("text") as string) || "";
            }
        }

        if (!body) {
            return NextResponse.json({ error: "Missing body" }, { status: 400 });
        }

        console.log("Received Email Webhook:", subject);

        let result: { action: string; parsed: Record<string, unknown> };
        if (subject.includes("予約通知") || subject.includes("予約確定")) {
            result = await handleNewBooking(body);
        } else if (subject.includes("キャンセル") || subject.includes("ＣＸＬ")) {
            result = await handleCancellation(body);
        } else {
            result = { action: "skipped", parsed: { reason: "件名が予約通知/予約確定/キャンセルに該当しない", subject } };
        }

        return NextResponse.json({ message: "OK", ...result });
    } catch (err) {
        console.error("Webhook Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// ヴィラ名 → Room ID マッピング
const VILLA_TO_ROOM: Record<string, string> = {
    "1": "001",
    "2": "002",
    "5": "005",
};

function resolveRoomId(text: string): string {
    const villaMatch = text.match(/(?:ヴィラ|ビラ|villa)\s*([０-９\d]+)/i);
    if (villaMatch) {
        const num = villaMatch[1].replace(/[０-９]/g, (c) =>
            String.fromCharCode(c.charCodeAt(0) - 0xFEE0)
        );
        if (VILLA_TO_ROOM[num]) return VILLA_TO_ROOM[num];
    }
    const roomMatch = text.match(/(?:客室(?:名|番号)|Room(?: Name| Number| #)?)[:：]\s*(\d{3})/i);
    if (roomMatch) return roomMatch[1];
    return "";
}

// 全角スペース・タブ・半角スペースを含むフレキシブルな区切りパターン
const SEP = "[\\s\\t　]*[:：][\\s\\t　]*";

async function handleNewBooking(body: string) {
    let reservation_number = "";
    let check_in_datetime: Date | null = null;
    let check_out_datetime: Date | null = null;
    let guest_count: number | null = null;
    let total_nights: number | null = null;

    // 1. 予約番号
    // じゃらん: 予約番号　　　　　　　：0HMFX0NH
    // 楽天:     予約番号\t: RYa0mdymde
    const resMatch = body.match(new RegExp(`予約番号${SEP}(\\S+)`));
    if (resMatch) reservation_number = resMatch[1];

    // 2. Room ID
    const room_id = resolveRoomId(body);

    // 3. 人数
    // 楽天: 人数\t\t: 大人2人/子供2名(小学校 高学年2名)
    const rakutenGuestMatch = body.match(new RegExp(`人数${SEP}大人(\\d+)人(?:\\/子供(\\d+)名)?`));
    if (rakutenGuestMatch) {
        guest_count = parseInt(rakutenGuestMatch[1], 10);
        if (rakutenGuestMatch[2]) guest_count += parseInt(rakutenGuestMatch[2], 10);
    }
    // じゃらん: 大人人数：2名 or 利用人数：2名
    if (guest_count === null) {
        const jalanAdult = body.match(new RegExp(`(?:大人|利用)(?:人数)?${SEP}(\\d+)`));
        const jalanChild = body.match(new RegExp(`(?:子供|小人)(?:人数)?${SEP}(\\d+)`));
        if (jalanAdult) {
            guest_count = parseInt(jalanAdult[1], 10);
            if (jalanChild) guest_count += parseInt(jalanChild[1], 10);
        }
    }
    // フォールバック: 宿泊人数: 2
    if (guest_count === null) {
        const simpleMatch = body.match(new RegExp(`宿泊人数${SEP}(\\d+)`));
        if (simpleMatch) guest_count = parseInt(simpleMatch[1], 10);
    }

    // 4. チェックイン / チェックアウト
    // 楽天: チェックイン日時\t: 2026-03-28 17:00
    const rakutenCheckIn = body.match(new RegExp(`チェックイン日時${SEP}(\\d{4}-\\d{2}-\\d{2})\\s*(\\d{2}:\\d{2})?`));
    const rakutenCheckOut = body.match(new RegExp(`チェックアウト日時${SEP}(\\d{4}-\\d{2}-\\d{2})\\s*(\\d{2}:\\d{2})?`));

    if (rakutenCheckIn) {
        const time = rakutenCheckIn[2] || "15:00";
        check_in_datetime = new Date(`${rakutenCheckIn[1]}T${time}:00`);
    }
    if (rakutenCheckOut) {
        const time = rakutenCheckOut[2] || "10:00";
        check_out_datetime = new Date(`${rakutenCheckOut[1]}T${time}:00`);
    }

    // じゃらん: 宿泊日時　：2026年07月27日(月)18:00 ～ 10:00
    if (!check_in_datetime) {
        const jalanMatch = body.match(new RegExp(
            `宿泊日時${SEP}(\\d{4})年(\\d{2})月(\\d{2})日\\([^)]*\\)\\s*(\\d{2}:\\d{2})\\s*～\\s*(\\d{2}:\\d{2})`
        ));
        if (jalanMatch) {
            check_in_datetime = new Date(`${jalanMatch[1]}-${jalanMatch[2]}-${jalanMatch[3]}T${jalanMatch[4]}:00`);
        }
    }

    // 5. 泊数
    const nightsMatch = body.match(/泊数[\s\t　]*[:：]?\s*(\d+)泊/);
    if (nightsMatch) total_nights = parseInt(nightsMatch[1], 10);

    // チェックアウト日を泊数から計算（じゃらん等、チェックアウト日時がない場合）
    if (check_in_datetime && !check_out_datetime && total_nights) {
        check_out_datetime = new Date(check_in_datetime);
        check_out_datetime.setDate(check_out_datetime.getDate() + total_nights);
        const checkoutTimeMatch = body.match(/～\s*(\d{2}:\d{2})/);
        const [h, m] = (checkoutTimeMatch ? checkoutTimeMatch[1] : "10:00").split(":").map(Number);
        check_out_datetime.setHours(h, m, 0, 0);
    }

    // 泊数を日付差から計算
    if (!total_nights && check_in_datetime && check_out_datetime) {
        const diffTime = Math.abs(check_out_datetime.getTime() - check_in_datetime.getTime());
        total_nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const parsed = {
        reservation_number,
        room_id,
        guest_count,
        check_in: check_in_datetime?.toISOString() || null,
        check_out: check_out_datetime?.toISOString() || null,
        total_nights,
    };

    if (reservation_number && room_id && check_in_datetime) {
        const { error } = await supabase.from("bookings").upsert({
            reservation_number,
            room_id,
            check_in_datetime,
            check_out_datetime,
            guest_count,
            total_nights,
            status: "confirmed",
            updated_at: new Date().toISOString(),
        });

        if (error) {
            console.error("DB Update Error (New):", error.message);
            return { action: "booking_error", parsed: { ...parsed, error: error.message } };
        }
        return { action: "booking_saved", parsed };
    }

    return { action: "booking_parse_failed", parsed, body_preview: body.substring(0, 800) };
}

async function handleCancellation(body: string) {
    // 同じフレキシブルパターンで予約番号を取得
    const resMatch = body.match(new RegExp(`予約番号${SEP}(\\S+)`));

    if (resMatch) {
        const reservation_number = resMatch[1];

        const { error } = await supabase
            .from("bookings")
            .delete()
            .eq("reservation_number", reservation_number);

        if (error) {
            console.error("DB Delete Error (Cancel):", error.message);
            return { action: "cancel_error", parsed: { reservation_number, error: error.message } };
        }
        return { action: "cancel_deleted", parsed: { reservation_number } };
    }

    return { action: "cancel_parse_failed", parsed: { reason: "予約番号が見つからない" }, body_preview: body.substring(0, 800) };
}
