import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// rooms テーブルに実在する room_id の許可リスト（ヴィラ3室 + 本館5室）
const VALID_ROOM_IDS = new Set([
    "001", "002", "005",
    "101", "102", "201", "202", "203",
]);

// ヴィラ番号 → Room ID マッピング（webhook/email/route.ts の VILLA_TO_ROOM に倣う）
const VILLA_TO_ROOM: Record<string, string> = {
    "1": "001",
    "2": "002",
    "5": "005",
};

// 本館の部屋番号（roomType文字列内に部分一致で含まれていれば採用）
const MAIN_BUILDING_ROOM_IDS = ["101", "102", "201", "202", "203"];

function resolveRoomId(roomType: string): string | null {
    // 1. 「ヴィラ/ビラ/villa/Villa + 数字（全角含む）」を探す
    const villaMatch = roomType.match(/(?:ヴィラ|ビラ|villa)\s*([０-９\d]+)/i);
    if (villaMatch) {
        const num = villaMatch[1].replace(/[０-９]/g, (c) =>
            String.fromCharCode(c.charCodeAt(0) - 0xFEE0)
        );
        const resolved = VILLA_TO_ROOM[num];
        if (resolved) return resolved;
    }

    // 2. 本館の部屋番号が部分一致で含まれるか
    for (const roomId of MAIN_BUILDING_ROOM_IDS) {
        if (roomType.includes(roomId)) {
            return roomId;
        }
    }

    // 3. どちらにも該当しなければ未割当
    return null;
}

interface BookingPayload {
    action: "upsert" | "cancel";
    reservationNumber: string;
    channel?: string;
    roomType?: string;
    checkIn?: string;
    checkOut?: string;
    nights?: number;
    guests?: number;
    guestName?: string;
}

export async function POST(req: NextRequest) {
    try {
        const secret = req.headers.get("X-Webhook-Secret");
        if (secret !== process.env.WEBHOOK_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = (await req.json().catch(() => null)) as BookingPayload | null;
        if (!body || (body.action !== "upsert" && body.action !== "cancel")) {
            return NextResponse.json({ error: "Invalid or missing action" }, { status: 400 });
        }

        if (body.action === "cancel") {
            return await handleCancel(body);
        }
        return await handleUpsert(body);
    } catch (err) {
        console.error("Booking Webhook Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

async function handleCancel(body: BookingPayload) {
    const { reservationNumber } = body;
    if (!reservationNumber) {
        return NextResponse.json({ error: "Missing reservationNumber" }, { status: 400 });
    }

    const { data, error } = await supabase
        .from("bookings")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("reservation_number", reservationNumber)
        .select("room_id");

    if (error) {
        console.error("DB Update Error (Cancel):", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
        return NextResponse.json({ status: "not_found" }, { status: 200 });
    }

    return NextResponse.json({ status: "ok", action: "cancel", roomId: data[0].room_id ?? null });
}

async function handleUpsert(body: BookingPayload) {
    const { reservationNumber, checkIn, channel, roomType, checkOut, nights, guests, guestName } = body;

    if (!reservationNumber || !checkIn) {
        return NextResponse.json({ error: "Missing reservationNumber or checkIn" }, { status: 400 });
    }

    let roomId = roomType ? resolveRoomId(roomType) : null;
    if (roomId && !VALID_ROOM_IDS.has(roomId)) {
        roomId = null;
    }

    const { error } = await supabase.from("bookings").upsert(
        {
            reservation_number: reservationNumber,
            room_id: roomId,
            check_in_datetime: checkIn,
            check_out_datetime: checkOut ?? null,
            guest_count: guests ?? null,
            total_nights: nights ?? null,
            channel: channel ?? null,
            room_type: roomType ?? null,
            guest_name: guestName ?? null,
            status: "confirmed",
            updated_at: new Date().toISOString(),
        },
        { onConflict: "reservation_number" }
    );

    if (error) {
        console.error("DB Upsert Error (Booking):", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const response: { status: string; action: string; roomId: string | null; unassigned?: boolean } = {
        status: "ok",
        action: "upsert",
        roomId,
    };
    if (roomId === null) {
        response.unassigned = true;
    }

    return NextResponse.json(response);
}
