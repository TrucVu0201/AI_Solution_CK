module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/app/api/chat/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST,
    "maxDuration",
    ()=>maxDuration,
    "runtime",
    ()=>runtime
]);
const runtime = "nodejs";
const maxDuration = 90;
function findText(value) {
    if (typeof value === "string") {
        return value.trim();
    }
    if (Array.isArray(value)) {
        for (const item of value){
            const text = findText(item);
            if (text) {
                return text;
            }
        }
        return "";
    }
    if (value && typeof value === "object") {
        const objectValue = value;
        const preferredKeys = [
            "answer",
            "final_answer",
            "finalAnswer",
            "text",
            "result",
            "output",
            "response",
            "output_text",
            "result_text"
        ];
        for (const key of preferredKeys){
            const text = findText(objectValue[key]);
            if (text) {
                return text;
            }
        }
        for (const nestedValue of Object.values(objectValue)){
            const text = findText(nestedValue);
            if (text) {
                return text;
            }
        }
    }
    return "";
}
async function POST(req) {
    try {
        const body = await req.json();
        const query = typeof body.query === "string" ? body.query.trim() : "";
        const conversationId = typeof body.conversation_id === "string" ? body.conversation_id.trim() : "";
        if (!query) {
            return Response.json({
                error: "Câu hỏi trống"
            }, {
                status: 400
            });
        }
        const difyApiKey = process.env.DIFY_API_KEY?.trim();
        const difyBaseUrl = process.env.DIFY_BASE_URL?.trim();
        console.log("Có Dify key:", Boolean(difyApiKey));
        console.log("Dify Base URL:", difyBaseUrl);
        if (!difyApiKey || !difyBaseUrl) {
            return Response.json({
                answer: 'Đây là câu trả lời giả cho câu hỏi: "' + query + '"',
                conversation_id: conversationId || "mock-conversation-id"
            });
        }
        const cleanBaseUrl = difyBaseUrl.replace(/\/$/, "");
        const apiUrl = cleanBaseUrl + "/chat-messages";
        console.log("Đang gọi Dify tại:", apiUrl);
        const startedAt = Date.now();
        const difyRes = await fetch(apiUrl, {
            method: "POST",
            headers: {
                Authorization: "Bearer " + difyApiKey,
                "Content-Type": "application/json",
                Accept: "text/event-stream"
            },
            body: JSON.stringify({
                inputs: {},
                query: query,
                response_mode: "streaming",
                conversation_id: conversationId,
                user: "web-demo-user"
            }),
            cache: "no-store"
        });
        console.log("Thời gian nhận header từ Dify:", Date.now() - startedAt + " ms");
        console.log("HTTP status từ Dify:", difyRes.status);
        console.log("Content-Type từ Dify:", difyRes.headers.get("content-type"));
        if (!difyRes.ok) {
            const errorText = await difyRes.text();
            console.error("Dify error:", {
                status: difyRes.status,
                body: errorText
            });
            return Response.json({
                error: "Chatbot đang gặp sự cố, vui lòng thử lại."
            }, {
                status: difyRes.status
            });
        }
        if (!difyRes.body) {
            return Response.json({
                error: "Dify không trả về dữ liệu."
            }, {
                status: 500
            });
        }
        const reader = difyRes.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let answer = "";
        let returnedConversationId = conversationId;
        let finished = false;
        let streamError = "";
        function processLine(rawLine) {
            const line = rawLine.trim();
            if (!line.startsWith("data:")) {
                return;
            }
            const jsonText = line.slice(5).trim();
            if (!jsonText || jsonText === "[DONE]") {
                return;
            }
            try {
                const eventData = JSON.parse(jsonText);
                console.log("Dify event:", eventData.event);
                if (eventData.conversation_id) {
                    returnedConversationId = eventData.conversation_id;
                }
                if (eventData.data?.conversation_id) {
                    returnedConversationId = eventData.data.conversation_id;
                }
                if (eventData.event === "message" || eventData.event === "agent_message") {
                    answer += eventData.answer || "";
                }
                if (eventData.event === "workflow_finished") {
                    const outputs = eventData.data?.outputs;
                    console.log("Workflow outputs:", JSON.stringify(outputs, null, 2));
                    const workflowAnswer = findText(outputs);
                    if (workflowAnswer) {
                        answer = workflowAnswer;
                    }
                    finished = true;
                }
                if (eventData.event === "message_end") {
                    finished = true;
                }
                if (eventData.event === "error") {
                    streamError = eventData.message || eventData.data?.error || "Dify trả về lỗi trong stream.";
                    finished = true;
                }
            } catch (error) {
                console.error("Không đọc được dòng stream:", error, jsonText);
            }
        }
        while(!finished){
            const result = await reader.read();
            if (result.done) {
                break;
            }
            buffer += decoder.decode(result.value, {
                stream: true
            });
            const lines = buffer.split(/\r?\n/);
            buffer = lines.pop() || "";
            for (const line of lines){
                processLine(line);
                if (finished) {
                    break;
                }
            }
        }
        buffer += decoder.decode();
        if (buffer.trim()) {
            const remainingLines = buffer.split(/\r?\n/);
            for (const line of remainingLines){
                processLine(line);
            }
        }
        await reader.cancel().catch(()=>undefined);
        console.log("Tổng thời gian Dify hoàn tất:", Date.now() - startedAt + " ms");
        console.log("Có lấy được answer:", Boolean(answer.trim()));
        if (streamError) {
            return Response.json({
                error: streamError
            }, {
                status: 500
            });
        }
        if (!answer.trim()) {
            return Response.json({
                error: "Dify đã chạy xong nhưng không tìm thấy nội dung câu trả lời."
            }, {
                status: 500
            });
        }
        return Response.json({
            answer: answer.trim(),
            conversation_id: returnedConversationId || conversationId
        });
    } catch (error) {
        console.error("Server error:", error);
        return Response.json({
            error: "Có lỗi xảy ra, vui lòng thử lại."
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__15rxpuv._.js.map