// File này chạy ở PHÍA SERVER (không phải trình duyệt), nên giấu được API Key an toàn.
// Việc của Yên: chỉ cần hiểu hàm POST bên dưới làm gì, không cần sửa nhiều.

export async function POST(req: Request) {
  try {
    // 1. Lấy câu hỏi và conversation_id mà Thư gửi từ giao diện lên
    const { query, conversation_id } = await req.json();

    if (!query || query.trim() === "") {
      return Response.json({ error: "Câu hỏi trống" }, { status: 400 });
    }

    // 2. Gọi sang Dify API (key lấy từ .env.local, không lộ ra ngoài)
    const difyRes = await fetch(`${process.env.DIFY_BASE_URL}/chat-messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DIFY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {},
        query: query,
        response_mode: "blocking",
        conversation_id: conversation_id || "",
        user: "web-demo-user",
      }),
    });

    // 3. Nếu Dify trả lỗi (sai key, sai base url, server Dify die...) thì báo lỗi rõ ràng
    if (!difyRes.ok) {
      const errText = await difyRes.text();
      console.error("Dify error:", errText);
      return Response.json(
        { error: "Chatbot đang gặp sự cố, thử lại sau." },
        { status: 500 }
      );
    }

    // 4. Lấy câu trả lời và trả về cho giao diện hiển thị
    const data = await difyRes.json();
    return Response.json({
      answer: data.answer,
      conversation_id: data.conversation_id,
    });
  } catch (err) {
    console.error("Server error:", err);
    return Response.json(
      { error: "Có lỗi xảy ra, vui lòng thử lại." },
      { status: 500 }
    );
  }
}
