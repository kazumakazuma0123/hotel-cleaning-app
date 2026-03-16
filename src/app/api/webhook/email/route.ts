import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
    try {
        // Authentication check (X-Webhook-Secret header)
        const secret = req.headers.get("X-Webhook-Secret");
        if (secret !== process.env.WEBHOOK_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData().catch(() => null);
        let subject = "";
        let body = "";

        if (formData) {
            subject = formData.get("subject") as string;
            body = formData.get("text") as string;
        } else {
            // Handle JSON from GAS
            const json = await req.json().catch(() => ({}));
            subject = json.subject || "";
            body = json.body || "";
        }

        if (!body) {
            return NextResponse.json({ error: "Missing body" }, { status: 400 });
        }

        console.log("Received Email Webhook:", subject);

        // Parsing logic for Temairazu
        if (subject.includes("予約通知") || subject.includes("予約確定")) {
            await handleNewBooking(body);
        } else if (subject.includes("キャンセル")) {
            await handleCancellation(body);
        }

        return NextResponse.json({ message: "OK" });
    } catch (err) {
        console.error("Webhook Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

async function handleNewBooking(body: string) {
    // Flexible parsing strategy for different OTAs
    let reservation_number = "";
    let room_id = "";
    let check_in_datetime: Date | null = null;
    let check_out_datetime: Date | null = null;
    let guest_count: number | null = null;
    let total_nights: number | null = null;

    // 1. Reservation Number
    const resMatch = body.match(/(?:予約番号|Reservation (?:Number|ID))[:：]\s*(\w+)/i);
    if (resMatch) reservation_number = resMatch[1];

    // 2. Room ID (Looking for "001", "002", "005")
    const roomMatch = body.match(/(?:客室(?:名|番号)|Room(?: Name| Number| #)?)[:：]\s*(\d{3})/i);
    if (roomMatch) room_id = roomMatch[1];

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


        if (error) console.error("DB Update Error (New):", error.message);
    }
}

async function handleCancellation(body: string) {
    const resMatch = body.match(/(?:予約番号|Reservation (?:Number|ID))[:：]\s*(\w+)/i);

    if (resMatch) {
        const reservation_number = resMatch[1];

        const { error } = await supabase
            .from("bookings")
            .update({ status: "cancelled", updated_at: new Date().toISOString() })
            .eq("reservation_number", reservation_number);

        if (error) console.error("DB Update Error (Cancel):", error.message);
    }
}

