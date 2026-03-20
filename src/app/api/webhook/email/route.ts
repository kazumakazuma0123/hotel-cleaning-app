import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
    try {
        // Authentication check (X-Webhook-Secret header)
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

        // Parsing logic for Temairazu
        let result: { action: string; parsed: Record<string, unknown> };
        if (subject.includes("予約通知") || subject.includes("予約確定")) {
            result = await handleNewBooking(body);
        } else if (subject.includes("キャンセル")) {
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
    // 「ヴィラ1」「ヴィラ２」「Villa 5」などからRoom IDを解決
    const villaMatch = text.match(/(?:ヴィラ|ビラ|villa)\s*([０-９\d]+)/i);
    if (villaMatch) {
        // 全角数字を半角に変換
        const num = villaMatch[1].replace(/[０-９]/g, (c) =>
            String.fromCharCode(c.charCodeAt(0) - 0xFEE0)
        );
        if (VILLA_TO_ROOM[num]) return VILLA_TO_ROOM[num];
    }

    // 「客室番号: 001」形式
    const roomMatch = text.match(/(?:客室(?:名|番号)|Room(?: Name| Number| #)?)[:：]\s*(\d{3})/i);
    if (roomMatch) return roomMatch[1];

    return "";
}

async function handleNewBooking(body: string) {
    let reservation_number = "";
    let check_in_datetime: Date | null = null;
    let check_out_datetime: Date | null = null;
    let guest_count: number | null = null;
    let total_nights: number | null = null;

    // 1. Reservation Number
    const resMatch = body.match(/(?:予約番号|Reservation (?:Number|ID))[:：]\s*(\w+)/i);
    if (resMatch) reservation_number = resMatch[1];

    // 2. Room ID（ヴィラ名 or 客室番号）
    const room_id = resolveRoomId(body);

    // 3. Guest Count
    const guestMatch = body.match(/(?:宿泊人数|Guests|Adults)[:：]\s*(\d+)/i);
    if (guestMatch) guest_count = parseInt(guestMatch[1], 10);

    // 4. Check-in / Check-out Dates
    const checkInMatch = body.match(/(?:チェックイン(?:日|予定)|Check-?in(?: Date)?)[:：]\s*([\d\-\/ :]+)/i);
    const checkOutMatch = body.match(/(?:チェックアウト(?:日|予定)|Check-?out(?: Date)?)[:：]\s*([\d\-\/ :]+)/i);

    if (checkInMatch) check_in_datetime = new Date(checkInMatch[1]);
    if (checkOutMatch) check_out_datetime = new Date(checkOutMatch[1]);

    // 5. Calculate Total Nights
    if (check_in_datetime && check_out_datetime) {
        const diffTime = Math.abs(check_out_datetime.getTime() - check_in_datetime.getTime());
        total_nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const parsed = { reservation_number, room_id, guest_count, check_in: checkInMatch?.[1] || null, check_out: checkOutMatch?.[1] || null };

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
    const resMatch = body.match(/(?:予約番号|Reservation (?:Number|ID))[:：]\s*(\w+)/i);

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

    return { action: "cancel_parse_failed", parsed: { reason: "予約番号が見つからない" } };
}

