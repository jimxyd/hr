import { NextRequest } from "next/server"
import { auth } from "@/lib/auth/config"
import { getTenantPrisma } from "@/lib/prisma/tenant"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return new Response("Unauthorized", { status: 401 })

  const db = getTenantPrisma(session.user.tenantDbName!)
  const userId = session.user.id

  const encoder = new TextEncoder()
  let intervalId: NodeJS.Timeout

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}

`))
      }

      // Send initial unread count
      const sendUnread = async () => {
        try {
          const count = await db.notification.count({ where: { userId, isRead: false } })
          send({ type: "unread_count", count })
        } catch (e) {
          // Ignore errors on closed stream
        }
      }

      sendUnread()
      // Poll every 30 seconds
      intervalId = setInterval(sendUnread, 30000)
    },
    cancel() {
      clearInterval(intervalId)
    }
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  })
}
